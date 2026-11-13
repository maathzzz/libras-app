import type { SaveExerciseRequest } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  buildExercise,
  exerciseNotFound,
  type DraftExerciseRepository,
} from '../domain/DraftExercise';
import type { DraftSignRepository } from '../domain/DraftSignRepository';
import { signsOfExercise } from './signsOfExercise';

export type UpdateExerciseInput = SaveExerciseRequest & { id: string };

// Replaces every field of a draft exercise; it may also change type.
export class UpdateExercise {
  constructor(
    private readonly exercises: DraftExerciseRepository,
    private readonly signs: DraftSignRepository,
  ) {}

  async execute({ id, ...fields }: UpdateExerciseInput): Promise<Result<void>> {
    const signs = await signsOfExercise(this.signs, fields);
    if (!signs.ok) return signs;

    const updated = await this.exercises.update(buildExercise(id, fields, signs.value));
    return updated ? ok(undefined) : err(exerciseNotFound(id));
  }
}
