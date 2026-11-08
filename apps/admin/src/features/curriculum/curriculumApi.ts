import { AdminTrailsResponse, CreatedResponse, type AdminTrail } from '@libras/contracts';

import { apiRequest, NoContent } from '@/shared/api/client';

// Trails, units ("módulos") and lessons of the draft. Every list is edited the same way.
export type OutlineLevel = 'trail' | 'unit' | 'lesson';

const segment: Record<OutlineLevel, string> = { trail: 'trails', unit: 'units', lesson: 'lessons' };
const parentSegment = { unit: 'trails', lesson: 'units' } as const;

// The list an item lives in: the trails, the units of a trail or the lessons of a unit.
export type OutlineList = { level: 'trail' } | { level: 'unit' | 'lesson'; parentId: string };

function listPath(list: OutlineList): string {
  if (list.level === 'trail') return '/v1/admin/trails';
  const parent = `/v1/admin/${parentSegment[list.level]}/${encodeURIComponent(list.parentId)}`;
  return `${parent}/${segment[list.level]}`;
}

const itemPath = (level: OutlineLevel, id: string) =>
  `/v1/admin/${segment[level]}/${encodeURIComponent(id)}`;

export async function getTrails(): Promise<AdminTrail[]> {
  return (await apiRequest('/v1/admin/trails', AdminTrailsResponse)).trails;
}

export async function createItem(list: OutlineList, title: string): Promise<string> {
  const { id } = await apiRequest(listPath(list), CreatedResponse, {
    method: 'POST',
    body: { title },
  });
  return id;
}

export async function renameItem(level: OutlineLevel, id: string, title: string): Promise<void> {
  await apiRequest(itemPath(level, id), NoContent, { method: 'PATCH', body: { title } });
}

export async function deleteItem(level: OutlineLevel, id: string): Promise<void> {
  await apiRequest(itemPath(level, id), NoContent, { method: 'DELETE' });
}

export async function reorderItems(list: OutlineList, ids: readonly string[]): Promise<void> {
  await apiRequest(`${listPath(list)}/order`, NoContent, { method: 'PUT', body: { ids } });
}

// The ids of a list with one item moved one place up (-1) or down (+1).
export function moved(ids: readonly string[], id: string, step: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
