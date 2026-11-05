import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createContainer } from './container';
import { LocalDate } from './shared/domain/LocalDate';
import type { DbExecutor } from './shared/infrastructure/db/client';
import {
  insertCourse,
  insertExercise,
  insertLesson,
  insertLessonFixture,
  insertUnit,
  insertUser,
  moveExistingTrailsBack,
  signToWordExercise,
} from './shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from './shared/infrastructure/db/testing/testDatabase';
import { loadEnv } from './shared/infrastructure/env';

const inRollback = useTestDatabase();

function containerFor(tx: DbExecutor) {
  const env = loadEnv();
  return createContainer(tx, {
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
  });
}

// The real clock runs here, so today's UTC date is always within the limit.
const todayIso = () => new Date().toISOString().slice(0, 10);

describe('createContainer', () => {
  it(
    'completes a lesson against the database and replays it for the same key',
    inRollback(async (tx) => {
      const userId = await insertUser(tx);
      const lessonId = await insertLessonFixture(tx, 'container');
      const exercise = signToWordExercise('it-container-ex');
      await insertExercise(tx, { lessonId, position: 1, payload: exercise });
      const { completeLesson } = containerFor(tx);
      const input = {
        userId,
        lessonId,
        idempotencyKey: randomUUID(),
        localDate: todayIso(),
        answers: [
          { exerciseId: exercise.id, answer: { type: 'sign_to_word', optionId: 'a' } } as const,
        ],
      };

      const first = await completeLesson.execute(input);
      const retry = await completeLesson.execute(input);

      expect(first).toEqual({
        ok: true,
        value: {
          xpEarned: 15,
          streak: { current: 1, longest: 1, status: 'done_today' },
          streakIncreased: true,
          achievementsUnlocked: expect.arrayContaining([
            expect.objectContaining({ id: 'first-lesson' }),
          ]),
        },
      });
      expect(retry).toEqual(first);
    }),
  );

  it(
    'builds the home and unlocks the next unit after a completed lesson',
    inRollback(async (tx) => {
      const userId = await insertUser(tx);
      await moveExistingTrailsBack(tx);
      await insertCourse(tx, 'it-home-course', 1);
      await insertUnit(tx, { id: 'it-home-unit-1', courseId: 'it-home-course', position: 1 });
      await insertUnit(tx, { id: 'it-home-unit-2', courseId: 'it-home-course', position: 2 });
      await insertLesson(tx, { id: 'it-home-lesson-1', unitId: 'it-home-unit-1', position: 1 });
      await insertLesson(tx, { id: 'it-home-lesson-2', unitId: 'it-home-unit-2', position: 1 });
      const exercise = signToWordExercise('it-home-ex-1');
      await insertExercise(tx, { lessonId: 'it-home-lesson-1', position: 1, payload: exercise });
      await insertExercise(tx, {
        lessonId: 'it-home-lesson-2',
        position: 1,
        payload: signToWordExercise('it-home-ex-2'),
      });
      const { completeLesson, getHome, getLesson } = containerFor(tx);
      const today = todayIso();

      const lockedBefore = await getLesson.execute({ userId, lessonId: 'it-home-lesson-2' });
      await completeLesson.execute({
        userId,
        lessonId: 'it-home-lesson-1',
        idempotencyKey: randomUUID(),
        localDate: today,
        answers: [
          { exerciseId: exercise.id, answer: { type: 'sign_to_word', optionId: 'b' } } as const,
        ],
      });
      const home = await getHome.execute({ userId, today: LocalDate.parse(today) });
      const unlockedAfter = await getLesson.execute({ userId, lessonId: 'it-home-lesson-2' });

      expect(lockedBefore).toMatchObject({ ok: false, error: { code: 'LESSON_LOCKED' } });
      expect(home.trail.id).toBe('it-home-course');
      expect(home.trail.units.map((unit) => unit.lessons.map((lesson) => lesson.status))).toEqual([
        ['completed'],
        ['available'],
      ]);
      expect(home.streak).toEqual({ current: 1, longest: 1, status: 'done_today' });
      expect(home.totalXp).toBe(10);
      expect(unlockedAfter).toMatchObject({ ok: true, value: { id: 'it-home-lesson-2' } });
    }),
  );
});
