import type { ExerciseResult } from './AnswerGrader';

const xpPerLesson = 10;
const perfectLessonBonusXp = 5;

// Redoing a lesson earns XP again: it rewards review and keeps the rule free of history.
export const XpPolicy = {
  xpFor(results: readonly ExerciseResult[]): number {
    const perfect = results.every((result) => result.correct);
    return xpPerLesson + (perfect ? perfectLessonBonusXp : 0);
  },
};
