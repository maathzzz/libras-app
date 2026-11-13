import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { DraftSign, DraftSignRepository } from '../domain/DraftSignRepository';

// The draft signs with these ids, by id; UNKNOWN_SIGN when any of them does not exist.
export async function findDraftSigns(
  signs: DraftSignRepository,
  ids: readonly string[],
): Promise<Result<Map<string, DraftSign>>> {
  const found = await signs.findByIds(ids);
  const byId = new Map(found.map((sign) => [sign.id, sign]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return err(new DomainError('UNKNOWN_SIGN', `Draft signs not found: ${missing.join(', ')}`));
  }
  return ok(byId);
}
