import { describe, expect, it } from 'vitest';

import { Exercise } from './exercises';

const image = (name: string) => ({ url: `https://cdn.example/${name}.png`, alt: `Sinal de ${name}` });

const signToWord = {
  id: 'ex-1',
  type: 'sign_to_word',
  images: [image('casa-1'), image('casa-2')],
  options: [
    { id: 'a', label: 'Casa' },
    { id: 'b', label: 'Escola' },
  ],
  correctOptionId: 'a',
};

const wordToSign = {
  id: 'ex-2',
  type: 'word_to_sign',
  word: 'Obrigado',
  options: [
    { id: 'a', images: [image('obrigado')] },
    { id: 'b', images: [image('desculpa')] },
  ],
  correctOptionId: 'b',
};

describe('Exercise', () => {
  it('accepts a valid sign_to_word exercise', () => {
    expect(Exercise.parse(signToWord)).toEqual(signToWord);
  });

  it('accepts a valid word_to_sign exercise', () => {
    expect(Exercise.parse(wordToSign)).toEqual(wordToSign);
  });

  it('rejects an unknown exercise type', () => {
    expect(Exercise.safeParse({ ...signToWord, type: 'video_quiz' }).success).toBe(false);
  });

  it('rejects a correctOptionId that is not among the options', () => {
    const result = Exercise.safeParse({ ...wordToSign, correctOptionId: 'z' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['correctOptionId']);
  });

  it('rejects an image without alt text', () => {
    const result = Exercise.safeParse({ ...signToWord, images: [{ url: 'https://cdn.example/x.png', alt: '' }] });

    expect(result.success).toBe(false);
  });

  it('rejects an empty image sequence', () => {
    expect(Exercise.safeParse({ ...signToWord, images: [] }).success).toBe(false);
  });

  it('rejects fewer than two options', () => {
    expect(Exercise.safeParse({ ...signToWord, options: [signToWord.options[0]] }).success).toBe(false);
  });
});
