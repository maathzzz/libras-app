import type { FastifyRequest } from 'fastify';

import { LocalDate } from '../domain/LocalDate';
import { HttpError } from './HttpError';

// The device's local date, sent by the app as YYYY-MM-DD in every request. Called by the
// handlers that need "today" for the learner; a missing or invalid header answers 400.
export function readLocalDate(request: FastifyRequest): LocalDate {
  const value = request.headers['x-local-date'];
  if (value === undefined) {
    throw new HttpError(400, 'INVALID_LOCAL_DATE', 'Missing X-Local-Date header');
  }

  // A repeated header arrives as an array: there is no single "today" to pick.
  const malformed = new HttpError(
    400,
    'INVALID_LOCAL_DATE',
    'X-Local-Date must be a valid date in the format YYYY-MM-DD',
  );
  if (typeof value !== 'string') throw malformed;

  try {
    return LocalDate.parse(value);
  } catch {
    throw malformed;
  }
}
