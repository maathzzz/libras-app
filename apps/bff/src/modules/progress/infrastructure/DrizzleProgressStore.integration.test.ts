import { randomUUID } from 'node:crypto';

import type { CompleteLessonResponse } from '@libras/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { LocalDate } from '../../../shared/domain/LocalDate';
import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  lessonSessions,
  userLessonProgress,
  userStats,
} from '../../../shared/infrastructure/db/schema';
import {
  insertLessonFixture,
  insertUser,
} from '../../../shared/infrastructure/db/testing/fixtures';
import {
  postgresErrorCode,
  useTestDatabase,
} from '../../../shared/infrastructure/db/testing/testDatabase';
import type { LessonCompletion } from '../domain/LessonSessionRepository';
import { Streak } from '../domain/Streak';
import { DrizzleProgressStore } from './DrizzleProgressStore';

const inRollback = useTestDatabase();

const firstDay = LocalDate.of(2026, 10, 26);
const firstInstant = new Date('2026-10-26T15:00:00.000Z');

function response(xpEarned: number, current: number): CompleteLessonResponse {
  return {
    xpEarned,
    streak: { current, longest: current, status: 'done_today' },
    streakIncreased: true,
  };
}

interface CompletionOptions {
  idempotencyKey?: string;
  completedAt?: Date;
  totalXp?: number;
  streak?: Streak;
}

function completion(
  userId: string,
  lessonId: string,
  {
    idempotencyKey = randomUUID(),
    completedAt = firstInstant,
    totalXp = 15,
    streak = Streak.empty().registerLessonCompleted(firstDay),
  }: CompletionOptions = {},
): LessonCompletion {
  return {
    session: {
      userId,
      lessonId,
      idempotencyKey,
      completedAt,
      response: response(15, streak.current),
    },
    stats: { userId, totalXp, streak },
  };
}

async function rowsOf(tx: DbExecutor, userId: string) {
  const [sessions, progress, stats] = await Promise.all([
    tx.select().from(lessonSessions).where(eq(lessonSessions.userId, userId)),
    tx.select().from(userLessonProgress).where(eq(userLessonProgress.userId, userId)),
    tx.select().from(userStats).where(eq(userStats.userId, userId)),
  ]);
  return { sessions, progress, stats };
}

async function setUp(tx: DbExecutor) {
  const userId = await insertUser(tx);
  const lessonId = await insertLessonFixture(tx, 'progress');
  return { store: new DrizzleProgressStore(tx), userId, lessonId };
}

describe('DrizzleProgressStore.saveCompletion', () => {
  it(
    'writes the session, the lesson progress and the stats',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      const saved = completion(userId, lessonId);

      await store.saveCompletion(saved);

      const { sessions, progress, stats } = await rowsOf(tx, userId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        lessonId,
        idempotencyKey: saved.session.idempotencyKey,
        completedAt: firstInstant,
        response: saved.session.response,
      });
      expect(progress).toEqual([
        expect.objectContaining({ lessonId, completionCount: 1, lastCompletedAt: firstInstant }),
      ]);
      expect(stats).toEqual([
        expect.objectContaining({
          xpTotal: 15,
          streakCurrent: 1,
          streakLongest: 1,
          lastActiveDate: '2026-10-26',
        }),
      ]);
    }),
  );

  it(
    'adds a session, counts the completion again and replaces the stats on a redo',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      const firstStreak = Streak.empty().registerLessonCompleted(firstDay);
      const secondDay = LocalDate.of(2026, 10, 27);
      const secondInstant = new Date('2026-10-27T15:00:00.000Z');

      await store.saveCompletion(completion(userId, lessonId, { streak: firstStreak }));
      await store.saveCompletion(
        completion(userId, lessonId, {
          completedAt: secondInstant,
          totalXp: 25,
          streak: firstStreak.registerLessonCompleted(secondDay),
        }),
      );

      const { sessions, progress, stats } = await rowsOf(tx, userId);
      expect(sessions).toHaveLength(2);
      expect(progress).toEqual([
        expect.objectContaining({ completionCount: 2, lastCompletedAt: secondInstant }),
      ]);
      expect(stats).toEqual([
        expect.objectContaining({
          xpTotal: 25,
          streakCurrent: 2,
          streakLongest: 2,
          lastActiveDate: '2026-10-27',
        }),
      ]);
    }),
  );

  it(
    'persists nothing when one of the writes fails',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);

      // xp_total >= 0 rejects the last write, after the session and the progress went in.
      const failure = await store
        .saveCompletion(completion(userId, lessonId, { totalXp: -1 }))
        .catch((error: unknown) => error);

      expect(postgresErrorCode(failure)).toBe('23514');
      expect(await rowsOf(tx, userId)).toEqual({ sessions: [], progress: [], stats: [] });
    }),
  );

  it(
    'rejects a repeated idempotency key for the same user without granting anything',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      const idempotencyKey = randomUUID();
      await store.saveCompletion(completion(userId, lessonId, { idempotencyKey, totalXp: 15 }));

      // A concurrent retry that passed the lookup before the first one committed.
      const failure = await store
        .saveCompletion(completion(userId, lessonId, { idempotencyKey, totalXp: 30 }))
        .catch((error: unknown) => error);

      expect(postgresErrorCode(failure)).toBe('23505');
      const { sessions, progress, stats } = await rowsOf(tx, userId);
      expect(sessions).toHaveLength(1);
      expect(progress).toEqual([expect.objectContaining({ completionCount: 1 })]);
      expect(stats).toEqual([expect.objectContaining({ xpTotal: 15 })]);
    }),
  );

  it(
    'accepts the same idempotency key from another user',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      const otherUserId = await insertUser(tx);
      const idempotencyKey = randomUUID();

      await store.saveCompletion(completion(userId, lessonId, { idempotencyKey }));
      await store.saveCompletion(completion(otherUserId, lessonId, { idempotencyKey }));

      expect((await rowsOf(tx, userId)).sessions).toHaveLength(1);
      expect((await rowsOf(tx, otherUserId)).sessions).toHaveLength(1);
    }),
  );
});

describe('DrizzleProgressStore reads', () => {
  it(
    'finds the saved session by user and idempotency key',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      const saved = completion(userId, lessonId);
      await store.saveCompletion(saved);

      expect(await store.findByIdempotencyKey(userId, saved.session.idempotencyKey)).toEqual(
        saved.session,
      );
      expect(await store.findByIdempotencyKey(userId, randomUUID())).toBeNull();
    }),
  );

  it(
    'restores the stats with the streak and its last activity',
    inRollback(async (tx) => {
      const { store, userId, lessonId } = await setUp(tx);
      await store.saveCompletion(completion(userId, lessonId, { totalXp: 40 }));

      const stats = await store.findByUserId(userId);

      expect(stats?.totalXp).toBe(40);
      expect(stats?.streak.current).toBe(1);
      expect(stats?.streak.longest).toBe(1);
      expect(stats?.streak.lastActivity?.equals(firstDay)).toBe(true);
    }),
  );

  it(
    'returns null for a learner without stats',
    inRollback(async (tx) => {
      const { store, userId } = await setUp(tx);

      expect(await store.findByUserId(userId)).toBeNull();
    }),
  );
});
