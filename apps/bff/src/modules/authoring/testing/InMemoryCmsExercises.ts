import type { Exercise } from '@libras/contracts';

import type { CmsExerciseRepository, CmsLessonExercises } from '../domain/CmsExercise';

// For tests: each lesson with its exercises in order.
export class InMemoryCmsExercises implements CmsExerciseRepository {
  private readonly lessons: CmsLessonExercises[];

  constructor(lessons: readonly CmsLessonExercises[] = []) {
    this.lessons = structuredClone([...lessons]);
  }

  async listByLesson(lessonId: string): Promise<CmsLessonExercises | null> {
    const found = this.lessons.find(({ lesson }) => lesson.id === lessonId);
    return found ? structuredClone(found) : null;
  }

  async create(lessonId: string, exercise: Exercise): Promise<boolean> {
    const found = this.lessons.find(({ lesson }) => lesson.id === lessonId);
    found?.exercises.push(structuredClone(exercise));
    return found !== undefined;
  }

  async update(exercise: Exercise): Promise<boolean> {
    for (const { exercises } of this.lessons) {
      const index = exercises.findIndex((candidate) => candidate.id === exercise.id);
      if (index >= 0) {
        exercises[index] = structuredClone(exercise);
        return true;
      }
    }
    return false;
  }

  async delete(id: string): Promise<boolean> {
    for (const { exercises } of this.lessons) {
      const index = exercises.findIndex((candidate) => candidate.id === id);
      if (index >= 0) {
        exercises.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  async reorder(lessonId: string, ids: readonly string[]): Promise<void> {
    const found = this.lessons.find(({ lesson }) => lesson.id === lessonId);
    if (!found) return;
    const ordered = ids.flatMap((id) => found.exercises.filter((exercise) => exercise.id === id));
    found.exercises.splice(0, found.exercises.length, ...ordered);
  }
}
