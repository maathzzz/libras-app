import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { notFound, parentLevel, type DraftOutlineRepository } from '../domain/DraftOutline';

export type ReorderOutlineItemsInput =
  | { level: 'trail'; ids: readonly string[] }
  | { level: 'unit' | 'lesson'; parentId: string; ids: readonly string[] };

function sameItems(current: readonly string[], proposed: readonly string[]): boolean {
  const proposedSet = new Set(proposed);
  return (
    current.length === proposed.length &&
    proposedSet.size === proposed.length &&
    current.every((id) => proposedSet.has(id))
  );
}

// The CMS sends the whole list in its new order. A list that is not exactly the current
// items (another operator added or removed one meanwhile) is refused instead of guessed.
export class ReorderOutlineItems {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute(input: ReorderOutlineItemsInput): Promise<Result<void>> {
    const parentId = input.level === 'trail' ? null : input.parentId;
    const current = await this.outline.listIds(input.level, parentId);
    // Trails always have a list, so only a missing parent gets here.
    if (!current) {
      return err(notFound(parentLevel[input.level] ?? input.level, parentId ?? ''));
    }

    if (!sameItems(current, input.ids)) {
      return err(new DomainError('INVALID_ORDER', 'The order must list exactly the current items'));
    }

    await this.outline.reorder(input.level, parentId, input.ids);
    return ok(undefined);
  }
}
