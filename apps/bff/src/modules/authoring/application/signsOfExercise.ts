import type { SaveExerciseRequest } from '@libras/contracts';

import { err, type Result } from '../../../shared/domain/Result';
import { ambiguousOptions } from '../domain/DraftExercise';
import type { DraftSign, DraftSignRepository } from '../domain/DraftSignRepository';
import { findDraftSigns } from './findDraftSigns';

// The draft signs an exercise will show, checked: all exist and their labels differ.
export async function signsOfExercise(
  signs: DraftSignRepository,
  fields: SaveExerciseRequest,
): Promise<Result<Map<string, DraftSign>>> {
  const found = await findDraftSigns(signs, fields.signIds);
  if (!found.ok) return found;

  const ambiguous = ambiguousOptions([...found.value.values()]);
  return ambiguous ? err(ambiguous) : found;
}
