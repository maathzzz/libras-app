import type { LessonBundle } from '@libras/contracts';

// Also serves progress as its LessonCatalog port: the shape matches, so the container can
// pass it without either module importing the other.
export interface LessonRepository {
  findById(lessonId: string): Promise<LessonBundle | null>;
}
