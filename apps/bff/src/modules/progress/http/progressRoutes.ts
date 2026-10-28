import { ErrorResponse, HomeResponse, LessonBundle } from '@libras/contracts';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { authenticatedUser } from '../../../shared/infrastructure/auth';
import { errorBody } from '../../../shared/infrastructure/errorHandler';
import { readLocalDate } from '../../../shared/infrastructure/localDateHeader';
import type { GetHome } from '../application/GetHome';
import type { GetLesson } from '../application/GetLesson';

export interface ProgressUseCases {
  getHome: GetHome;
  getLesson: GetLesson;
}

const lessonErrorStatus: Record<string, 403 | 404> = {
  LESSON_NOT_FOUND: 404,
  LESSON_LOCKED: 403,
};

// Registered under /v1, behind authPlugin.
export function progressRoutes({ getHome, getLesson }: ProgressUseCases): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/home', { schema: { response: { 200: HomeResponse } } }, async (request) => {
      const { userId } = authenticatedUser(request);
      return getHome.execute({ userId, today: readLocalDate(request) });
    });

    app.get(
      '/lessons/:lessonId',
      {
        schema: {
          params: z.object({ lessonId: z.string().min(1) }),
          response: { 200: LessonBundle, 403: ErrorResponse, 404: ErrorResponse },
        },
      },
      async (request, reply) => {
        const { userId } = authenticatedUser(request);
        const result = await getLesson.execute({ userId, lessonId: request.params.lessonId });
        if (result.ok) return result.value;

        const { code, message } = result.error;
        const status = lessonErrorStatus[code];
        if (!status) throw new Error(`Unmapped lesson error ${code}`);
        return reply.status(status).send(errorBody(code, message));
      },
    );
  };
}
