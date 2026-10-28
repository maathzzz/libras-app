import type { LessonProgressRepository } from '../domain/LessonProgressRepository';
import type {
  LessonCompletion,
  LessonSession,
  LessonSessionRepository,
} from '../domain/LessonSessionRepository';
import type { UserStats, UserStatsRepository } from '../domain/UserStatsRepository';

// For tests: one object behind the progress repositories, so saveCompletion updates
// sessions, completed lessons and stats together, as the real transaction does.
export class InMemoryProgressStore
  implements LessonSessionRepository, UserStatsRepository, LessonProgressRepository
{
  private readonly savedSessions: LessonSession[] = [];
  private readonly statsByUser = new Map<string, UserStats>();
  private readonly completedByUser = new Map<string, Set<string>>();

  get sessions(): readonly LessonSession[] {
    return this.savedSessions;
  }

  seedStats(stats: UserStats): void {
    this.statsByUser.set(stats.userId, stats);
  }

  seedCompletedLessons(userId: string, lessonIds: readonly string[]): void {
    for (const lessonId of lessonIds) this.markCompleted(userId, lessonId);
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<LessonSession | null> {
    return (
      this.savedSessions.find(
        (session) => session.userId === userId && session.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async findByUserId(userId: string): Promise<UserStats | null> {
    return this.statsByUser.get(userId) ?? null;
  }

  async findCompletedLessonIds(userId: string): Promise<ReadonlySet<string>> {
    return new Set(this.completedByUser.get(userId));
  }

  async saveCompletion({ session, stats }: LessonCompletion): Promise<void> {
    this.savedSessions.push(session);
    this.markCompleted(session.userId, session.lessonId);
    this.statsByUser.set(stats.userId, stats);
  }

  private markCompleted(userId: string, lessonId: string): void {
    const completed = this.completedByUser.get(userId) ?? new Set<string>();
    completed.add(lessonId);
    this.completedByUser.set(userId, completed);
  }
}
