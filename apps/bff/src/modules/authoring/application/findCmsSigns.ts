import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { CmsSign, CmsSignRepository } from '../domain/CmsSignRepository';

// The signs with these ids, by id; UNKNOWN_SIGN when any of them does not exist.
export async function findCmsSigns(
  signs: CmsSignRepository,
  ids: readonly string[],
): Promise<Result<Map<string, CmsSign>>> {
  const found = await signs.findByIds(ids);
  const byId = new Map(found.map((sign) => [sign.id, sign]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return err(new DomainError('UNKNOWN_SIGN', `Signs not found: ${missing.join(', ')}`));
  }
  return ok(byId);
}
