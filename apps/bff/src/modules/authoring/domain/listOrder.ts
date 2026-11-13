import { DomainError } from '../../../shared/domain/DomainError';

// The CMS sends a whole list in its new order. A list that is not exactly the current items
// (another operator added or removed one meanwhile) is refused instead of guessed.
export function isSameList(current: readonly string[], proposed: readonly string[]): boolean {
  const proposedSet = new Set(proposed);
  return (
    current.length === proposed.length &&
    proposedSet.size === proposed.length &&
    current.every((id) => proposedSet.has(id))
  );
}

export const invalidOrder = () =>
  new DomainError('INVALID_ORDER', 'The order must list exactly the current items');
