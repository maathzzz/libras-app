import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createContainer } from './container';
import {
  insertExercise,
  insertLessonFixture,
  insertUser,
  signToWordExercise,
} from './shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from './shared/infrastructure/db/testing/testDatabase';

const inRollback = useTestDatabase();

describe('createContainer', () => {
  it(
    'completes a lesson against the database and replays it for the same key',
    inRollback(async (tx) => {
      const userId = await insertUser(tx);
      const lessonId = await insertLessonFixture(tx, 'container');
      const exercise = signToWordExercise('it-container-ex');
      await insertExercise(tx, { lessonId, position: 1, payload: exercise });
      const { completeLesson } = createContainer(tx);
      const input = {
        userId,
        lessonId,
        idempotencyKey: randomUUID(),
        // The real clock runs here, so today's UTC date is always within the limit.
        localDate: new Date().toISOString().slice(0, 10),
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
        },
      });
      expect(retry).toEqual(first);
    }),
  );
});
