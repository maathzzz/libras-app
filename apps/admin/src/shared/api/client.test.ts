import { AdminMeResponse } from '@libras/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest } from './client';

const signOut = vi.fn();

vi.mock('./supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'token-1' } } }),
      signOut,
    },
  }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  signOut.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body });

describe('apiRequest', () => {
  it('sends the operator token and returns the answer checked against the contract', async () => {
    reply(200, { name: 'Ana', email: 'ana@example.com' });

    await expect(apiRequest('/v1/admin/me', AdminMeResponse)).resolves.toEqual({
      name: 'Ana',
      email: 'ana@example.com',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/v1/admin/me');
    expect(init.headers).toEqual({ Authorization: 'Bearer token-1' });
  });

  it('sends a JSON body', async () => {
    reply(200, { name: 'Ana', email: 'ana@example.com' });

    await apiRequest('/v1/admin/me', AdminMeResponse, { method: 'PATCH', body: { name: 'Ana' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe('{"name":"Ana"}');
    expect(init.headers).toMatchObject({ 'content-type': 'application/json' });
  });

  it('turns a 403 into a request error with the BFF code', async () => {
    reply(403, { error: { code: 'NOT_ADMIN', message: 'Not an operator' } });

    await expect(apiRequest('/v1/admin/me', AdminMeResponse)).rejects.toEqual(
      expect.objectContaining({ kind: 'request', status: 403, code: 'NOT_ADMIN' }),
    );
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs out when the BFF refuses the session', async () => {
    reply(401, { error: { code: 'UNAUTHORIZED', message: 'Invalid access token' } });

    await expect(apiRequest('/v1/admin/me', AdminMeResponse)).rejects.toBeInstanceOf(ApiError);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('rejects an answer outside the contract as a server error', async () => {
    reply(200, { name: 'Ana' });

    await expect(apiRequest('/v1/admin/me', AdminMeResponse)).rejects.toEqual(
      expect.objectContaining({ kind: 'server', code: 'INVALID_RESPONSE' }),
    );
  });

  it('reports a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/v1/admin/me', AdminMeResponse)).rejects.toEqual(
      expect.objectContaining({ kind: 'network' }),
    );
  });
});
