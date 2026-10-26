import type { Exercise } from '@libras/contracts';

export interface GradableLesson {
  id: string;
  exercises: readonly Exercise[];
}

// Port to the curriculum: progress only needs a lesson's exercises to re-grade the answers,
// so it does not depend on the curriculum module.
export interface LessonCatalog {
  findById(lessonId: string): Promise<GradableLesson | null>;
}
