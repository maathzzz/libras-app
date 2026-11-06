import type { StudyGuide } from '@libras/contracts';
import { describe, expect, it } from 'vitest';

import { InMemoryStudyRepository } from '../testing/InMemoryStudyRepository';
import { GetStudies } from './GetStudies';
import { GetStudy } from './GetStudy';

const study = (id: string, groupId: string): StudyGuide => ({
  id,
  groupId,
  title: `Estudo ${id}`,
  description: 'Descrição.',
  pages: [{ id: 'p1', title: 'Página 1', blocks: [{ type: 'text', body: 'Texto.' }] }],
});

const repository = new InMemoryStudyRepository(
  [
    { id: 'grupo-1', title: 'Grupo 1' },
    { id: 'grupo-2', title: 'Grupo 2' },
    { id: 'grupo-3', title: 'Grupo 3' },
  ],
  [study('a', 'grupo-1'), study('b', 'grupo-1'), study('c', 'grupo-3')],
);

describe('GetStudies', () => {
  it('groups the studies by study group and leaves out groups without studies', async () => {
    const { groups } = await new GetStudies(repository).execute();

    expect(groups.map((group) => [group.id, group.studies.map(({ id }) => id)])).toEqual([
      ['grupo-1', ['a', 'b']],
      ['grupo-3', ['c']],
    ]);
  });
});

describe('GetStudy', () => {
  it('returns the study', async () => {
    const result = await new GetStudy(repository).execute({ studyId: 'b' });

    expect(result).toEqual({ ok: true, value: study('b', 'grupo-1') });
  });

  it('fails with STUDY_NOT_FOUND for an unknown study', async () => {
    const result = await new GetStudy(repository).execute({ studyId: 'nao-existe' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('STUDY_NOT_FOUND');
  });
});
