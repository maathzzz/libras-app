import { ErrorResponse, ProfileResponse, UpdateProfileRequest } from '@libras/contracts';
import type { FastifyReply } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import type { DomainError } from '../../../shared/domain/DomainError';
import { authenticatedUser } from '../../../shared/infrastructure/auth';
import { errorBody } from '../../../shared/infrastructure/errorHandler';
import type { DeleteAccount } from '../application/DeleteAccount';
import type { GetProfile } from '../application/GetProfile';
import type { UpdateProfile } from '../application/UpdateProfile';

export interface ProfileUseCases {
  getProfile: GetProfile;
  updateProfile: UpdateProfile;
  deleteAccount: DeleteAccount;
}

const responses = { 200: ProfileResponse, 404: ErrorResponse };

// ACCOUNT_NOT_FOUND is the only expected failure: a token that outlived its deleted account.
function sendDomainError(reply: FastifyReply, error: DomainError) {
  return reply.status(404).send(errorBody(error.code, error.message));
}

// Registered under /v1, behind authPlugin.
export function profileRoutes({
  getProfile,
  updateProfile,
  deleteAccount,
}: ProfileUseCases): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/me', { schema: { response: responses } }, async (request, reply) => {
      const { userId, email } = authenticatedUser(request);
      const result = await getProfile.execute({ userId, email });
      if (!result.ok) return sendDomainError(reply, result.error);
      return result.value;
    });

    app.patch(
      '/me',
      { schema: { body: UpdateProfileRequest, response: responses } },
      async (request, reply) => {
        const { userId, email } = authenticatedUser(request);
        const result = await updateProfile.execute({ userId, email, changes: request.body });
        if (!result.ok) return sendDomainError(reply, result.error);
        return result.value;
      },
    );

    // Naturally idempotent, so it needs no Idempotency-Key.
    app.delete('/me', async (request, reply) => {
      await deleteAccount.execute({ userId: authenticatedUser(request).userId });
      return reply.status(204).send();
    });
  };
}
