import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  lessonSessions,
  userLessonProgress,
  userStats,
} from '../../../shared/infrastructure/db/schema';
import {
  insertAuthUser,
  insertLessonFixture,
} from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import type { Profile } from '../domain/Profile';
import { DrizzleProfileRepository } from './DrizzleProfileRepository';

const inRollback = useTestDatabase();

const profileOf = (userId: string, overrides: Partial<Profile> = {}): Profile => ({
  userId,
  name: 'Ana',
  dailyGoal: 1,
  startLevel: 'beginner',
  ...overrides,
});

async function setUp(tx: DbExecutor) {
  const userId = await insertAuthUser(tx);
  return { repository: new DrizzleProfileRepository(tx), userId };
}

describe('DrizzleProfileRepository', () => {
  it(
    'returns null for a user without a profile',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);

      expect(await repository.findById(userId)).toBeNull();
    }),
  );

  it(
    'creates the profile and reads it back',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);
      const profile = profileOf(userId, { dailyGoal: 3, startLevel: 'basic' });

      expect(await repository.create(profile)).toEqual(profile);
      expect(await repository.findById(userId)).toEqual(profile);
    }),
  );

  it(
    'keeps the first profile when it is created twice',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);
      await repository.create(profileOf(userId, { name: 'Primeiro' }));

      const second = await repository.create(profileOf(userId, { name: 'Segundo' }));

      expect(second?.name).toBe('Primeiro');
    }),
  );

  it(
    'updates only the given fields and returns the profile',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);
      await repository.create(profileOf(userId));

      const updated = await repository.update(userId, { name: 'Ana Souza', dailyGoal: 8 });

      expect(updated).toEqual(profileOf(userId, { name: 'Ana Souza', dailyGoal: 8 }));
      expect(await repository.findById(userId)).toEqual(updated);
    }),
  );

  it(
    'returns null when updating a missing profile',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);

      expect(await repository.update(userId, { name: 'Ana' })).toBeNull();
    }),
  );

  it(
    'deletes the profile with all of its progress',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);
      await repository.create(profileOf(userId));
      const lessonId = await insertLessonFixture(tx, 'profile');
      const completedAt = new Date('2026-10-26T15:00:00Z');
      // Written directly: a module never imports another module's infrastructure.
      await tx.insert(lessonSessions).values({
        userId,
        lessonId,
        idempotencyKey: randomUUID(),
        completedAt,
        response: {
          xpEarned: 15,
          streak: { current: 1, longest: 1, status: 'done_today' },
          streakIncreased: true,
          achievementsUnlocked: [],
        },
      });
      await tx.insert(userLessonProgress).values({ userId, lessonId, lastCompletedAt: completedAt });
      await tx.insert(userStats).values({
        userId,
        xpTotal: 15,
        streakCurrent: 1,
        streakLongest: 1,
        lastActiveDate: '2026-10-26',
      });

      await repository.delete(userId);

      expect(await repository.findById(userId)).toBeNull();
      expect(await tx.select().from(userStats).where(eq(userStats.userId, userId))).toEqual([]);
      expect(
        await tx.select().from(lessonSessions).where(eq(lessonSessions.userId, userId)),
      ).toEqual([]);
      expect(
        await tx.select().from(userLessonProgress).where(eq(userLessonProgress.userId, userId)),
      ).toEqual([]);
    }),
  );

  it(
    'deletes nothing and does not fail for a missing profile',
    inRollback(async (tx) => {
      const { repository, userId } = await setUp(tx);

      await expect(repository.delete(userId)).resolves.toBeUndefined();
    }),
  );

  // Last statement of its test: the failed insert aborts the surrounding test transaction.
  it(
    'returns null when the Auth user no longer exists',
    inRollback(async (tx) => {
      const repository = new DrizzleProfileRepository(tx);

      expect(await repository.create(profileOf(randomUUID()))).toBeNull();
    }),
  );
});
