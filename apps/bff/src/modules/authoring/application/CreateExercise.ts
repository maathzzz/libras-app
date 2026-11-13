import type { SaveExerciseRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { buildExercise, lessonNotFound, type CmsExerciseRepository } from '../domain/CmsExercise';
import type { CmsSignRepository } from '../domain/CmsSignRepository';
import { signsOfExercise } from './signsOfExercise';

export type CreateExerciseInput = SaveExerciseRequest & { lessonId: string };

// Adds an exercise at the end of a lesson.
export class CreateExercise {
  constructor(
    private readonly exercises: CmsExerciseRepository,
    private readonly signs: CmsSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ lessonId, ...fields }: CreateExerciseInput): Promise<Result<{ id: string }>> {
    const signs = await signsOfExercise(this.signs, fields);
    if (!signs.ok) return signs;

    const id = this.ids.next('exercise');
    const created = await this.exercises.create(lessonId, buildExercise(id, fields, signs.value));
    return created ? ok({ id }) : err(lessonNotFound(lessonId));
  }
}
