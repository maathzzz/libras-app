import type { Exercise, LessonAnswer } from '@libras/contracts';
import { describe, expect, it } from 'vitest';

import { AnswerGrader } from './AnswerGrader';

const image = (name: string) => [{ url: `https://example.com/${name}.png`, alt: name }];

const signToWord: Exercise = {
  id: 'ex-sign',
  type: 'sign_to_word',
  images: image('bom-dia'),
  options: [
    { id: 'a', label: 'Bom dia' },
    { id: 'b', label: 'Boa noite' },
  ],
  correctOptionId: 'a',
};

const wordToSign: Exercise = {
  id: 'ex-word',
  type: 'word_to_sign',
  word: 'Obrigado',
  options: [
    { id: 'c', images: image('obrigado') },
    { id: 'd', images: image('desculpa') },
  ],
  correctOptionId: 'd',
};

const lesson = [signToWord, wordToSign];

const signAnswer = (exerciseId: string, optionId: string): LessonAnswer => ({
  exerciseId,
  answer: { type: 'sign_to_word', optionId },
});

const wordAnswer = (exerciseId: string, optionId: string): LessonAnswer => ({
  exerciseId,
  answer: { type: 'word_to_sign', optionId },
});

const correctnessOf = (answers: LessonAnswer[], exerciseId: string) =>
  AnswerGrader.grade(lesson, answers).find((result) => result.exerciseId === exerciseId)?.correct;

describe('AnswerGrader.grade', () => {
  it('grades sign_to_word by the chosen option', () => {
    expect(correctnessOf([signAnswer('ex-sign', 'a')], 'ex-sign')).toBe(true);
    expect(correctnessOf([signAnswer('ex-sign', 'b')], 'ex-sign')).toBe(false);
  });

  it('grades word_to_sign by the chosen option', () => {
    expect(correctnessOf([wordAnswer('ex-word', 'd')], 'ex-word')).toBe(true);
    expect(correctnessOf([wordAnswer('ex-word', 'c')], 'ex-word')).toBe(false);
  });

  it('marks an answer of another exercise type as incorrect', () => {
    expect(correctnessOf([wordAnswer('ex-sign', 'a')], 'ex-sign')).toBe(false);
  });

  it('marks an exercise without an answer as incorrect', () => {
    expect(correctnessOf([signAnswer('ex-sign', 'a')], 'ex-word')).toBe(false);
  });

  it('ignores an answer to an exercise that is not in the lesson', () => {
    const results = AnswerGrader.grade(lesson, [
      signAnswer('ex-sign', 'a'),
      signAnswer('ex-unknown', 'a'),
      wordAnswer('ex-word', 'd'),
    ]);

    expect(results).toEqual([
      { exerciseId: 'ex-sign', correct: true },
      { exerciseId: 'ex-word', correct: true },
    ]);
  });

  it('marks an exercise answered more than once as incorrect, even if one answer is right', () => {
    const answers = [signAnswer('ex-sign', 'b'), signAnswer('ex-sign', 'a')];

    expect(correctnessOf(answers, 'ex-sign')).toBe(false);
  });

  it('returns one result per lesson exercise, in lesson order', () => {
    const results = AnswerGrader.grade(lesson, [
      wordAnswer('ex-word', 'c'),
      signAnswer('ex-sign', 'a'),
    ]);

    expect(results).toEqual([
      { exerciseId: 'ex-sign', correct: true },
      { exerciseId: 'ex-word', correct: false },
    ]);
  });
});
