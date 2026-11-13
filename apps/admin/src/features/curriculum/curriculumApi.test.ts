import type * as ClientModule from '@/shared/api/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '@/shared/api/client';

import { createItem, deleteItem, moved, reorderItems } from './curriculumApi';

vi.mock('@/shared/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof ClientModule>()),
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue({ id: 'new-id' });
});

const lastCall = () => request.mock.calls.at(-1);

describe('curriculumApi', () => {
  it('creates in the list of the parent', async () => {
    await createItem({ level: 'trail' }, 'Trilha');
    expect(lastCall()?.[0]).toBe('/v1/admin/trails');

    await createItem({ level: 'unit', parentId: 'basico' }, 'Módulo');
    expect(lastCall()?.[0]).toBe('/v1/admin/trails/basico/units');

    await createItem({ level: 'lesson', parentId: 'alfabeto' }, 'Lição');
    expect(lastCall()?.[0]).toBe('/v1/admin/units/alfabeto/lessons');
    expect(lastCall()?.[2]).toEqual({ method: 'POST', body: { title: 'Lição' } });
  });

  it('reorders and deletes by level', async () => {
    await reorderItems({ level: 'lesson', parentId: 'alfabeto' }, ['b', 'a']);
    expect(lastCall()?.[0]).toBe('/v1/admin/units/alfabeto/lessons/order');
    expect(lastCall()?.[2]).toEqual({ method: 'PUT', body: { ids: ['b', 'a'] } });

    await deleteItem('unit', 'a b');
    expect(lastCall()?.[0]).toBe('/v1/admin/units/a%20b');
  });

  it('moves an item one place and keeps the list at the edges', () => {
    expect(moved(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b']);
    expect(moved(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c']);
    expect(moved(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
    expect(moved(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  });
});
