import type { z } from 'zod';

import { getLocalDate } from '../lib/localDate';
import { endSession, getAccessToken, refreshAccessToken } from './session';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

function send(
  url: string,
  token: string | null,
  { method = 'GET', body, headers = {} }: RequestOptions,
): Promise<Response> {
  // The BFF takes the user from this token, never from the body.
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // The streak's "day" is the device's date; the BFF has no time zone of its own.
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Local-Date': getLocalDate(),
      ...auth,
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

// Responses are parsed with the schemas from @libras/contracts so the app never trusts the wire format.
export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  options: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada');
  }

  const url = `${baseUrl}${path}`;
  const failure = (status: number) =>
    new ApiError(status, `Falha na requisição ${options.method ?? 'GET'} ${path}`);

  let response = await send(url, await getAccessToken(), options);

  // The token expired or was revoked: renew the session once and send the request again.
  if (response.status === 401) {
    const token = await refreshAccessToken();
    if (!token) {
      // The session can no longer be renewed. Ending it takes the learner back to the login.
      await endSession();
      throw failure(401);
    }
    response = await send(url, token, options);
  }

  if (!response.ok) {
    throw failure(response.status);
  }

  // 204 No Content (e.g. DELETE /v1/me) has no body to read.
  return schema.parse(response.status === 204 ? undefined : await response.json());
}

// A request that may work if sent again later: no network (fetch rejects with a TypeError)
// or a server failure. A 4xx will fail the same way again.
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500;
  return error instanceof TypeError;
}
