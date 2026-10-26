import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Clock } from '../application/Clock';

// Operational endpoint for the load balancer, not used by the app, so its schema stays here
// instead of in @libras/contracts.
const HealthResponse = z.object({
  status: z.literal('ok'),
  // Server time, handy when checking the streak and the local date limit (1 day past UTC).
  time: z.iso.datetime(),
});

export function healthRoutes(clock: Clock): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/health', { schema: { response: { 200: HealthResponse } } }, async () => ({
      status: 'ok' as const,
      time: clock.now().toISOString(),
    }));
  };
}
