import type { AdminTrail } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../shared/application/SequentialIdGenerator';
import { InMemoryDraftOutline } from '../testing/InMemoryDraftOutline';
import { CreateOutlineItem } from './CreateOutlineItem';
import { DeleteOutlineItem } from './DeleteOutlineItem';
import { GetDraftTrails } from './GetDraftTrails';
import { RenameOutlineItem } from './RenameOutlineItem';
import { ReorderOutlineItems } from './ReorderOutlineItems';
import { SetOutlineItemVisibility } from './SetOutlineItemVisibility';

const trail: AdminTrail = {
  id: 'basico',
  title: 'Libras básico',
  visible: true,
  units: [
    {
      id: 'alfabeto',
      title: 'Alfabeto',
      visible: true,
      lessons: [
        { id: 'a-e', title: 'A a E', visible: true, exerciseCount: 10 },
        { id: 'f-j', title: 'F a J', visible: true, exerciseCount: 10 },
      ],
    },
    { id: 'saudacoes', title: 'Saudações', visible: true, lessons: [] },
  ],
};

let outline: InMemoryDraftOutline;

beforeEach(() => {
  outline = new InMemoryDraftOutline([trail]);
});

const trailsNow = async () => (await new GetDraftTrails(outline).execute()).trails;

describe('CreateOutlineItem', () => {
  it('adds a lesson at the end of its unit with a new id', async () => {
    const create = new CreateOutlineItem(outline, new SequentialIdGenerator());

    const result = await create.execute({ level: 'lesson', parentId: 'alfabeto', title: 'K a O' });

    expect(result).toEqual({ ok: true, value: { id: 'lesson-1' } });
    const [first] = await trailsNow();
    expect(first?.units[0]?.lessons.map((lesson) => lesson.title)).toEqual([
      'A a E',
      'F a J',
      'K a O',
    ]);
  });

  it('creates a trail without a parent', async () => {
    const create = new CreateOutlineItem(outline, new SequentialIdGenerator());

    await create.execute({ level: 'trail', title: 'Conversação' });

    expect((await trailsNow()).map((item) => item.id)).toEqual(['basico', 'trail-1']);
  });

  it('reports the missing parent', async () => {
    const create = new CreateOutlineItem(outline, new SequentialIdGenerator());

    const result = await create.execute({ level: 'unit', parentId: 'nope', title: 'Cores' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('TRAIL_NOT_FOUND');
  });
});

describe('RenameOutlineItem and DeleteOutlineItem', () => {
  it('renames a unit', async () => {
    await new RenameOutlineItem(outline).execute({
      level: 'unit',
      id: 'saudacoes',
      title: 'Cumprimentos',
    });

    expect((await trailsNow())[0]?.units[1]?.title).toBe('Cumprimentos');
  });

  it('deletes a unit with its lessons', async () => {
    const result = await new DeleteOutlineItem(outline).execute({ level: 'unit', id: 'alfabeto' });

    expect(result.ok).toBe(true);
    expect((await trailsNow())[0]?.units.map((unit) => unit.id)).toEqual(['saudacoes']);
  });

  it('reports an unknown item with the code of its level', async () => {
    const renamed = await new RenameOutlineItem(outline).execute({
      level: 'lesson',
      id: 'nope',
      title: 'X',
    });
    const deleted = await new DeleteOutlineItem(outline).execute({ level: 'unit', id: 'nope' });

    expect(renamed.ok || renamed.error.code).toBe('LESSON_NOT_FOUND');
    expect(deleted.ok || deleted.error.code).toBe('UNIT_NOT_FOUND');
  });
});

describe('ReorderOutlineItems', () => {
  it('puts the lessons of a unit in the given order', async () => {
    const result = await new ReorderOutlineItems(outline).execute({
      level: 'lesson',
      parentId: 'alfabeto',
      ids: ['f-j', 'a-e'],
    });

    expect(result.ok).toBe(true);
    expect((await trailsNow())[0]?.units[0]?.lessons.map((lesson) => lesson.id)).toEqual([
      'f-j',
      'a-e',
    ]);
  });

  it('refuses an order that is not exactly the current items', async () => {
    const reorder = new ReorderOutlineItems(outline);

    const missing = await reorder.execute({ level: 'unit', parentId: 'basico', ids: ['alfabeto'] });
    const foreign = await reorder.execute({
      level: 'unit',
      parentId: 'basico',
      ids: ['alfabeto', 'cores'],
    });

    expect(missing.ok || missing.error.code).toBe('INVALID_ORDER');
    expect(foreign.ok || foreign.error.code).toBe('INVALID_ORDER');
    expect((await trailsNow())[0]?.units.map((unit) => unit.id)).toEqual(['alfabeto', 'saudacoes']);
  });

  it('reports a missing parent', async () => {
    const result = await new ReorderOutlineItems(outline).execute({
      level: 'lesson',
      parentId: 'nope',
      ids: ['a-e'],
    });

    expect(result.ok || result.error.code).toBe('UNIT_NOT_FOUND');
  });
});

describe('SetOutlineItemVisibility', () => {
  it('creates items hidden and shows or hides them', async () => {
    const { value } = (await new CreateOutlineItem(outline, new SequentialIdGenerator()).execute({
      level: 'unit',
      parentId: 'basico',
      title: 'Cores',
    })) as { value: { id: string } };
    const created = (await trailsNow())[0]?.units.find((unit) => unit.id === value.id);
    expect(created?.visible).toBe(false);

    const show = new SetOutlineItemVisibility(outline);
    expect((await show.execute({ level: 'unit', id: value.id, visible: true })).ok).toBe(true);
    await show.execute({ level: 'lesson', id: 'a-e', visible: false });

    const [trail] = await trailsNow();
    expect(trail?.units.find((unit) => unit.id === value.id)?.visible).toBe(true);
    expect(trail?.units[0]?.lessons[0]?.visible).toBe(false);
  });

  it('reports an unknown item', async () => {
    const result = await new SetOutlineItemVisibility(outline).execute({
      level: 'trail',
      id: 'nope',
      visible: true,
    });
    expect(result.ok || result.error.code).toBe('TRAIL_NOT_FOUND');
  });
});

describe('DeleteOutlineItem with learner progress', () => {
  it('keeps a lesson, its unit and its trail once a learner did the lesson', async () => {
    const withProgress = new InMemoryDraftOutline([trail], new Set(['a-e']));
    const remove = new DeleteOutlineItem(withProgress);

    for (const [level, id] of [
      ['lesson', 'a-e'],
      ['unit', 'alfabeto'],
      ['trail', 'basico'],
    ] as const) {
      const result = await remove.execute({ level, id });
      expect(result.ok || result.error.code).toBe('CONTENT_HAS_PROGRESS');
    }
    expect((await remove.execute({ level: 'lesson', id: 'f-j' })).ok).toBe(true);
  });
});
