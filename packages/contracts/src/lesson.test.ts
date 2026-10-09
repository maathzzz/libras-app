import { describe, expect, it } from 'vitest';

import { LessonBundle } from './lesson';

const exercise = (id: string) => ({
  id,
  type: 'word_to_sign',
  word: 'Oi',
  options: [
    { id: 'a', images: [{ url: 'https://cdn.example/oi.png', alt: 'Mão aberta acenando' }] },
    { id: 'b', images: [{ url: 'https://cdn.example/tchau.png', alt: 'Mão acima do ombro' }] },
  ],
  correctOptionId: 'a',
});

const lesson = { id: 'l1', title: 'Bom dia', exercises: [exercise('ex-1'), exercise('ex-2')] };

describe('LessonBundle', () => {
  it('accepts a valid lesson', () => {
    expect(LessonBundle.parse(lesson)).toEqual(lesson);
  });

  it('rejects a lesson without exercises', () => {
    expect(LessonBundle.safeParse({ ...lesson, exercises: [] }).success).toBe(false);
  });

  it('rejects repeated exercise ids', () => {
    const result = LessonBundle.safeParse({
      ...lesson,
      exercises: [exercise('ex-1'), exercise('ex-1')],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['exercises', 1, 'id']);
  });
});
