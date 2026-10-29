import { ErrorResponse } from '@libras/contracts';
import { z } from 'zod';

import { getLocalDate } from '../lib/localDate';
import { endSession, getAccessToken, refreshAccessToken } from './session';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

// Past this the request counts as lost: without it a screen would wait on a spinner forever.
const requestTimeoutMs = 15_000;

/**
 * `network`: no answer (no connection, or none in time).
 * `server`: a 5xx, or an answer outside the contract.
 * `request`: a 4xx; `code` says why (e.g. LESSON_LOCKED).
 */
export type ApiErrorKind = 'network' | 'server' | 'request';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status: number | null = null,
    readonly code: string | null = null,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

async function send(
  url: string,
  token: string | null,
  { method = 'GET', body, headers = {} }: RequestOptions,
): Promise<Response> {
  // The BFF takes the user from this token, never from the body.
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    // The streak's "day" is the device's date; the BFF has no time zone of its own.
    return await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Date': getLocalDate(),
        ...auth,
        ...headers,
      },
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    // fetch only rejects when no response arrived: no connection, or the timeout above.
    throw new ApiError('network', `Sem resposta para ${method} ${url}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function renewedToken(): Promise<string | null> {
  try {
    return await refreshAccessToken();
  } catch {
    // Supabase could not be reached; the session is kept and the request can be retried.
    throw new ApiError('network', 'Sem conexão para renovar a sessão');
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function failure(response: Response, label: string): Promise<ApiError> {
  const body = ErrorResponse.safeParse(await readJson(response));
  const code = body.success ? body.data.error.code : null;
  const kind = response.status >= 500 ? 'server' : 'request';
  return new ApiError(kind, `${label} falhou com ${response.status}`, response.status, code);
}

// Responses are parsed with the schemas from @libras/contracts so the app never trusts the wire
// format. Every failure becomes an ApiError, so callers handle one kind of error.
export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  options: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada');
  }

  const url = `${baseUrl}${path}`;
  const label = `${options.method ?? 'GET'} ${path}`;

  let response = await send(url, await getAccessToken(), options);

  // The token expired or was revoked: renew the session once and send the request again.
  if (response.status === 401) {
    const token = await renewedToken();
    if (!token) {
      // The session can no longer be renewed. Ending it takes the learner back to the login.
      await endSession();
      throw new ApiError('request', `${label} recusada: sessão encerrada`, 401, 'UNAUTHORIZED');
    }
    response = await send(url, token, options);
  }

  if (!response.ok) {
    throw await failure(response, label);
  }

  // 204 No Content (e.g. DELETE /v1/me) has no body to read.
  const body = response.status === 204 ? undefined : await readJson(response);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      'server',
      `${label} respondeu fora do contrato: ${z.prettifyError(parsed.error)}`,
      response.status,
      'INVALID_RESPONSE',
    );
  }
  return parsed.data;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}

// A request that may work if sent again later: no network or a server failure. A 4xx, or an
// answer outside the contract, would come back the same way.
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.kind === 'network' || (error.status !== null && error.status >= 500);
}
