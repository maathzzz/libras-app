import { STATUS_CODES } from 'node:http';

import type { ErrorResponse } from '@libras/contracts';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

export function errorBody(code: string, message: string): ErrorResponse {
  return { error: { code, message } };
}

// "Payload Too Large" -> "PAYLOAD_TOO_LARGE"
function codeForStatus(status: number): string {
  return STATUS_CODES[status]?.toUpperCase().replace(/\W+/g, '_') ?? 'BAD_REQUEST';
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send(errorBody('VALIDATION_ERROR', error.message));
  }

  const status = error.statusCode ?? 500;
  if (status >= 500) {
    request.log.error({ err: error }, 'unexpected error');
    // The details stay in the log; the client never sees internals.
    return reply.status(500).send(errorBody('INTERNAL_ERROR', 'Internal server error'));
  }

  // Client errors raised by Fastify itself, such as malformed JSON or an unsupported media type.
  return reply.status(status).send(errorBody(codeForStatus(status), error.message));
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply
    .status(404)
    .send(errorBody('NOT_FOUND', `Route ${request.method} ${request.url} not found`));
}
