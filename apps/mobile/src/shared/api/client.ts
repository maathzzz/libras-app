import type { z } from 'zod';

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

// Responses are parsed with the schemas from @libras/contracts so the app never trusts the wire format.
export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  { method = 'GET', body, headers = {} }: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Falha na requisição ${method} ${path}`);
  }

  return schema.parse(await response.json());
}

// A request that may work if sent again later: no network (fetch rejects with a TypeError)
// or a server failure. A 4xx will fail the same way again.
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500;
  return error instanceof TypeError;
}
