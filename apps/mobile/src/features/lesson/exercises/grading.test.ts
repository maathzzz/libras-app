import type { Exercise } from '@libras/contracts';

import { gradeAnswer } from './grading';

const signToWord: Exercise = {
  id: 'ex-1',
  type: 'sign_to_word',
  images: [{ url: 'https://cdn.example/oi.png', alt: 'Mão aberta' }],
  options: [
    { id: 'oi', label: 'Oi' },
    { id: 'tchau', label: 'Tchau' },
  ],
  correctOptionId: 'oi',
};

describe('gradeAnswer', () => {
  it('accepts the correct option', () => {
    expect(gradeAnswer(signToWord, { type: 'sign_to_word', optionId: 'oi' })).toBe(true);
  });

  it('rejects another option', () => {
    expect(gradeAnswer(signToWord, { type: 'sign_to_word', optionId: 'tchau' })).toBe(false);
  });

  it('rejects an answer meant for another exercise type', () => {
    expect(gradeAnswer(signToWord, { type: 'word_to_sign', optionId: 'oi' })).toBe(false);
  });
});
