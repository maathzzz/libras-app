import type { AdminLessonExercisesResponse } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  exerciseFields,
  lessonNotFound,
  type DraftExerciseRepository,
} from '../domain/DraftExercise';

export class GetLessonExercises {
  constructor(private readonly exercises: DraftExerciseRepository) {}

  async execute({ lessonId }: { lessonId: string }): Promise<Result<AdminLessonExercisesResponse>> {
    const found = await this.exercises.listByLesson(lessonId);
    if (!found) return err(lessonNotFound(lessonId));
    return ok({ lesson: found.lesson, exercises: found.exercises.map(exerciseFields) });
  }
}
