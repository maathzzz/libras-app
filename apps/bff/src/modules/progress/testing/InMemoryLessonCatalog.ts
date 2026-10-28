import type { LessonBundle } from '@libras/contracts';

import type { LessonCatalog } from '../domain/LessonCatalog';

// For tests.
export class InMemoryLessonCatalog implements LessonCatalog {
  constructor(private readonly lessons: readonly LessonBundle[]) {}

  async findById(lessonId: string): Promise<LessonBundle | null> {
    return this.lessons.find((lesson) => lesson.id === lessonId) ?? null;
  }
}
