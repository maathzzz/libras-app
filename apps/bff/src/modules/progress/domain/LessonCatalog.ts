import type { LessonBundle } from '@libras/contracts';

// Port to the curriculum: the lesson as the app receives it, whose exercises are also used to
// re-grade the answers. Progress does not depend on the curriculum module.
export interface LessonCatalog {
  findById(lessonId: string): Promise<LessonBundle | null>;
}
