import { describe, expect, it } from 'vitest';

import {
  insertCourse,
  insertLesson,
  insertUnit,
} from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleTrailRepository } from './DrizzleTrailRepository';

const inRollback = useTestDatabase();

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
