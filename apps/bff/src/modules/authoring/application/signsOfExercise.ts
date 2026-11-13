import type { SaveExerciseRequest } from '@libras/contracts';

import { err, type Result } from '../../../shared/domain/Result';
import { ambiguousOptions } from '../domain/CmsExercise';
import type { CmsSign, CmsSignRepository } from '../domain/CmsSignRepository';
import { findCmsSigns } from './findCmsSigns';

// The signs an exercise will show, checked: all exist and their labels differ.
export async function signsOfExercise(
  signs: CmsSignRepository,
  fields: SaveExerciseRequest,
): Promise<Result<Map<string, CmsSign>>> {
  const found = await findCmsSigns(signs, fields.signIds);
  if (!found.ok) return found;

  const ambiguous = ambiguousOptions([...found.value.values()]);
  return ambiguous ? err(ambiguous) : found;
}
