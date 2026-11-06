import { ErrorResponse } from '@libras/contracts';
import type { z } from 'zod';

import { getSupabase } from './supabase';

/**
 * `network`: no answer from the BFF.
 * `server`: a 5xx, or an answer outside the contract.
 * `request`: a 4xx; `code` says why (e.g. NOT_ADMIN).
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
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

// Empty in development: Vite forwards /v1 to the local BFF.
const baseUrl = import.meta.env.VITE_API_URL ?? '';

// supabase-js renews the token when it is about to expire, so each request asks for it.
async function accessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

async function errorOf(response: Response): Promise<ApiError> {
  const kind = response.status >= 500 ? 'server' : 'request';
  const body = ErrorResponse.safeParse(await response.json().catch(() => null));
  if (!body.success) return new ApiError(kind, `HTTP ${response.status}`, response.status);
  const { code, message } = body.data.error;
  return new ApiError(kind, message, response.status, code);
}

// Every call to the BFF goes through here: it sends the operator's token and checks the
// answer against the contract, so screens only ever see valid data or an ApiError.
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  if (body !== undefined) headers['content-type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network', 'Sem resposta do servidor');
  }

  if (!response.ok) {
    // A session the BFF refuses is over: signing out takes the operator back to the login.
    if (response.status === 401) await getSupabase().auth.signOut();
    throw await errorOf(response);
  }

  const payload: unknown = response.status === 204 ? undefined : await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError('server', 'Resposta fora do contrato', response.status, 'INVALID_RESPONSE');
  }
  return parsed.data;
}
