import type { AdminSign, SaveStudyRequest, StudyPage } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../shared/application/SequentialIdGenerator';
import { signBlock, withSignInPages } from '../domain/DraftStudy';
import { InMemoryDraftSigns } from '../testing/InMemoryDraftSigns';
import { InMemoryDraftStudies } from '../testing/InMemoryDraftStudies';
import { CreateStudy } from './CreateStudy';
import { CreateStudyGroup } from './CreateStudyGroup';
import { DeleteStudy } from './DeleteStudy';
import { DeleteStudyGroup } from './DeleteStudyGroup';
import { GetDraftStudies } from './GetDraftStudies';
import { GetDraftStudy } from './GetDraftStudy';
import { RenameStudyGroup } from './RenameStudyGroup';
import { ReorderStudies } from './ReorderStudies';
import { ReorderStudyGroups } from './ReorderStudyGroups';
import { UpdateStudy } from './UpdateStudy';

const letterA: AdminSign = {
  id: 'letter-a',
  label: 'A',
  imageUrls: ['https://x.test/a.webp'],
  alt: 'Mão fechada',
  description: 'Mão fechada, polegar ao lado.',
  exerciseCount: 0,
  studyCount: 0,
};

const intro: StudyPage = {
  id: 'intro',
  title: 'Introdução',
  blocks: [{ type: 'text', body: 'Datilologia é soletrar com as mãos.' }],
};

let studies: InMemoryDraftStudies;
let signs: InMemoryDraftSigns;
let ids: SequentialIdGenerator;

beforeEach(() => {
  signs = new InMemoryDraftSigns([letterA]);
  ids = new SequentialIdGenerator();
  studies = new InMemoryDraftStudies(
    [
      { id: 'iniciante', title: 'Primeiros passos' },
      { id: 'vazio', title: 'Vazio' },
    ],
    [
      {
        id: 'alfabeto',
        groupId: 'iniciante',
        title: 'Alfabeto manual',
        description: 'As 26 letras.',
        pages: [intro],
      },
    ],
  );
});

const groupsNow = async () => (await new GetDraftStudies(studies).execute()).groups;

const request: SaveStudyRequest = {
  groupId: 'iniciante',
  title: 'Cores',
  description: 'As cores mais usadas.',
  pages: [
    {
      title: 'Primeira',
      blocks: [
        { type: 'heading', text: 'A letra A' },
        { type: 'sign', signId: 'letter-a' },
      ],
    },
  ],
};

describe('study pages', () => {
  it('copies the sign into a sign block, with the id it came from', () => {
    expect(signBlock(letterA)).toEqual({
      type: 'sign',
      signId: 'letter-a',
      label: 'A',
      images: [{ url: 'https://x.test/a.webp', alt: 'Mão fechada' }],
      description: 'Mão fechada, polegar ao lado.',
    });
  });

  it('brings only the blocks of the edited sign up to date', () => {
    const pages: StudyPage[] = [
      { id: 'p', title: 'P', blocks: [signBlock(letterA), { type: 'tip', body: 'Calma.' }] },
    ];
    const edited = { ...letterA, label: 'Á', description: null };

    expect(withSignInPages(pages, edited)[0]?.blocks).toEqual([
      {
        type: 'sign',
        signId: 'letter-a',
        label: 'Á',
        images: [{ url: 'https://x.test/a.webp', alt: 'Mão fechada' }],
      },
      { type: 'tip', body: 'Calma.' },
    ]);
  });
});

describe('study group use cases', () => {
  it('creates, renames and reorders groups', async () => {
    const { id } = await new CreateStudyGroup(studies, ids).execute({ title: 'Cotidiano' });
    await new RenameStudyGroup(studies).execute({ id, title: 'Dia a dia' });
    const reorder = await new ReorderStudyGroups(studies).execute({
      ids: [id, 'iniciante', 'vazio'],
    });

    expect(reorder.ok).toBe(true);
    expect((await groupsNow()).map((group) => group.title)).toEqual([
      'Dia a dia',
      'Primeiros passos',
      'Vazio',
    ]);
  });

  it('refuses a stale order of the groups', async () => {
    const result = await new ReorderStudyGroups(studies).execute({ ids: ['iniciante'] });
    expect(result.ok || result.error.code).toBe('INVALID_ORDER');
  });

  it('deletes only an empty group', async () => {
    const remove = new DeleteStudyGroup(studies);
    const notEmpty = await remove.execute({ id: 'iniciante' });
    const missing = await remove.execute({ id: 'nope' });

    expect(notEmpty.ok || notEmpty.error.code).toBe('STUDY_GROUP_NOT_EMPTY');
    expect(missing.ok || missing.error.code).toBe('STUDY_GROUP_NOT_FOUND');
    expect((await remove.execute({ id: 'vazio' })).ok).toBe(true);
  });
});

describe('study use cases', () => {
  it('creates a study with new page ids and copies of the signs', async () => {
    const result = await new CreateStudy(studies, signs, ids).execute(request);

    expect(result).toEqual({ ok: true, value: { id: 'study-1' } });
    const found = await new GetDraftStudy(studies).execute({ id: 'study-1' });
    if (!found.ok) throw new Error(found.error.code);
    expect(found.value.pages).toEqual([
      {
        id: 'page-1',
        title: 'Primeira',
        blocks: [{ type: 'heading', text: 'A letra A' }, signBlock(letterA)],
      },
    ]);
    expect((await groupsNow())[0]?.studies.map((study) => study.id)).toEqual([
      'alfabeto',
      'study-1',
    ]);
  });

  it('refuses an unknown sign or group', async () => {
    const create = new CreateStudy(studies, signs, ids);
    const unknownSign = await create.execute({
      ...request,
      pages: [{ title: 'P', blocks: [{ type: 'sign', signId: 'nope' }] }],
    });
    const unknownGroup = await create.execute({ ...request, groupId: 'nope' });

    expect(unknownSign.ok || unknownSign.error.code).toBe('UNKNOWN_SIGN');
    expect(unknownGroup.ok || unknownGroup.error.code).toBe('UNKNOWN_STUDY_GROUP');
  });

  it('keeps the ids of existing pages and moves a study to the end of another group', async () => {
    await new CreateStudyGroup(studies, ids).execute({ title: 'Outro' });
    const result = await new UpdateStudy(studies, signs, ids).execute({
      ...request,
      id: 'alfabeto',
      groupId: 'vazio',
      pages: [
        { id: 'intro', title: 'Intro', blocks: [{ type: 'text', body: 'Oi' }] },
        ...request.pages,
      ],
    });

    expect(result.ok).toBe(true);
    const found = await new GetDraftStudy(studies).execute({ id: 'alfabeto' });
    expect(found.ok && found.value.pages.map((page) => page.id)).toEqual(['intro', 'page-1']);
    const groups = await groupsNow();
    expect(groups.find((group) => group.id === 'vazio')?.studies.map((s) => s.id)).toEqual([
      'alfabeto',
    ]);
  });

  it('reports an unknown study', async () => {
    const updated = await new UpdateStudy(studies, signs, ids).execute({ ...request, id: 'nope' });
    const deleted = await new DeleteStudy(studies).execute({ id: 'nope' });
    const found = await new GetDraftStudy(studies).execute({ id: 'nope' });

    for (const result of [updated, deleted, found]) {
      expect(result.ok || result.error.code).toBe('STUDY_NOT_FOUND');
    }
  });

  it('reorders the studies of a group and deletes one', async () => {
    await new CreateStudy(studies, signs, ids).execute(request);
    const reorder = new ReorderStudies(studies);

    expect((await reorder.execute({ groupId: 'iniciante', ids: ['study-1', 'alfabeto'] })).ok).toBe(
      true,
    );
    const stale = await reorder.execute({ groupId: 'iniciante', ids: ['study-1'] });
    const noGroup = await reorder.execute({ groupId: 'nope', ids: ['study-1'] });
    expect(stale.ok || stale.error.code).toBe('INVALID_ORDER');
    expect(noGroup.ok || noGroup.error.code).toBe('STUDY_GROUP_NOT_FOUND');

    expect((await new DeleteStudy(studies).execute({ id: 'alfabeto' })).ok).toBe(true);
    expect((await groupsNow())[0]?.studies.map((study) => study.id)).toEqual(['study-1']);
  });
});
