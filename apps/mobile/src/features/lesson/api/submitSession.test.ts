import type { CompleteLessonRequest } from '@libras/contracts';

import { getMockStats, resetMockServer } from '@/shared/api/mockServer';

import { mockLesson } from './lessonMocks';
import { simulateNetwork, submitSession } from './submitSession';

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
  };
}

async function resolveSubmit(request: CompleteLessonRequest) {
  const submitting = submitSession(request);
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

describe('submitSession', () => {
  it('earns 10 XP per answer the server grades as correct', async () => {
    const result = await resolveSubmit(session(key(1), 2));

    expect(result).toMatchObject({ value: { xpEarned: (lesson.exercises.length - 2) * 10 } });
    expect(getMockStats().totalXp).toBe(1240 + (lesson.exercises.length - 2) * 10);
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
    expect(getMockStats().totalXp).toBe(1240 + lesson.exercises.length * 10);
  });

  it('fails like fetch without network when offline', async () => {
    simulateNetwork('offline');

    const result = await resolveSubmit(session(key(1)));

    expect(result).toEqual({ error: new TypeError('Network request failed') });
    expect(getMockStats().totalXp).toBe(1240);
  });

  it('fails only the first attempt of each session when the network is flaky', async () => {
    simulateNetwork('firstAttemptFails');

    expect(await resolveSubmit(session(key(1)))).toHaveProperty('error');
    expect(await resolveSubmit(session(key(1)))).toHaveProperty('value');
    expect(await resolveSubmit(session(key(2)))).toHaveProperty('error');
  });

  it('rejects a request outside the contract', async () => {
    const result = await resolveSubmit({ ...session(key(1)), answers: [] });

    expect(result).toHaveProperty('error');
  });
});
