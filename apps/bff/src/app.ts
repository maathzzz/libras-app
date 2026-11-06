import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { Container } from './container';
import { adminRoutes } from './modules/admin/http/adminRoutes';
import { studyRoutes } from './modules/curriculum/http/studyRoutes';
import { profileRoutes } from './modules/profile/http/profileRoutes';
import { progressRoutes } from './modules/progress/http/progressRoutes';
import { authPlugin, rejectOperatorAccounts } from './shared/infrastructure/auth';
import { errorHandler, notFoundHandler } from './shared/infrastructure/errorHandler';
import { healthRoutes } from './shared/infrastructure/healthRoutes';

interface AppOptions {
  logger: NonNullable<FastifyServerOptions['logger']>;
}

export function buildApp(container: Container, { logger }: AppOptions) {
  const app = Fastify({ logger }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.register(healthRoutes(container.clock));

  // Everything under /v1 needs a valid access token; /health stays public.
  app.register(
    async (v1) => {
      await v1.register(authPlugin(container.verifyAccessToken));
      // Learners and CMS operators use separate accounts, and each scope refuses the other's.
      await v1.register(async (learner) => {
        learner.addHook('onRequest', rejectOperatorAccounts);
        await learner.register(profileRoutes(container));
        await learner.register(progressRoutes(container));
        await learner.register(studyRoutes(container));
      });
      await v1.register(adminRoutes(container), { prefix: '/admin' });
    },
    { prefix: '/v1' },
  );

  return app;
}
