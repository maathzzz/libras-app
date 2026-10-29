import { randomUUID } from 'node:crypto';

import { CompleteLessonResponse, HomeResponse, type CompleteLessonBody } from '@libras/contracts';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from './app';
import { createContainer } from './container';
import { SystemClock } from './shared/application/SystemClock';
import { createAccessTokenVerifier } from './shared/infrastructure/auth';
import type { DbExecutor } from './shared/infrastructure/db/client';
import { lessonSessions, userLessonProgress } from './shared/infrastructure/db/schema';
import {
  insertCourse,
  insertExercise,
  insertLesson,
  insertUnit,
  insertUser,
  moveExistingTrailsBack,
  signToWordExercise,
} from './shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from './shared/infrastructure/db/testing/testDatabase';
import { loadEnv } from './shared/infrastructure/env';
import { testIssuer } from './testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from './testing/testTokens';

const inRollback = useTestDatabase();

let tokens: TestTokens;

beforeAll(async () => {
  tokens = await createTestTokens();
});

// The real app on the database, inside the test transaction. Only the token check is swapped,
// so the test signs its own tokens instead of asking Supabase Auth for one.
function appFor(tx: DbExecutor) {
  const env = loadEnv();
  const container = createContainer(tx, {
    supabaseUrl: env.SUPABASE_URL,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
  });
  return buildApp(
    {
      ...container,
      verifyAccessToken: createAccessTokenVerifier({
        jwks: tokens.jwks,
        issuer: testIssuer,
        audience: 'authenticated',
        clock: new SystemClock(),
      }),
    },
    { logger: false },
  );
}

// A trail at the first position with one lesson in each of two units.
async function insertTrail(tx: DbExecutor) {
  await moveExistingTrailsBack(tx);
  await insertCourse(tx, 'it-e2e-course', 1);
  await insertUnit(tx, { id: 'it-e2e-unit-1', courseId: 'it-e2e-course', position: 1 });
  await insertUnit(tx, { id: 'it-e2e-unit-2', courseId: 'it-e2e-course', position: 2 });
  await insertLesson(tx, { id: 'it-e2e-lesson-1', unitId: 'it-e2e-unit-1', position: 1 });
  await insertLesson(tx, { id: 'it-e2e-lesson-2', unitId: 'it-e2e-unit-2', position: 1 });
  await insertExercise(tx, {
    lessonId: 'it-e2e-lesson-1',
    position: 1,
    payload: signToWordExercise('it-e2e-ex-1'),
  });
  await insertExercise(tx, {
    lessonId: 'it-e2e-lesson-2',
    position: 1,
    payload: signToWordExercise('it-e2e-ex-2'),
  });
}

// The real clock runs here, so today's UTC date is always within the limit.
const todayIso = () => new Date().toISOString().slice(0, 10);

const statusesOf = (home: HomeResponse) =>
  home.trail.units.map((unit) => unit.lessons.map((lesson) => lesson.status));

describe('lesson completion, end to end', () => {
  it(
    'completes the first lesson, unlocks the next one and replays a retry without changes',
    inRollback(async (tx) => {
      const userId = await insertUser(tx);
      await insertTrail(tx);
      const app = appFor(tx);
      const token = await tokens.sign(userId, { now: new Date() });
      const today = todayIso();
      const idempotencyKey = randomUUID();
      const authorization = `Bearer ${token}`;

      const getHome = async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/v1/home',
          headers: { authorization, 'x-local-date': today },
        });
        expect(response.statusCode).toBe(200);
        return HomeResponse.parse(response.json());
      };
      const completeFirstLesson = async (optionId: string) => {
        const payload: CompleteLessonBody = {
          answers: [{ exerciseId: 'it-e2e-ex-1', answer: { type: 'sign_to_word', optionId } }],
          localDate: today,
        };
        const response = await app.inject({
          method: 'POST',
          url: '/v1/lessons/it-e2e-lesson-1/sessions',
          payload,
          headers: { authorization, 'idempotency-key': idempotencyKey },
        });
        expect(response.statusCode).toBe(200);
        return CompleteLessonResponse.parse(response.json());
      };

      const before = await getHome();
      expect(before.trail.id).toBe('it-e2e-course');
      expect(statusesOf(before)).toEqual([['available'], ['locked']]);
      expect(before.streak).toEqual({ current: 0, longest: 0, status: 'broken' });
      expect(before.totalXp).toBe(0);

      const completion = await completeFirstLesson('a');
      expect(completion).toEqual({
        xpEarned: 15,
        streak: { current: 1, longest: 1, status: 'done_today' },
        streakIncreased: true,
      });

      const after = await getHome();
      expect(statusesOf(after)).toEqual([['completed'], ['available']]);
      expect(after.streak).toEqual({ current: 1, longest: 1, status: 'done_today' });
      expect(after.totalXp).toBe(before.totalXp + completion.xpEarned);

      // Wrong answers on the retry prove the stored result is replayed, not recomputed.
      const retry = await completeFirstLesson('b');
      expect(retry).toEqual(completion);
      expect(await getHome()).toEqual(after);

      const [sessions, progress] = await Promise.all([
        tx.select().from(lessonSessions).where(eq(lessonSessions.userId, userId)),
        tx.select().from(userLessonProgress).where(eq(userLessonProgress.userId, userId)),
      ]);
      expect(sessions).toHaveLength(1);
      expect(progress).toEqual([
        expect.objectContaining({ lessonId: 'it-e2e-lesson-1', completionCount: 1 }),
      ]);
    }),
  );
});
