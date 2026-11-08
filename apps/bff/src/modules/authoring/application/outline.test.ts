import type { AdminTrail } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../shared/application/SequentialIdGenerator';
import { InMemoryDraftOutline } from '../testing/InMemoryDraftOutline';
import { CreateOutlineItem } from './CreateOutlineItem';
import { DeleteOutlineItem } from './DeleteOutlineItem';
import { GetDraftTrails } from './GetDraftTrails';
import { RenameOutlineItem } from './RenameOutlineItem';
import { ReorderOutlineItems } from './ReorderOutlineItems';

const trail: AdminTrail = {
  id: 'basico',
  title: 'Libras básico',
  units: [
    {
      id: 'alfabeto',
      title: 'Alfabeto',
      lessons: [
        { id: 'a-e', title: 'A a E', exerciseCount: 10 },
        { id: 'f-j', title: 'F a J', exerciseCount: 10 },
      ],
    },
    { id: 'saudacoes', title: 'Saudações', lessons: [] },
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
