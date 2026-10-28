import { CompleteLessonResponse } from '@libras/contracts';
import { and, eq, sql } from 'drizzle-orm';

import { LocalDate } from '../../../shared/domain/LocalDate';
import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  lessonSessions,
  userLessonProgress,
  userStats,
} from '../../../shared/infrastructure/db/schema';
import type { LessonProgressRepository } from '../domain/LessonProgressRepository';
import type {
  LessonCompletion,
  LessonSession,
  LessonSessionRepository,
} from '../domain/LessonSessionRepository';
import { Streak } from '../domain/Streak';
import type { UserStats, UserStatsRepository } from '../domain/UserStatsRepository';

// One class behind the progress repositories, like InMemoryProgressStore: saveCompletion
// writes sessions, lesson progress and stats together, so they share the same executor.
export class DrizzleProgressStore
  implements LessonSessionRepository, UserStatsRepository, LessonProgressRepository
{
  constructor(private readonly db: DbExecutor) {}

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<LessonSession | null> {
    const [row] = await this.db
      .select()
      .from(lessonSessions)
      .where(
        and(eq(lessonSessions.userId, userId), eq(lessonSessions.idempotencyKey, idempotencyKey)),
      );
    if (!row) return null;

    return {
      userId: row.userId,
      lessonId: row.lessonId,
      idempotencyKey: row.idempotencyKey,
      completedAt: row.completedAt,
      // jsonb comes back untyped: the stored response is checked before it is replayed.
      response: CompleteLessonResponse.parse(row.response),
    };
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    const [row] = await this.db.select().from(userStats).where(eq(userStats.userId, userId));
    if (!row) return null;

    return {
      userId: row.userId,
      totalXp: row.xpTotal,
      streak: Streak.restore({
        current: row.streakCurrent,
        longest: row.streakLongest,
        lastActivity: row.lastActiveDate === null ? null : LocalDate.parse(row.lastActiveDate),
      }),
    };
  }

  async findCompletedLessonIds(userId: string): Promise<ReadonlySet<string>> {
    const rows = await this.db
      .select({ lessonId: userLessonProgress.lessonId })
      .from(userLessonProgress)
      .where(eq(userLessonProgress.userId, userId));
    return new Set(rows.map((row) => row.lessonId));
  }

  // The session goes first: a repeated (user_id, idempotency_key) fails there, and the
  // rollback keeps the second retry from adding XP or a completion.
  async saveCompletion({ session, stats }: LessonCompletion): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(lessonSessions).values({
        userId: session.userId,
        lessonId: session.lessonId,
        idempotencyKey: session.idempotencyKey,
        completedAt: session.completedAt,
        response: session.response,
      });

      await tx
        .insert(userLessonProgress)
        .values({
          userId: session.userId,
          lessonId: session.lessonId,
          lastCompletedAt: session.completedAt,
        })
        .onConflictDoUpdate({
          target: [userLessonProgress.userId, userLessonProgress.lessonId],
          set: {
            completionCount: sql`${userLessonProgress.completionCount} + 1`,
            lastCompletedAt: session.completedAt,
          },
        });

      const values = {
        xpTotal: stats.totalXp,
        streakCurrent: stats.streak.current,
        streakLongest: stats.streak.longest,
        lastActiveDate: stats.streak.lastActivity?.toString() ?? null,
      };
      await tx
        .insert(userStats)
        .values({ userId: stats.userId, ...values })
        .onConflictDoUpdate({ target: userStats.userId, set: values });
    });
  }
}
