import { describe, expect, it } from 'vitest';

import type { ExerciseResult } from './AnswerGrader';
import { XpPolicy } from './XpPolicy';

const results = (...correct: boolean[]): ExerciseResult[] =>
  correct.map((isCorrect, index) => ({ exerciseId: `ex-${index}`, correct: isCorrect }));

describe('XpPolicy.xpFor', () => {
  it('gives 10 XP plus a 5 XP bonus for a perfect lesson', () => {
    expect(XpPolicy.xpFor(results(true, true, true))).toBe(15);
  });

  it('gives 10 XP for a lesson with mistakes', () => {
    expect(XpPolicy.xpFor(results(true, false, true))).toBe(10);
  });

  it('gives 10 XP even when every answer is wrong', () => {
    expect(XpPolicy.xpFor(results(false, false))).toBe(10);
  });

  it('gives XP again for a lesson that is redone', () => {
    const graded = results(true, true);

    expect(XpPolicy.xpFor(graded)).toBe(15);
    expect(XpPolicy.xpFor(graded)).toBe(15);
  });
});
