import { err, ok, type Result } from '../../../shared/domain/Result';
import { exerciseNotFound, type CmsExerciseRepository } from '../domain/CmsExercise';

export class DeleteExercise {
  constructor(private readonly exercises: CmsExerciseRepository) {}

  async execute({ id }: { id: string }): Promise<Result<void>> {
    const deleted = await this.exercises.delete(id);
    return deleted ? ok(undefined) : err(exerciseNotFound(id));
  }
}
