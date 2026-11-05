import {
  AchievementsResponse,
  CompleteLessonBody,
  CompleteLessonResponse,
  ErrorResponse,
  HomeResponse,
  LessonBundle,
} from '@libras/contracts';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { DomainError } from '../../../shared/domain/DomainError';
import { authenticatedUser } from '../../../shared/infrastructure/auth';
import { errorBody } from '../../../shared/infrastructure/errorHandler';
import { readIdempotencyKey } from '../../../shared/infrastructure/idempotencyKeyHeader';
import { readLocalDate } from '../../../shared/infrastructure/localDateHeader';
import type { CompleteLesson } from '../application/CompleteLesson';
import type { GetAchievements } from '../application/GetAchievements';
import type { GetHome } from '../application/GetHome';
import type { GetLesson } from '../application/GetLesson';

export interface ProgressUseCases {
  getHome: GetHome;
  getLesson: GetLesson;
  completeLesson: CompleteLesson;
  getAchievements: GetAchievements;
}

const lessonErrorStatus: Record<string, 403 | 404> = {
  LESSON_NOT_FOUND: 404,
  LESSON_LOCKED: 403,
};

const completionErrorStatus: Record<string, 403 | 404 | 422> = {
  ...lessonErrorStatus,
  LOCAL_DATE_TOO_FAR_AHEAD: 422,
};

function statusOf<Status extends number>(
  statuses: Record<string, Status>,
  { code }: DomainError,
): Status {
  const status = statuses[code];
  if (!status) throw new Error(`Unmapped progress error ${code}`);
  return status;
}

const lessonParams = z.object({ lessonId: z.string().min(1) });

// Registered under /v1, behind authPlugin.
export function progressRoutes({
  getHome,
  getLesson,
  completeLesson,
  getAchievements,
}: ProgressUseCases): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/home', { schema: { response: { 200: HomeResponse } } }, async (request) => {
      const { userId } = authenticatedUser(request);
      return getHome.execute({ userId, today: readLocalDate(request) });
    });

    // Profile screen. Unlocking happens only in the lesson completion below.
    app.get(
      '/achievements',
      { schema: { response: { 200: AchievementsResponse } } },
      async (request) => {
        const { userId } = authenticatedUser(request);
        return getAchievements.execute({ userId });
      },
    );

    app.get(
      '/lessons/:lessonId',
      {
        schema: {
          params: lessonParams,
          response: { 200: LessonBundle, 403: ErrorResponse, 404: ErrorResponse },
        },
      },
      async (request, reply) => {
        const { userId } = authenticatedUser(request);
        const result = await getLesson.execute({ userId, lessonId: request.params.lessonId });
        if (result.ok) return result.value;

        const { code, message } = result.error;
        return reply
          .status(statusOf(lessonErrorStatus, result.error))
          .send(errorBody(code, message));
      },
    );

    // A retry with the same Idempotency-Key answers 200 with the first result, without
    // granting XP again, so the offline queue can resend until it gets an answer.
    app.post(
      '/lessons/:lessonId/sessions',
      {
        schema: {
          params: lessonParams,
          body: CompleteLessonBody,
          response: {
            200: CompleteLessonResponse,
            403: ErrorResponse,
            404: ErrorResponse,
            422: ErrorResponse,
          },
        },
      },
      async (request, reply) => {
        const { userId } = authenticatedUser(request);
        const result = await completeLesson.execute({
          userId,
          lessonId: request.params.lessonId,
          idempotencyKey: readIdempotencyKey(request),
          ...request.body,
        });
        if (result.ok) return result.value;

        const { code, message } = result.error;
        return reply
          .status(statusOf(completionErrorStatus, result.error))
          .send(errorBody(code, message));
      },
    );
  };
}
