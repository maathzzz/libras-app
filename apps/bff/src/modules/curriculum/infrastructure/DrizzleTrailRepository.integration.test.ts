import { describe, expect, it } from 'vitest';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';

import {
  insertCourse,
  insertLesson,
  insertUnit,
  moveExistingTrailsBack,
} from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleTrailRepository } from './DrizzleTrailRepository';

const inRollback = useTestDatabase();

async function insertTwoTrails(tx: DbExecutor): Promise<void> {
  await moveExistingTrailsBack(tx);
  await insertCourse(tx, 'it-first-course', 1);
  await insertCourse(tx, 'it-second-course', 2);
  await insertUnit(tx, { id: 'it-first-unit', courseId: 'it-first-course', position: 1 });
  await insertUnit(tx, { id: 'it-second-unit', courseId: 'it-second-course', position: 1 });
  await insertLesson(tx, { id: 'it-first-lesson', unitId: 'it-first-unit', position: 1 });
  await insertLesson(tx, { id: 'it-second-lesson', unitId: 'it-second-unit', position: 1 });
}

describe('DrizzleTrailRepository.findById', () => {
  it(
    'returns the units and their lessons in position order',
    inRollback(async (tx) => {
      const courseId = 'it-trail-course';
      await insertCourse(tx, courseId, 1001);
      // Inserted out of order: the position decides, not the insertion.
      await insertUnit(tx, { id: 'it-trail-unit-b', courseId, position: 2 });
      await insertUnit(tx, { id: 'it-trail-unit-c', courseId, position: 3 });
      await insertUnit(tx, { id: 'it-trail-unit-a', courseId, position: 1 });
      await insertLesson(tx, { id: 'it-trail-a-2', unitId: 'it-trail-unit-a', position: 2 });
      await insertLesson(tx, { id: 'it-trail-b-1', unitId: 'it-trail-unit-b', position: 1 });
      await insertLesson(tx, { id: 'it-trail-a-1', unitId: 'it-trail-unit-a', position: 1 });

      const trail = await new DrizzleTrailRepository(tx).findById(courseId);

      expect(trail).toEqual({
        id: courseId,
        title: `Trilha ${courseId}`,
        position: 1001,
        units: [
          {
            id: 'it-trail-unit-a',
            title: 'Módulo it-trail-unit-a',
            lessons: [
              { id: 'it-trail-a-1', title: 'Lição it-trail-a-1' },
              { id: 'it-trail-a-2', title: 'Lição it-trail-a-2' },
            ],
          },
          {
            id: 'it-trail-unit-b',
            title: 'Módulo it-trail-unit-b',
            lessons: [{ id: 'it-trail-b-1', title: 'Lição it-trail-b-1' }],
          },
          // Not planned yet: kept, with no lessons.
          { id: 'it-trail-unit-c', title: 'Módulo it-trail-unit-c', lessons: [] },
        ],
      });
    }),
  );

  it(
    'returns a trail without units',
    inRollback(async (tx) => {
      await insertCourse(tx, 'it-empty-course', 1002);

      const trail = await new DrizzleTrailRepository(tx).findById('it-empty-course');

      expect(trail?.units).toEqual([]);
    }),
  );

  it(
    'returns null for an unknown trail',
    inRollback(async (tx) => {
      expect(await new DrizzleTrailRepository(tx).findById('it-missing-course')).toBeNull();
    }),
  );
});

describe('DrizzleTrailRepository.findFirst', () => {
  it(
    'returns the trail with the lowest position, with its units and lessons',
    inRollback(async (tx) => {
      await insertTwoTrails(tx);

      const trail = await new DrizzleTrailRepository(tx).findFirst();

      expect(trail).toEqual({
        id: 'it-first-course',
        title: 'Trilha it-first-course',
        position: 1,
        units: [
          {
            id: 'it-first-unit',
            title: 'Módulo it-first-unit',
            lessons: [{ id: 'it-first-lesson', title: 'Lição it-first-lesson' }],
          },
        ],
      });
    }),
  );
});

describe('DrizzleTrailRepository.findByLessonId', () => {
  it(
    'returns the trail that holds the lesson',
    inRollback(async (tx) => {
      await insertTwoTrails(tx);

      const trail = await new DrizzleTrailRepository(tx).findByLessonId('it-second-lesson');

      expect(trail?.id).toBe('it-second-course');
      expect(trail?.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id))).toEqual([
        'it-second-lesson',
      ]);
    }),
  );

  it(
    'returns null for an unknown lesson',
    inRollback(async (tx) => {
      expect(await new DrizzleTrailRepository(tx).findByLessonId('it-missing-lesson')).toBeNull();
    }),
  );
});

describe('DrizzleTrailRepository.count', () => {
  it(
    'counts every trail',
    inRollback(async (tx) => {
      const repository = new DrizzleTrailRepository(tx);
      const before = await repository.count();

      await insertTwoTrails(tx);

      expect(await repository.count()).toBe(before + 2);
    }),
  );
});
