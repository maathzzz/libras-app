import type { AdminTrail } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';

// The three levels of the outline. They have the same shape (id, title, position in
// the list of their parent), so the same use cases serve all of them. A unit is shown as
// "módulo" in the CMS.
export type OutlineLevel = 'trail' | 'unit' | 'lesson';

// The level that holds the lists of each level; trails form a single list with no parent.
export const parentLevel = { trail: null, unit: 'trail', lesson: 'unit' } as const satisfies Record<
  OutlineLevel,
  OutlineLevel | null
>;

export function notFound(level: OutlineLevel, id: string): DomainError {
  return new DomainError(`${level.toUpperCase()}_NOT_FOUND`, `${level} ${id} not found`);
}

export interface NewOutlineItem {
  id: string;
  // Null only for a trail.
  parentId: string | null;
  title: string;
}

// A trail, unit or lesson that learners already did cannot leave the database: their
// progress points to its lessons. It is hidden instead.
export type DeleteOutlineOutcome = 'deleted' | 'notFound' | 'hasProgress';

export const contentHasProgress = (what: string) =>
  new DomainError('CONTENT_HAS_PROGRESS', `Learners already did ${what}; hide it instead`);

export interface CmsOutlineRepository {
  // Every trail, hidden ones too, with its units and lessons, each list in order.
  listTrails(): Promise<AdminTrail[]>;
  // Ids of one list, in order. `parentId` is null for the trails. Null when the parent
  // does not exist.
  listIds(level: OutlineLevel, parentId: string | null): Promise<string[] | null>;
  // Adds the item at the end of its list. False when the parent does not exist.
  create(level: OutlineLevel, item: NewOutlineItem): Promise<boolean>;
  // False when the item does not exist.
  rename(level: OutlineLevel, id: string, title: string): Promise<boolean>;
  // Shows or hides the item. False when it does not exist.
  setVisible(level: OutlineLevel, id: string, visible: boolean): Promise<boolean>;
  // Removes the item and everything below it, unless a learner did one of its lessons.
  delete(level: OutlineLevel, id: string): Promise<DeleteOutlineOutcome>;
  // Positions 1..n in the order of `ids`, which are exactly the items of the list.
  reorder(level: OutlineLevel, parentId: string | null, ids: readonly string[]): Promise<void>;
}
