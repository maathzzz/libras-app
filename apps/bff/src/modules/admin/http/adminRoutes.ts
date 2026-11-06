import { AdminMeResponse, ErrorResponse } from '@libras/contracts';
import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { authenticatedUser } from '../../../shared/infrastructure/auth';
import { HttpError } from '../../../shared/infrastructure/HttpError';
import type { AuthorizeAdmin } from '../application/AuthorizeAdmin';
import type { Admin } from '../domain/AdminRepository';

export interface AdminUseCases {
  authorizeAdmin: AuthorizeAdmin;
}

declare module 'fastify' {
  interface FastifyRequest {
    // Set by the admin scope's hook before any /v1/admin handler runs.
    admin: Admin | null;
  }
}

// For handlers inside adminRoutes, where `admin` is always set.
export function currentAdmin(request: FastifyRequest): Admin {
  if (!request.admin) throw new Error('Route is not inside adminRoutes');
  return request.admin;
}

// Registered under /v1 with the /admin prefix, behind authPlugin: the token is already
// checked, so this scope only decides whether its user is an operator. Not wrapped in fp(),
// so the hook stays inside /v1/admin and never runs for the learners' routes.
export function adminRoutes({ authorizeAdmin }: AdminUseCases): FastifyPluginAsyncZod {
  return async (app) => {
    app.decorateRequest('admin', null);

    app.addHook('onRequest', async (request) => {
      const { userId, operator } = authenticatedUser(request);
      const result = await authorizeAdmin.execute({ userId, operator });
      if (!result.ok) throw new HttpError(403, result.error.code, result.error.message);
      request.admin = result.value;
    });

    app.get(
      '/me',
      { schema: { response: { 200: AdminMeResponse, 403: ErrorResponse } } },
      async (request) => {
        const { name, email } = currentAdmin(request);
        return { name, email };
      },
    );
  };
}
