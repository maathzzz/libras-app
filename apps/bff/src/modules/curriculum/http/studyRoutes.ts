import { ErrorResponse, StudiesResponse, StudyGuide } from '@libras/contracts';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { errorBody } from '../../../shared/infrastructure/errorHandler';
import type { GetStudies } from '../application/GetStudies';
import type { GetStudy } from '../application/GetStudy';

export interface StudyUseCases {
  getStudies: GetStudies;
  getStudy: GetStudy;
}

const studyParams = z.object({ studyId: z.string().min(1) });

// Registered under /v1, behind authPlugin. Studies are the same for every learner, so the
// token is checked but its user is not used.
export function studyRoutes({ getStudies, getStudy }: StudyUseCases): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/studies', { schema: { response: { 200: StudiesResponse } } }, async () =>
      getStudies.execute(),
    );

    // STUDY_NOT_FOUND is the only expected failure.
    app.get(
      '/studies/:studyId',
      { schema: { params: studyParams, response: { 200: StudyGuide, 404: ErrorResponse } } },
      async (request, reply) => {
        const result = await getStudy.execute({ studyId: request.params.studyId });
        if (result.ok) return result.value;

        const { code, message } = result.error;
        return reply.status(404).send(errorBody(code, message));
      },
    );
  };
}
