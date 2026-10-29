import type { CompleteLessonRequest } from '@libras/contracts';

import { ApiError } from '@/shared/api/client';
import { getMockStats, resetMockServer } from '@/shared/api/mockServer';

import { mockGetLesson, mockLesson, mockSubmitSession, simulateNetwork } from './lessonFixtures';

const lesson = mockLesson('saudacoes-bom-dia');
const key = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Every exercise answered correctly except the first `wrong` ones.
function session(idempotencyKey: string, wrong = 0): CompleteLessonRequest {
  return {
    lessonId: lesson.id,
    idempotencyKey,
    answers: lesson.exercises.map((exercise, index) => ({
      exerciseId: exercise.id,
      answer: {
        type: exercise.type,
        optionId:
          index < wrong
            ? (exercise.options.find((option) => option.id !== exercise.correctOptionId)?.id ?? '')
            : exercise.correctOptionId,
      },
    })),
    localDate: '2026-03-14',
  };
}

async function resolveGetLesson(lessonId: string) {
  const lesson = mockGetLesson(lessonId);
  await jest.runAllTimersAsync();
  return lesson;
}

async function resolveSubmit(request: CompleteLessonRequest) {
  const submitting = mockSubmitSession(request);
  // Attached before the timers run so a rejection is not reported as unhandled.
  const settled = submitting.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await jest.runAllTimersAsync();
  return settled;
}

beforeEach(() => {
  jest.useFakeTimers();
  resetMockServer('at_risk');
  simulateNetwork('online');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mockGetLesson', () => {
  it('returns the requested lesson', async () => {
    expect((await resolveGetLesson('saudacoes-bom-dia')).id).toBe('saudacoes-bom-dia');
  });

  it('mixes 6 to 8 sign_to_word and word_to_sign exercises', async () => {
    const { exercises } = await resolveGetLesson('saudacoes-bom-dia');
    const types = new Set(exercises.map((exercise) => exercise.type));

    expect(exercises.length).toBeGreaterThanOrEqual(6);
    expect(exercises.length).toBeLessThanOrEqual(8);
    expect(types).toEqual(new Set(['sign_to_word', 'word_to_sign']));
  });
});

describe('mockSubmitSession', () => {
  it('earns 10 XP for a lesson with mistakes', async () => {
    const result = await resolveSubmit(session(key(1), 2));

    expect(result).toMatchObject({ value: { xpEarned: 10 } });
    expect(getMockStats().totalXp).toBe(1240 + 10);
  });

  it('earns a 5 XP bonus when the server grades every answer as correct', async () => {
    const result = await resolveSubmit(session(key(1)));

    expect(result).toMatchObject({ value: { xpEarned: 15 } });
    expect(getMockStats().totalXp).toBe(1240 + 15);
  });

  it('earns XP again when the lesson is redone', async () => {
    await resolveSubmit(session(key(1)));
    await resolveSubmit(session(key(2)));

    expect(getMockStats().totalXp).toBe(1240 + 15 + 15);
  });

  it('grows the streak on the first lesson of the day only', async () => {
    const first = await resolveSubmit(session(key(1)));
    const second = await resolveSubmit(session(key(2)));

    expect(first).toMatchObject({
      value: { streak: { current: 8, status: 'done_today' }, streakIncreased: true },
    });
    expect(second).toMatchObject({ value: { streak: { current: 8 }, streakIncreased: false } });
  });

  it('restarts a broken streak at 1', async () => {
    resetMockServer('broken');

    const result = await resolveSubmit(session(key(1)));

    expect(result).toMatchObject({ value: { streak: { current: 1 }, streakIncreased: true } });
  });

  it('returns the first result again for a repeated idempotency key', async () => {
    const first = await resolveSubmit(session(key(1)));
    const repeated = await resolveSubmit(session(key(1)));

    expect(repeated).toEqual(first);
    expect(getMockStats().totalXp).toBe(1240 + 15);
  });

  it('fails like the API client without network when offline', async () => {
    simulateNetwork('offline');

    const result = await resolveSubmit(session(key(1)));

    expect(result).toEqual({ error: expect.any(ApiError) });
    expect(result).toMatchObject({ error: { kind: 'network' } });
    expect(getMockStats().totalXp).toBe(1240);
  });

  it('fails only the first attempt of each session when the network is flaky', async () => {
    simulateNetwork('firstAttemptFails');

    expect(await resolveSubmit(session(key(1)))).toHaveProperty('error');
    expect(await resolveSubmit(session(key(1)))).toHaveProperty('value');
    expect(await resolveSubmit(session(key(2)))).toHaveProperty('error');
  });
});
