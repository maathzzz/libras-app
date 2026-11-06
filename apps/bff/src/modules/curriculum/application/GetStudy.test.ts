import type { StudyGuide } from '@libras/contracts';
import { describe, expect, it } from 'vitest';

import { InMemoryStudyRepository } from '../testing/InMemoryStudyRepository';
import { GetStudies } from './GetStudies';
import { GetStudy } from './GetStudy';

const study = (id: string, trailId: string): StudyGuide => ({
  id,
  trailId,
  title: `Estudo ${id}`,
  description: 'Descrição.',
  pages: [{ id: 'p1', title: 'Página 1', blocks: [{ type: 'text', body: 'Texto.' }] }],
});

const repository = new InMemoryStudyRepository(
  [
    { id: 'trilha-1', title: 'Trilha 1' },
    { id: 'trilha-2', title: 'Trilha 2' },
    { id: 'trilha-3', title: 'Trilha 3' },
  ],
  [study('a', 'trilha-1'), study('b', 'trilha-1'), study('c', 'trilha-3')],
);

describe('GetStudies', () => {
  it('groups the studies by trail and leaves out trails without studies', async () => {
    const { trails } = await new GetStudies(repository).execute();

    expect(trails.map((trail) => [trail.id, trail.studies.map(({ id }) => id)])).toEqual([
      ['trilha-1', ['a', 'b']],
      ['trilha-3', ['c']],
    ]);
  });
});

describe('GetStudy', () => {
  it('returns the study', async () => {
    const result = await new GetStudy(repository).execute({ studyId: 'b' });

    expect(result).toEqual({ ok: true, value: study('b', 'trilha-1') });
  });

  it('fails with STUDY_NOT_FOUND for an unknown study', async () => {
    const result = await new GetStudy(repository).execute({ studyId: 'nao-existe' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('STUDY_NOT_FOUND');
  });
});
