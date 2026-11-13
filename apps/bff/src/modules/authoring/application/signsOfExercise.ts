import type { SaveExerciseRequest } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { ambiguousOptions } from '../domain/DraftExercise';
import type { DraftSign, DraftSignRepository } from '../domain/DraftSignRepository';

// The draft signs an exercise will show, checked: all exist and their labels differ.
export async function signsOfExercise(
  signs: DraftSignRepository,
  fields: SaveExerciseRequest,
): Promise<Result<Map<string, DraftSign>>> {
  const found = await signs.findByIds(fields.signIds);
  const byId = new Map(found.map((sign) => [sign.id, sign]));
  const missing = fields.signIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    return err(new DomainError('UNKNOWN_SIGN', `Draft signs not found: ${missing.join(', ')}`));
  }

  const ambiguous = ambiguousOptions(found);
  return ambiguous ? err(ambiguous) : ok(byId);
}
