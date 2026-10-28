import { ErrorResponse, HomeResponse, LessonBundle } from '@libras/contracts';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { LocalDate } from '../../../shared/domain/LocalDate';
import { createInMemoryContainer } from '../../../testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from '../../../testing/testTokens';
import { Streak } from '../domain/Streak';
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

  describe('GET /v1/home', () => {
    it('answers the trail with lesson statuses, the streak and the XP', async () => {
      progress.seedCompletedLessons(userId, ['vogais']);
      progress.seedStats({
        userId,
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
});
