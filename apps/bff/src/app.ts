import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { Container } from './container';
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

  return app;
}
