import { err, ok, type Result } from '../../../shared/domain/Result';
import { lessonNotFound, type DraftExerciseRepository } from '../domain/DraftExercise';
import { invalidOrder, isSameList } from '../domain/listOrder';

export interface ReorderExercisesInput {
  lessonId: string;
  ids: readonly string[];
}

export class ReorderExercises {
  constructor(private readonly exercises: DraftExerciseRepository) {}

  async execute({ lessonId, ids }: ReorderExercisesInput): Promise<Result<void>> {
    const found = await this.exercises.listByLesson(lessonId);
    if (!found) return err(lessonNotFound(lessonId));

    const current = found.exercises.map((exercise) => exercise.id);
    if (!isSameList(current, ids)) return err(invalidOrder());

    await this.exercises.reorder(lessonId, ids);
    return ok(undefined);
  }
}
