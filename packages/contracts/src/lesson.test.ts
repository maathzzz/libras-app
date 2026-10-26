import { describe, expect, it } from 'vitest';

import { CompleteLessonRequest, CompleteLessonResponse, LessonBundle } from './lesson';

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

const request = {
  lessonId: 'l1',
  idempotencyKey: '9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d',
  answers: [
    { exerciseId: 'ex-1', answer: { type: 'word_to_sign', optionId: 'a' } },
    { exerciseId: 'ex-2', answer: { type: 'sign_to_word', optionId: 'b' } },
  ],
  localDate: '2026-03-15',
};

describe('CompleteLessonRequest', () => {
  it('accepts a valid request', () => {
    expect(CompleteLessonRequest.parse(request)).toEqual(request);
  });

  it('rejects a request without answers', () => {
    expect(CompleteLessonRequest.safeParse({ ...request, answers: [] }).success).toBe(false);
  });

  it('rejects an idempotency key that is not a UUID', () => {
    expect(CompleteLessonRequest.safeParse({ ...request, idempotencyKey: 'key-1' }).success).toBe(
      false,
    );
  });

  it('rejects a local date that is not YYYY-MM-DD', () => {
    for (const localDate of ['2026-3-5', '2026-03-15T00:00:00Z', '15/03/2026', '']) {
      expect(CompleteLessonRequest.safeParse({ ...request, localDate }).success).toBe(false);
    }
  });

  it('rejects a local date that does not exist', () => {
    expect(CompleteLessonRequest.safeParse({ ...request, localDate: '2026-02-30' }).success).toBe(
      false,
    );
  });

  it('rejects a request without a local date', () => {
    expect(CompleteLessonRequest.safeParse({ ...request, localDate: undefined }).success).toBe(
      false,
    );
  });

  it('rejects two answers to the same exercise', () => {
    const [first] = request.answers;
    const result = CompleteLessonRequest.safeParse({ ...request, answers: [first, first] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['answers', 1, 'exerciseId']);
  });
});

describe('CompleteLessonResponse', () => {
  const response = {
    xpEarned: 50,
    streak: { current: 8, longest: 12, status: 'done_today' },
    streakIncreased: true,
  };

  it('accepts a valid response', () => {
    expect(CompleteLessonResponse.parse(response)).toEqual(response);
  });

  it('rejects negative XP', () => {
    expect(CompleteLessonResponse.safeParse({ ...response, xpEarned: -1 }).success).toBe(false);
  });
});
