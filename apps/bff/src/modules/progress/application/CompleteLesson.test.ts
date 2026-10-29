import type { CompleteLessonResponse, LessonAnswer, LessonBundle } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { FixedClock } from '../../../shared/application/FixedClock';
import { LocalDate } from '../../../shared/domain/LocalDate';
import type { Result } from '../../../shared/domain/Result';
import { Streak } from '../domain/Streak';
import type { CatalogTrail } from '../domain/TrailCatalog';
import { InMemoryLessonCatalog } from '../testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../testing/InMemoryTrailCatalog';
import { CompleteLesson, type CompleteLessonInput } from './CompleteLesson';

const image = (name: string) => [{ url: `https://example.com/${name}.png`, alt: name }];

const lesson: LessonBundle = {
  id: 'lesson-greetings',
  title: 'Saudações',
  exercises: [
    {
      id: 'ex-sign',
      type: 'sign_to_word',
      images: image('bom-dia'),
      options: [
        { id: 'a', label: 'Bom dia' },
        { id: 'b', label: 'Boa noite' },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'ex-word',
      type: 'word_to_sign',
      word: 'Obrigado',
      options: [
        { id: 'c', images: image('obrigado') },
        { id: 'd', images: image('desculpa') },
      ],
      correctOptionId: 'c',
    },
  ],
};

// Unlocked only after `lesson`, the first of the trail.
const nextLesson: LessonBundle = { ...lesson, id: 'lesson-next', title: 'Despedidas' };

const trail: CatalogTrail = {
  id: 'trail',
  title: 'Trilha',
  position: 1,
  units: [
    { id: 'unit-1', title: 'Módulo 1', lessons: [{ id: lesson.id, title: lesson.title }] },
    { id: 'unit-2', title: 'Módulo 2', lessons: [{ id: nextLesson.id, title: nextLesson.title }] },
  ],
};

const perfectAnswers: LessonAnswer[] = [
  { exerciseId: 'ex-sign', answer: { type: 'sign_to_word', optionId: 'a' } },
  { exerciseId: 'ex-word', answer: { type: 'word_to_sign', optionId: 'c' } },
];

const answersWithOneMistake: LessonAnswer[] = [
  { exerciseId: 'ex-sign', answer: { type: 'sign_to_word', optionId: 'b' } },
  { exerciseId: 'ex-word', answer: { type: 'word_to_sign', optionId: 'c' } },
];

const userId = 'user-1';
const keys = {
  first: '6f1c2a3e-1b2d-4c5e-8f90-1a2b3c4d5e01',
  second: '6f1c2a3e-1b2d-4c5e-8f90-1a2b3c4d5e02',
  third: '6f1c2a3e-1b2d-4c5e-8f90-1a2b3c4d5e03',
};

// 'YYYY-MM-DD' → LocalDate, to keep the scenarios readable.
const d = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return LocalDate.of(year ?? 0, month ?? 0, day ?? 0);
};

function expectOk(result: Result<CompleteLessonResponse>): CompleteLessonResponse {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.value;
}

describe('CompleteLesson', () => {
  let store: InMemoryProgressStore;

  beforeEach(() => {
    store = new InMemoryProgressStore();
  });

  // A new use case per call, all sharing the same stores, so each call can happen at a
  // different instant without a mutable clock.
  const completeAt = (instant: string, input: Partial<CompleteLessonInput> = {}) =>
    new CompleteLesson(
      store,
      store,
      new InMemoryLessonCatalog([lesson, nextLesson]),
      new InMemoryTrailCatalog([trail]),
      store,
      new FixedClock(new Date(instant)),
    ).execute({
      userId,
      lessonId: lesson.id,
      idempotencyKey: keys.first,
      answers: perfectAnswers,
      localDate: '2026-03-15',
      ...input,
    });

  const expectError = (result: Result<CompleteLessonResponse>, code: string) => {
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(code);
  };

  describe('first completion', () => {
    it('grants XP, starts the streak and saves the session and stats', async () => {
      const response = expectOk(await completeAt('2026-03-15T12:00:00-03:00'));

      expect(response).toEqual({
        xpEarned: 15,
        streak: { current: 1, longest: 1, status: 'done_today' },
        streakIncreased: true,
      });

      const stats = await store.findByUserId(userId);
      expect(stats?.totalXp).toBe(15);
      expect(stats?.streak.lastActivity?.toString()).toBe('2026-03-15');
      expect(store.sessions).toEqual([
        {
          userId,
          lessonId: lesson.id,
          idempotencyKey: keys.first,
          completedAt: new Date('2026-03-15T12:00:00-03:00'),
          response,
        },
      ]);
    });

    it('grants XP from the server grading, without the bonus when an answer is wrong', async () => {
      const response = expectOk(
        await completeAt('2026-03-15T12:00:00-03:00', { answers: answersWithOneMistake }),
      );

      expect(response.xpEarned).toBe(10);
      expect((await store.findByUserId(userId))?.totalXp).toBe(10);
    });
  });

  describe('idempotency', () => {
    it('returns the first result for a repeated key and does not grant XP again', async () => {
      const first = expectOk(await completeAt('2026-03-15T12:00:00-03:00'));

      // A retry from the offline queue may arrive later and can't change the outcome.
      const retry = expectOk(
        await completeAt('2026-03-16T12:00:00-03:00', {
          answers: answersWithOneMistake,
          localDate: '2026-03-16',
        }),
      );

      expect(retry).toEqual(first);
      expect(retry.streakIncreased).toBe(true);
      expect((await store.findByUserId(userId))?.totalXp).toBe(15);
      expect(store.sessions).toHaveLength(1);
    });

    it('scopes the key to the user', async () => {
      await completeAt('2026-03-15T12:00:00-03:00');

      const otherUser = expectOk(
        await completeAt('2026-03-15T12:00:00-03:00', { userId: 'user-2' }),
      );

      expect(otherUser.xpEarned).toBe(15);
      expect((await store.findByUserId('user-2'))?.totalXp).toBe(15);
      expect(store.sessions).toHaveLength(2);
    });
  });

  describe('unknown lesson', () => {
    it('returns LESSON_NOT_FOUND and saves nothing', async () => {
      const result = await completeAt('2026-03-15T12:00:00-03:00', { lessonId: 'lesson-missing' });

      expectError(result, 'LESSON_NOT_FOUND');
      expect(store.sessions).toHaveLength(0);
      expect(await store.findByUserId(userId)).toBeNull();
    });
  });

  describe('locked lesson', () => {
    it('returns LESSON_LOCKED before the previous lesson is completed and saves nothing', async () => {
      const result = await completeAt('2026-03-15T12:00:00-03:00', { lessonId: nextLesson.id });

      expectError(result, 'LESSON_LOCKED');
      expect(store.sessions).toHaveLength(0);
      expect(await store.findByUserId(userId)).toBeNull();
    });

    it('completes the next lesson once the previous one is completed', async () => {
      expectOk(await completeAt('2026-03-15T09:00:00-03:00', { idempotencyKey: keys.first }));

      const next = expectOk(
        await completeAt('2026-03-15T10:00:00-03:00', {
          idempotencyKey: keys.second,
          lessonId: nextLesson.id,
        }),
      );

      expect(next.xpEarned).toBe(15);
      expect((await store.findByUserId(userId))?.totalXp).toBe(30);
    });
  });

  describe('streak', () => {
    it('adds XP but keeps the streak on a second lesson the same day', async () => {
      await completeAt('2026-03-15T09:00:00-03:00', { idempotencyKey: keys.first });

      const second = expectOk(
        await completeAt('2026-03-15T20:00:00-03:00', {
          idempotencyKey: keys.second,
          answers: answersWithOneMistake,
        }),
      );

      expect(second).toEqual({
        xpEarned: 10,
        streak: { current: 1, longest: 1, status: 'done_today' },
        streakIncreased: false,
      });
      expect((await store.findByUserId(userId))?.totalXp).toBe(25);
    });

    it('grows on consecutive days of the device', async () => {
      await completeAt('2026-03-15T12:00:00-03:00', { idempotencyKey: keys.first });

      const nextDay = expectOk(
        await completeAt('2026-03-16T12:00:00-03:00', {
          idempotencyKey: keys.second,
          localDate: '2026-03-16',
        }),
      );

      expect(nextDay.streak).toEqual({ current: 2, longest: 2, status: 'done_today' });
      expect(nextDay.streakIncreased).toBe(true);
      expect((await store.findByUserId(userId))?.totalXp).toBe(30);
    });

    it('grows when the device turns to the next day, though both instants are the same UTC day', async () => {
      // 23:59 on 2026-03-14 and 00:01 on 2026-03-15 on a device in UTC-3.
      const late = expectOk(
        await completeAt('2026-03-15T02:59:00Z', {
          idempotencyKey: keys.first,
          localDate: '2026-03-14',
        }),
      );
      const afterMidnight = expectOk(
        await completeAt('2026-03-15T03:01:00Z', {
          idempotencyKey: keys.second,
          localDate: '2026-03-15',
        }),
      );

      expect(late.streak).toEqual({ current: 1, longest: 1, status: 'done_today' });
      expect(afterMidnight.streak).toEqual({ current: 2, longest: 2, status: 'done_today' });
      expect(afterMidnight.streakIncreased).toBe(true);
      expect((await store.findByUserId(userId))?.streak.lastActivity?.toString()).toBe(
        '2026-03-15',
      );
    });

    it('restarts at 1 after a skipped day and reports it as an increase from the 0 shown', async () => {
      store.seedStats({
        userId,
        totalXp: 100,
        streak: Streak.restore({ current: 5, longest: 5, lastActivity: d('2026-03-12') }),
      });

      const response = expectOk(await completeAt('2026-03-15T12:00:00-03:00'));

      expect(response.streak).toEqual({ current: 1, longest: 5, status: 'done_today' });
      expect(response.streakIncreased).toBe(true);
      expect((await store.findByUserId(userId))?.totalXp).toBe(115);
    });

    it('continues a streak saved from earlier days', async () => {
      store.seedStats({
        userId,
        totalXp: 100,
        streak: Streak.restore({ current: 5, longest: 7, lastActivity: d('2026-03-14') }),
      });

      const response = expectOk(
        await completeAt('2026-03-15T12:00:00-03:00', { idempotencyKey: keys.third }),
      );

      expect(response.streak).toEqual({ current: 6, longest: 7, status: 'done_today' });
      expect(response.streakIncreased).toBe(true);
    });
  });

  describe('local date limit', () => {
    it('rejects a date more than 1 day ahead of the UTC date and saves nothing', async () => {
      const result = await completeAt('2026-03-15T12:00:00Z', { localDate: '2026-03-17' });

      expectError(result, 'LOCAL_DATE_TOO_FAR_AHEAD');
      expect(store.sessions).toHaveLength(0);
      expect(await store.findByUserId(userId)).toBeNull();
    });

    it('accepts a date exactly 1 day ahead, as on a device in UTC+14', async () => {
      const response = expectOk(
        await completeAt('2026-03-15T23:00:00Z', { localDate: '2026-03-16' }),
      );

      expect(response.streak).toEqual({ current: 1, longest: 1, status: 'done_today' });
      expect((await store.findByUserId(userId))?.streak.lastActivity?.toString()).toBe(
        '2026-03-16',
      );
    });

    it('measures the limit from the UTC date, from midnight to midnight UTC', async () => {
      expectOk(await completeAt('2026-03-15T00:00:00Z', { localDate: '2026-03-16' }));

      const tooFar = await completeAt('2026-03-15T23:59:59Z', {
        idempotencyKey: keys.second,
        localDate: '2026-03-17',
      });

      expectError(tooFar, 'LOCAL_DATE_TOO_FAR_AHEAD');
    });
  });

  describe('lesson sent late by the offline queue', () => {
    it('accepts a date before the last activity and grants XP without changing the streak', async () => {
      store.seedStats({
        userId,
        totalXp: 100,
        streak: Streak.restore({ current: 4, longest: 6, lastActivity: d('2026-03-15') }),
      });

      const response = expectOk(
        await completeAt('2026-03-16T12:00:00Z', { localDate: '2026-03-14' }),
      );

      expect(response.xpEarned).toBe(15);
      expect(response.streak).toEqual({ current: 4, longest: 6, status: 'done_today' });
      expect(response.streakIncreased).toBe(false);
      const stats = await store.findByUserId(userId);
      expect(stats?.totalXp).toBe(115);
      expect(stats?.streak.lastActivity?.toString()).toBe('2026-03-15');
    });

    it('counts a date after the last activity, even if it is no longer today', async () => {
      store.seedStats({
        userId,
        totalXp: 100,
        streak: Streak.restore({ current: 4, longest: 4, lastActivity: d('2026-03-14') }),
      });

      // Finished offline on 2026-03-15 and sent only on 2026-03-17.
      const response = expectOk(
        await completeAt('2026-03-17T12:00:00Z', { localDate: '2026-03-15' }),
      );

      expect(response.streak).toEqual({ current: 5, longest: 5, status: 'done_today' });
      expect((await store.findByUserId(userId))?.streak.lastActivity?.toString()).toBe(
        '2026-03-15',
      );
    });
  });
});
