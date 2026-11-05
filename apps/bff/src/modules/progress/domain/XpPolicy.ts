import type { ExerciseResult } from './AnswerGrader';

const xpPerLesson = 10;
const perfectLessonBonusXp = 5;

// Redoing a lesson earns XP again: it rewards review and keeps the rule free of history.
export const XpPolicy = {
  xpFor(results: readonly ExerciseResult[]): number {
    return xpPerLesson + (XpPolicy.isPerfect(results) ? perfectLessonBonusXp : 0);
  },

  // Every answer right, as graded by the server.
  isPerfect(results: readonly ExerciseResult[]): boolean {
    return results.every((result) => result.correct);
  },
};
