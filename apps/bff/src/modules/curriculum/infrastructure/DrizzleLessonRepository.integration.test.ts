import type { Exercise } from '@libras/contracts';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  insertCourse,
  insertExercise,
  insertLesson,
  insertLessonFixture,
  insertUnit,
  signToWordExercise,
} from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleLessonRepository } from './DrizzleLessonRepository';

const inRollback = useTestDatabase();

describe('DrizzleLessonRepository.findById', () => {
  it(
    'returns the lesson with its exercises in position order',
    inRollback(async (tx) => {
      const lessonId = await insertLessonFixture(tx, 'lesson');
      const first = signToWordExercise('it-lesson-ex-1');
      const second = signToWordExercise('it-lesson-ex-2');
      const third: Exercise = {
        id: 'it-lesson-ex-3',
        type: 'word_to_sign',
        word: 'Obrigado',
        options: [
          { id: 'c', images: [{ url: 'https://placeholder.invalid/c.png', alt: 'Mão aberta' }] },
          { id: 'd', images: [{ url: 'https://placeholder.invalid/d.png', alt: 'Mão fechada' }] },
        ],
        correctOptionId: 'c',
      };
      // Inserted out of order: the position decides, not the insertion.
      await insertExercise(tx, { lessonId, position: 2, payload: second });
      await insertExercise(tx, { lessonId, position: 3, payload: third });
      await insertExercise(tx, { lessonId, position: 1, payload: first });

      const lesson = await new DrizzleLessonRepository(tx).findById(lessonId);

      expect(lesson).toEqual({
        id: lessonId,
        title: `Lição ${lessonId}`,
        exercises: [first, second, third],
      });
    }),
  );

  it(
    'returns null for an unknown lesson',
    inRollback(async (tx) => {
      expect(await new DrizzleLessonRepository(tx).findById('it-missing-lesson')).toBeNull();
    }),
  );

  it(
    'rejects a stored payload that does not match the contract',
    inRollback(async (tx) => {
      const lessonId = await insertLessonFixture(tx, 'invalid');
      // Passes the database check (id and type match the columns) but not the schema.
      const payload = { ...signToWordExercise('it-invalid-ex'), correctOptionId: 'z' };
      await insertExercise(tx, { lessonId, position: 1, payload });

      await expect(new DrizzleLessonRepository(tx).findById(lessonId)).rejects.toThrow(ZodError);
    }),
  );

  it(
    'returns null for a lesson without exercises',
    inRollback(async (tx) => {
      const lessonId = await insertLessonFixture(tx, 'empty');

      expect(await new DrizzleLessonRepository(tx).findById(lessonId)).toBeNull();
    }),
  );

  it(
    'returns null for a hidden lesson and for a lesson inside a hidden unit or trail',
    inRollback(async (tx) => {
      await insertCourse(tx, 'it-hidden-course', 1000, false);
      await insertUnit(tx, {
        id: 'it-in-hidden-course',
        courseId: 'it-hidden-course',
        position: 1,
      });
      await insertCourse(tx, 'it-shown-course');
      await insertUnit(tx, { id: 'it-shown-unit', courseId: 'it-shown-course', position: 1 });
      await insertUnit(tx, {
        id: 'it-hidden-unit',
        courseId: 'it-shown-course',
        position: 2,
        visible: false,
      });
      const lessons = [
        { id: 'it-hidden-lesson', unitId: 'it-shown-unit', visible: false },
        { id: 'it-lesson-in-hidden-unit', unitId: 'it-hidden-unit', visible: true },
        { id: 'it-lesson-in-hidden-course', unitId: 'it-in-hidden-course', visible: true },
      ];
      for (const lesson of lessons) {
        await insertLesson(tx, { ...lesson, position: 1 });
        await insertExercise(tx, {
          lessonId: lesson.id,
          position: 1,
          payload: signToWordExercise(`${lesson.id}-ex`),
        });
      }

      const repository = new DrizzleLessonRepository(tx);
      for (const lesson of lessons) expect(await repository.findById(lesson.id)).toBeNull();
    }),
  );
});
