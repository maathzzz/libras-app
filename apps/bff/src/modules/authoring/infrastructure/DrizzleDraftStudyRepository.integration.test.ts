import type { StudyPage } from '@libras/contracts';
import { describe, expect, it } from 'vitest';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import type { DraftStudy } from '../domain/DraftStudy';
import { DrizzleDraftStudyRepository } from './DrizzleDraftStudyRepository';

const inRollback = useTestDatabase();

const page: StudyPage = {
  id: 'it-page',
  title: 'Página IT',
  blocks: [{ type: 'text', body: 'Texto de teste.' }],
};

const study = (id: string, groupId: string): DraftStudy => ({
  id,
  groupId,
  title: `Estudo ${id}`,
  description: 'Descrição de teste.',
  pages: [page],
});

// The shared database has the seed's draft groups, so the tests look only at their own.
const own = (ids: readonly string[]) => ids.filter((id) => id.startsWith('it-'));

async function prepare(tx: DbExecutor) {
  const studies = new DrizzleDraftStudyRepository(tx);
  await studies.createGroup({ id: 'it-group-1', title: 'Grupo IT 1' });
  await studies.createGroup({ id: 'it-group-2', title: 'Grupo IT 2' });
  await studies.create(study('it-study-1', 'it-group-1'));
  await studies.create(study('it-study-2', 'it-group-1'));
  return studies;
}

describe('DrizzleDraftStudyRepository', () => {
  it(
    'lists groups at the end with their studies in order, empty groups too',
    inRollback(async (tx) => {
      const studies = await prepare(tx);

      expect(own(await studies.listGroupIds())).toEqual(['it-group-1', 'it-group-2']);
      const groups = (await studies.listGroups()).filter((group) => group.id.startsWith('it-'));
      expect(groups).toEqual([
        {
          id: 'it-group-1',
          title: 'Grupo IT 1',
          studies: [
            {
              id: 'it-study-1',
              title: 'Estudo it-study-1',
              description: 'Descrição de teste.',
              pageCount: 1,
            },
            {
              id: 'it-study-2',
              title: 'Estudo it-study-2',
              description: 'Descrição de teste.',
              pageCount: 1,
            },
          ],
        },
        { id: 'it-group-2', title: 'Grupo IT 2', studies: [] },
      ]);
    }),
  );

  it(
    'refuses a study in a missing group and finds a saved one',
    inRollback(async (tx) => {
      const studies = await prepare(tx);

      expect(await studies.create(study('it-orphan', 'it-missing'))).toBe(false);
      expect(await studies.find('it-study-1')).toEqual(study('it-study-1', 'it-group-1'));
      expect(await studies.find('it-missing')).toBeNull();
      expect(await studies.listStudyIds('it-missing')).toBeNull();
    }),
  );

  it(
    'moves a study to the end of another group and reorders a group',
    inRollback(async (tx) => {
      const studies = await prepare(tx);
      await studies.create(study('it-study-3', 'it-group-2'));

      expect(await studies.update({ ...study('it-study-1', 'it-group-2'), title: 'Movido' })).toBe(
        'updated',
      );
      expect(await studies.update(study('it-study-2', 'it-missing'))).toBe('groupNotFound');
      expect(await studies.update(study('it-missing', 'it-group-1'))).toBe('notFound');

      expect(await studies.listStudyIds('it-group-2')).toEqual(['it-study-3', 'it-study-1']);
      await studies.reorderStudies('it-group-2', ['it-study-1', 'it-study-3']);
      expect(await studies.listStudyIds('it-group-2')).toEqual(['it-study-1', 'it-study-3']);
      expect((await studies.find('it-study-1'))?.title).toBe('Movido');
    }),
  );

  it(
    'deletes only an empty group, and studies',
    inRollback(async (tx) => {
      const studies = await prepare(tx);

      expect(await studies.deleteGroup('it-group-1')).toBe('notEmpty');
      expect(await studies.deleteGroup('it-group-2')).toBe('deleted');
      expect(await studies.deleteGroup('it-group-2')).toBe('notFound');

      expect(await studies.delete('it-study-1')).toBe(true);
      expect(await studies.delete('it-study-1')).toBe(false);
      expect(await studies.renameGroup('it-group-1', 'Renomeado')).toBe(true);
      expect(await studies.renameGroup('it-missing', 'X')).toBe(false);
    }),
  );

  it(
    'reorders the groups',
    inRollback(async (tx) => {
      const studies = await prepare(tx);
      const others = (await studies.listGroupIds()).filter((id) => !id.startsWith('it-'));

      await studies.reorderGroups(['it-group-2', 'it-group-1', ...others]);

      expect((await studies.listGroupIds()).slice(0, 2)).toEqual(['it-group-2', 'it-group-1']);
    }),
  );
});
