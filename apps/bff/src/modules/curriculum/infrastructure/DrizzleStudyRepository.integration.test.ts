import type { StudyPage } from '@libras/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { studies, studyGroups } from '../../../shared/infrastructure/db/schema';
import {
  insertStudyGroup,
  moveExistingStudyGroupsBack,
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
  {
    id,
    groupId,
    position,
    pages,
    visible = true,
  }: { id: string; groupId: string; position: number; pages: unknown; visible?: boolean },
) {
  await tx.insert(studies).values({
    id,
    groupId,
    position,
    visible,
    title: `Estudo ${id}`,
    description: 'Descrição do estudo.',
    // Typed as StudyPage[], but a test may store a malformed value on purpose.
    pages: pages as StudyPage[],
  });
}

describe('DrizzleStudyRepository.listByGroup', () => {
  it(
    'lists the studies by group position and study position, with their page counts',
    inRollback(async (tx) => {
      await moveExistingStudyGroupsBack(tx);
      await insertStudyGroup(tx, 'it-study-group-2', 2);
      await insertStudyGroup(tx, 'it-study-group-1', 1);
      await insertStudyGroup(tx, 'it-study-group-empty', 3);
      await insertStudy(tx, {
        id: 'it-study-b',
        groupId: 'it-study-group-1',
        position: 2,
        pages: [page('p1')],
      });
      await insertStudy(tx, {
        id: 'it-study-a',
        groupId: 'it-study-group-1',
        position: 1,
        pages: [page('p1'), page('p2'), page('p3')],
      });
      await insertStudy(tx, {
        id: 'it-study-c',
        groupId: 'it-study-group-2',
        position: 1,
        pages: [page('p1')],
      });

      const groups = await new DrizzleStudyRepository(tx).listByGroup();

      expect(groups.slice(0, 2)).toEqual([
        {
          id: 'it-study-group-1',
          title: 'Grupo it-study-group-1',
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
          id: 'it-study-group-2',
          studies: [expect.objectContaining({ id: 'it-study-c' })],
        }),
      ]);
      expect(groups.map(({ id }) => id)).not.toContain('it-study-group-empty');
    }),
  );
});

describe('DrizzleStudyRepository.findById', () => {
  it(
    'returns the study with its pages and sign descriptions',
    inRollback(async (tx) => {
      await insertStudyGroup(tx, 'it-study-group');
      const pages = [page('p1'), page('p2')];
      await insertStudy(tx, { id: 'it-study', groupId: 'it-study-group', position: 1, pages });

      expect(await new DrizzleStudyRepository(tx).findById('it-study')).toEqual({
        id: 'it-study',
        groupId: 'it-study-group',
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
      await insertStudyGroup(tx, 'it-study-group');
      await insertStudy(tx, {
        id: 'it-study-broken',
        groupId: 'it-study-group',
        position: 1,
        pages: [{ id: 'p1', title: 'Sem blocos', blocks: [] }],
      });

      await expect(new DrizzleStudyRepository(tx).findById('it-study-broken')).rejects.toThrow(
        ZodError,
      );
    }),
  );
});

describe('app.study_groups', () => {
  it(
    'refuses to delete a group that still has studies',
    inRollback(async (tx) => {
      await insertStudyGroup(tx, 'it-study-group');
      await insertStudy(tx, {
        id: 'it-study',
        groupId: 'it-study-group',
        position: 1,
        pages: [page('p1')],
      });

      // In a savepoint, so the failed statement does not abort the test transaction.
      const deleting = tx.transaction((inner) =>
        inner.delete(studyGroups).where(eq(studyGroups.id, 'it-study-group')),
      );

      await expect(deleting).rejects.toThrow();
    }),
  );
});

describe('DrizzleStudyRepository visibility', () => {
  it(
    'leaves hidden studies out of the list and of the reads',
    inRollback(async (tx) => {
      await moveExistingStudyGroupsBack(tx);
      await insertStudyGroup(tx, 'it-visibility-group', 1);
      await insertStudy(tx, {
        id: 'it-shown-study',
        groupId: 'it-visibility-group',
        position: 1,
        pages: [page('p1')],
      });
      await insertStudy(tx, {
        id: 'it-hidden-study',
        groupId: 'it-visibility-group',
        position: 2,
        pages: [page('p1')],
        visible: false,
      });
      const repository = new DrizzleStudyRepository(tx);

      const [group] = await repository.listByGroup();
      expect(group?.studies.map((study) => study.id)).toEqual(['it-shown-study']);
      expect(await repository.findById('it-hidden-study')).toBeNull();
    }),
  );
});
