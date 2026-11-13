import {
  AdminMeResponse,
  AdminOperatorsResponse,
  CreateOperatorRequest,
  ErrorResponse,
  TemporaryPasswordResponse,
  UpdateOperatorRequest,
} from '@libras/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { DomainError } from '../../../shared/domain/DomainError';
import type { Result } from '../../../shared/domain/Result';
import { authenticatedUser } from '../../../shared/infrastructure/auth';
import { errorBody } from '../../../shared/infrastructure/errorHandler';
import { HttpError } from '../../../shared/infrastructure/HttpError';
import type { AuthorizeAdmin } from '../application/AuthorizeAdmin';
import type { CreateOperator } from '../application/CreateOperator';
import type { GetOperators } from '../application/GetOperators';
import type { ResetOperatorPassword } from '../application/ResetOperatorPassword';
import type { UpdateOperator } from '../application/UpdateOperator';
import type { Admin } from '../domain/AdminRepository';

export interface AdminUseCases {
  authorizeAdmin: AuthorizeAdmin;
  getOperators: GetOperators;
  createOperator: CreateOperator;
  updateOperator: UpdateOperator;
  resetOperatorPassword: ResetOperatorPassword;
}

const operatorStatus: Record<string, 404 | 409 | 422> = {
  OPERATOR_NOT_FOUND: 404,
  EMAIL_HAS_ACCOUNT: 409,
  CANNOT_DEACTIVATE_SELF: 422,
};

function sendError(reply: FastifyReply, { code, message }: DomainError) {
  return reply.status(operatorStatus[code] ?? 422).send(errorBody(code, message));
}

// Writes answer 204, or the error of the use case.
function sendEmpty(reply: FastifyReply, result: Result<void>) {
  return result.ok ? reply.status(204).send() : sendError(reply, result.error);
}

const errors = { 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 422: ErrorResponse };
const operatorParams = z.object({ userId: z.uuid() });

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
// so the hook stays inside /v1/admin and never runs for the learners' routes. The CMS routes
// of other modules come in `cmsRoutes` and are registered inside this scope, behind the hook.
export function adminRoutes(
  {
    authorizeAdmin,
    getOperators,
    createOperator,
    updateOperator,
    resetOperatorPassword,
  }: AdminUseCases,
  cmsRoutes: readonly FastifyPluginAsyncZod[] = [],
): FastifyPluginAsyncZod {
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

    app.get('/operators', { schema: { response: { 200: AdminOperatorsResponse } } }, async () =>
      getOperators.execute(),
    );

    // The temporary password is shown once: no cache may keep the answer.
    app.post(
      '/operators',
      {
        schema: {
          body: CreateOperatorRequest,
          response: { 201: TemporaryPasswordResponse, ...errors },
        },
      },
      async (request, reply) => {
        const result = await createOperator.execute(request.body);
        if (!result.ok) return sendError(reply, result.error);
        return reply.status(201).header('cache-control', 'no-store').send(result.value);
      },
    );

    app.patch(
      '/operators/:userId',
      { schema: { params: operatorParams, body: UpdateOperatorRequest, response: errors } },
      async (request, reply) => {
        const result = await updateOperator.execute({
          userId: request.params.userId,
          byUserId: currentAdmin(request).userId,
          ...request.body,
        });
        return sendEmpty(reply, result);
      },
    );

    app.post(
      '/operators/:userId/password',
      {
        schema: { params: operatorParams, response: { 200: TemporaryPasswordResponse, ...errors } },
      },
      async (request, reply) => {
        const result = await resetOperatorPassword.execute({ userId: request.params.userId });
        if (!result.ok) return sendError(reply, result.error);
        return reply.header('cache-control', 'no-store').send(result.value);
      },
    );

    for (const routes of cmsRoutes) await app.register(routes);
  };
}
