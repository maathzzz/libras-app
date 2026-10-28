export interface LessonProgressRepository {
  // Every lesson the learner has completed at least once; empty for a new learner.
  findCompletedLessonIds(userId: string): Promise<ReadonlySet<string>>;
}
