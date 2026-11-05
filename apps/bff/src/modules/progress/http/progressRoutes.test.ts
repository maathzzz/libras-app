import {
  AchievementsResponse,
  CompleteLessonResponse,
  ErrorResponse,
  HomeResponse,
  LessonBundle,
  type CompleteLessonBody,
} from '@libras/contracts';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { LocalDate } from '../../../shared/domain/LocalDate';
import { createInMemoryContainer } from '../../../testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from '../../../testing/testTokens';
import { Streak } from '../domain/Streak';
import { emptyStats } from '../domain/UserStatsRepository';
import { InMemoryLessonCatalog } from '../testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../testing/InMemoryTrailCatalog';

const now = new Date('2026-03-15T12:00:00Z');
const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';

const lesson = (id: string): LessonBundle => ({
  id,
  title: `Lição ${id}`,
  exercises: [
    {
      id: `${id}-ex`,
      type: 'word_to_sign',
      word: 'Oi',
      options: [
        { id: 'a', images: [{ url: 'https://example.com/oi.png', alt: 'Mão aberta' }] },
        { id: 'b', images: [{ url: 'https://example.com/tchau.png', alt: 'Mão fechada' }] },
      ],
      correctOptionId: 'a',
    },
  ],
});

const idempotencyKey = '6f1c2a3e-1b2d-4c5e-8f90-1a2b3c4d5e01';

// Answers the only exercise of `lesson(id)` right, or wrong.
const body = (lessonId: string, optionId = 'a'): CompleteLessonBody => ({
  answers: [{ exerciseId: `${lessonId}-ex`, answer: { type: 'word_to_sign', optionId } }],
  localDate: '2026-03-15',
});

const trail = {
  id: 'libras-iniciante',
  title: 'Libras para iniciantes',
  position: 1,
  units: [
    { id: 'alfabeto', title: 'Alfabeto', lessons: [{ id: 'vogais', title: 'Lição vogais' }] },
    { id: 'saudacoes', title: 'Saudações', lessons: [{ id: 'oi', title: 'Lição oi' }] },
  ],
};

let tokens: TestTokens;
let token: string;

beforeAll(async () => {
  tokens = await createTestTokens();
  token = await tokens.sign(userId, { now });
});

describe('progress routes', () => {
  let progress: InMemoryProgressStore;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    progress = new InMemoryProgressStore();
    const container = createInMemoryContainer(new FixedClock(now), {
      jwks: tokens.jwks,
      progress,
      lessons: new InMemoryLessonCatalog([lesson('vogais'), lesson('oi')]),
      trails: new InMemoryTrailCatalog([trail]),
    });
    app = buildApp(container, { logger: false });
  });

  const get = (url: string, headers: Record<string, string> = {}) =>
    app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}`, ...headers } });

  const post = (
    url: string,
    payload: object,
    headers: Record<string, string> = { 'idempotency-key': idempotencyKey },
  ) =>
    app.inject({
      method: 'POST',
      url,
      payload,
      headers: { authorization: `Bearer ${token}`, ...headers },
    });

  const expectError = (
    response: Awaited<ReturnType<typeof post>>,
    status: number,
    code: string,
  ) => {
    expect(response.statusCode).toBe(status);
    expect(ErrorResponse.parse(response.json()).error.code).toBe(code);
  };

  describe('GET /v1/home', () => {
    it('answers the trail with lesson statuses, the streak and the XP', async () => {
      progress.seedCompletedLessons(userId, ['vogais']);
      progress.seedStats({
        ...emptyStats(userId),
        totalXp: 15,
        streak: Streak.empty().registerLessonCompleted(LocalDate.of(2026, 3, 14)),
      });

      const response = await get('/v1/home', { 'x-local-date': '2026-03-15' });

      expect(response.statusCode).toBe(200);
      expect(HomeResponse.parse(response.json())).toEqual({
        trail: {
          ...trail,
          totalTrails: 1,
          units: [
            {
              id: 'alfabeto',
              title: 'Alfabeto',
              lessons: [{ id: 'vogais', title: 'Lição vogais', status: 'completed' }],
            },
            {
              id: 'saudacoes',
              title: 'Saudações',
              lessons: [{ id: 'oi', title: 'Lição oi', status: 'available' }],
            },
          ],
        },
        streak: { current: 1, longest: 1, status: 'at_risk' },
        totalXp: 15,
      });
    });

    it('answers 401 without a token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/home',
        headers: { 'x-local-date': '2026-03-15' },
      });

      expect(response.statusCode).toBe(401);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('UNAUTHORIZED');
    });

    it('answers 400 without X-Local-Date', async () => {
      const response = await get('/v1/home');

      expect(response.statusCode).toBe(400);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('INVALID_LOCAL_DATE');
    });
  });

  describe('GET /v1/lessons/:lessonId', () => {
    it('answers the lesson bundle of an unlocked lesson', async () => {
      const response = await get('/v1/lessons/vogais');

      expect(response.statusCode).toBe(200);
      expect(LessonBundle.parse(response.json())).toEqual(lesson('vogais'));
    });

    it('answers 401 without a token', async () => {
      const response = await app.inject({ method: 'GET', url: '/v1/lessons/vogais' });

      expect(response.statusCode).toBe(401);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('UNAUTHORIZED');
    });

    it('answers 404 LESSON_NOT_FOUND for an unknown lesson', async () => {
      const response = await get('/v1/lessons/missing');

      expect(response.statusCode).toBe(404);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('LESSON_NOT_FOUND');
    });

    it('answers 403 LESSON_LOCKED for a lesson the learner has not unlocked', async () => {
      const response = await get('/v1/lessons/oi');

      expect(response.statusCode).toBe(403);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('LESSON_LOCKED');
    });
  });

  describe('POST /v1/lessons/:lessonId/sessions', () => {
    it('completes the lesson and answers the XP and the streak', async () => {
      const response = await post('/v1/lessons/vogais/sessions', body('vogais'));

      expect(response.statusCode).toBe(200);
      expect(CompleteLessonResponse.parse(response.json())).toEqual({
        xpEarned: 15,
        streak: { current: 1, longest: 1, status: 'done_today' },
        streakIncreased: true,
        achievementsUnlocked: [
          {
            id: 'first-lesson',
            title: 'Primeiro sinal',
            description: 'Conclua sua primeira lição.',
            category: 'lessons',
          },
          expect.objectContaining({ id: 'first-perfect' }),
          expect.objectContaining({ id: 'first-module' }),
        ],
      });
      expect((await progress.findByUserId(userId))?.totalXp).toBe(15);
      expect(await progress.findCompletedLessonIds(userId)).toEqual(new Set(['vogais']));
    });

    it('answers 200 with the first result to a retry with the same key, without granting XP again', async () => {
      const first = await post('/v1/lessons/vogais/sessions', body('vogais'));

      // Other answers on the retry cannot change the result already granted.
      const retry = await post('/v1/lessons/vogais/sessions', body('vogais', 'b'));

      expect(retry.statusCode).toBe(200);
      expect(retry.json()).toEqual(first.json());
      expect(progress.sessions).toHaveLength(1);
      expect((await progress.findByUserId(userId))?.totalXp).toBe(15);
    });

    it('answers 400 INVALID_IDEMPOTENCY_KEY without the Idempotency-Key header', async () => {
      const response = await post('/v1/lessons/vogais/sessions', body('vogais'), {});

      expectError(response, 400, 'INVALID_IDEMPOTENCY_KEY');
      expect(progress.sessions).toHaveLength(0);
    });

    it('answers 400 INVALID_IDEMPOTENCY_KEY for a key that is not a UUID', async () => {
      const response = await post('/v1/lessons/vogais/sessions', body('vogais'), {
        'idempotency-key': 'key-1',
      });

      expectError(response, 400, 'INVALID_IDEMPOTENCY_KEY');
    });

    it.each([
      ['without answers', { ...body('vogais'), answers: [] }],
      ['with an invalid local date', { ...body('vogais'), localDate: '2026-02-30' }],
      ['without a local date', { answers: body('vogais').answers }],
    ])('answers 400 VALIDATION_ERROR for a body %s', async (_, payload) => {
      const response = await post('/v1/lessons/vogais/sessions', payload);

      expectError(response, 400, 'VALIDATION_ERROR');
      expect(progress.sessions).toHaveLength(0);
    });

    it('answers 404 LESSON_NOT_FOUND for an unknown lesson', async () => {
      const response = await post('/v1/lessons/missing/sessions', body('missing'));

      expectError(response, 404, 'LESSON_NOT_FOUND');
    });

    it('answers 403 LESSON_LOCKED for a lesson the learner has not unlocked', async () => {
      const response = await post('/v1/lessons/oi/sessions', body('oi'));

      expectError(response, 403, 'LESSON_LOCKED');
      expect(progress.sessions).toHaveLength(0);
    });

    it('answers 422 LOCAL_DATE_TOO_FAR_AHEAD for a date more than 1 day ahead', async () => {
      const response = await post('/v1/lessons/vogais/sessions', {
        ...body('vogais'),
        localDate: '2026-03-17',
      });

      expectError(response, 422, 'LOCAL_DATE_TOO_FAR_AHEAD');
      expect(progress.sessions).toHaveLength(0);
    });

    it('answers 401 without a token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/lessons/vogais/sessions',
        payload: body('vogais'),
        headers: { 'idempotency-key': idempotencyKey },
      });

      expectError(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('GET /v1/achievements', () => {
    it('answers every achievement with its progress and unlock date', async () => {
      await post('/v1/lessons/vogais/sessions', body('vogais'));

      const response = await get('/v1/achievements');

      expect(response.statusCode).toBe(200);
      const { achievements } = AchievementsResponse.parse(response.json());
      expect(achievements).toHaveLength(15);
      expect(achievements.find(({ id }) => id === 'first-lesson')).toEqual({
        id: 'first-lesson',
        title: 'Primeiro sinal',
        description: 'Conclua sua primeira lição.',
        category: 'lessons',
        progress: { current: 1, target: 1 },
        unlockedAt: now.toISOString(),
      });
      expect(achievements.find(({ id }) => id === 'lessons-10')).toMatchObject({
        progress: { current: 1, target: 10 },
        unlockedAt: null,
      });
    });

    it('does not need the local date header', async () => {
      const response = await get('/v1/achievements');

      expect(response.statusCode).toBe(200);
    });

    it('answers 401 without a token', async () => {
      const response = await app.inject({ method: 'GET', url: '/v1/achievements' });

      expectError(response, 401, 'UNAUTHORIZED');
    });
  });
});
