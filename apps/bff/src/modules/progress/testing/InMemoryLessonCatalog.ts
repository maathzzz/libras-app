import type { GradableLesson, LessonCatalog } from '../domain/LessonCatalog';

// For tests.
export class InMemoryLessonCatalog implements LessonCatalog {
  constructor(private readonly lessons: readonly GradableLesson[]) {}

  async findById(lessonId: string): Promise<GradableLesson | null> {
    return this.lessons.find((lesson) => lesson.id === lessonId) ?? null;
  }
}
