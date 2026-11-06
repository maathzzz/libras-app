import type { StudyPage } from '@libras/contracts';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { studies } from '../../../shared/infrastructure/db/schema';
import {
  insertCourse,
  moveExistingTrailsBack,
} from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { DrizzleStudyRepository } from './DrizzleStudyRepository';

const inRollback = useTestDatabase();

const page = (id: string): StudyPage => ({
  id,
  title: `Página ${id}`,
  blocks: [
    { type: 'text', body: 'Repita a forma da mão.' },
    {
      type: 'sign',
      label: 'A',
      images: [{ url: 'https://placeholder.invalid/a.png', alt: 'Mão fechada' }],
      description: 'Mão fechada, polegar ao lado do indicador.',
    },
  ],
});

async function insertStudy(
  tx: DbExecutor,
  { id, trailId, position, pages }: { id: string; trailId: string; position: number; pages: unknown },
) {
  await tx.insert(studies).values({
    id,
    trailId,
    position,
    title: `Estudo ${id}`,
    description: 'Descrição do estudo.',
    // Typed as StudyPage[], but a test may store a malformed value on purpose.
    pages: pages as StudyPage[],
  });
}

describe('DrizzleStudyRepository.listByTrail', () => {
  it(
    'lists the studies by trail position and study position, with their page counts',
    inRollback(async (tx) => {
      await moveExistingTrailsBack(tx);
      await insertCourse(tx, 'it-study-trail-2', 2);
      await insertCourse(tx, 'it-study-trail-1', 1);
      await insertCourse(tx, 'it-study-trail-empty', 3);
      await insertStudy(tx, {
        id: 'it-study-b',
        trailId: 'it-study-trail-1',
        position: 2,
        pages: [page('p1')],
      });
      await insertStudy(tx, {
        id: 'it-study-a',
        trailId: 'it-study-trail-1',
        position: 1,
        pages: [page('p1'), page('p2'), page('p3')],
      });
      await insertStudy(tx, {
        id: 'it-study-c',
        trailId: 'it-study-trail-2',
        position: 1,
        pages: [page('p1')],
      });

      const trails = await new DrizzleStudyRepository(tx).listByTrail();

      expect(trails.slice(0, 2)).toEqual([
        {
          id: 'it-study-trail-1',
          title: 'Trilha it-study-trail-1',
          studies: [
            {
              id: 'it-study-a',
              title: 'Estudo it-study-a',
              description: 'Descrição do estudo.',
              pageCount: 3,
            },
            {
              id: 'it-study-b',
              title: 'Estudo it-study-b',
              description: 'Descrição do estudo.',
              pageCount: 1,
            },
          ],
        },
        expect.objectContaining({
          id: 'it-study-trail-2',
          studies: [expect.objectContaining({ id: 'it-study-c' })],
        }),
      ]);
      expect(trails.map(({ id }) => id)).not.toContain('it-study-trail-empty');
    }),
  );
});

describe('DrizzleStudyRepository.findById', () => {
  it(
    'returns the study with its pages and sign descriptions',
    inRollback(async (tx) => {
      await insertCourse(tx, 'it-study-trail');
      const pages = [page('p1'), page('p2')];
      await insertStudy(tx, { id: 'it-study', trailId: 'it-study-trail', position: 1, pages });

      expect(await new DrizzleStudyRepository(tx).findById('it-study')).toEqual({
        id: 'it-study',
        trailId: 'it-study-trail',
        title: 'Estudo it-study',
        description: 'Descrição do estudo.',
        pages,
      });
    }),
  );

  it(
    'returns null for an unknown study',
    inRollback(async (tx) => {
      expect(await new DrizzleStudyRepository(tx).findById('it-study-missing')).toBeNull();
    }),
  );

  it(
    'throws when the stored pages do not match the contract',
    inRollback(async (tx) => {
      await insertCourse(tx, 'it-study-trail');
      await insertStudy(tx, {
        id: 'it-study-broken',
        trailId: 'it-study-trail',
        position: 1,
        pages: [{ id: 'p1', title: 'Sem blocos', blocks: [] }],
      });

      await expect(new DrizzleStudyRepository(tx).findById('it-study-broken')).rejects.toThrow(
        ZodError,
      );
    }),
  );
});
