import { IdempotencyKey } from '@libras/contracts';
import type { FastifyRequest } from 'fastify';

import { HttpError } from './HttpError';

// Sensitive writes carry the Idempotency-Key header, so a retry of the same write is answered
// with the first result instead of being applied twice. A missing or invalid key answers 400.
export function readIdempotencyKey(request: FastifyRequest): string {
  const value = request.headers['idempotency-key'];
  if (value === undefined) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Missing Idempotency-Key header');
  }

  // A repeated header arrives as an array: there is no single key to pick.
  const parsed = IdempotencyKey.safeParse(value);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be a UUID');
  }
  return parsed.data;
}
