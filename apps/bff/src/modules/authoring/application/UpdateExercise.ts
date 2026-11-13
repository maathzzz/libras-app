import type { SaveExerciseRequest } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import { buildExercise, exerciseNotFound, type CmsExerciseRepository } from '../domain/CmsExercise';
import type { CmsSignRepository } from '../domain/CmsSignRepository';
import { signsOfExercise } from './signsOfExercise';

export type UpdateExerciseInput = SaveExerciseRequest & { id: string };

// Replaces every field of an exercise; it may also change type.
export class UpdateExercise {
  constructor(
    private readonly exercises: CmsExerciseRepository,
    private readonly signs: CmsSignRepository,
  ) {}

  async execute({ id, ...fields }: UpdateExerciseInput): Promise<Result<void>> {
    const signs = await signsOfExercise(this.signs, fields);
    if (!signs.ok) return signs;

    const updated = await this.exercises.update(buildExercise(id, fields, signs.value));
    return updated ? ok(undefined) : err(exerciseNotFound(id));
  }
}
