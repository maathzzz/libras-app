import { z } from 'zod';

import { ApiError, apiRequest } from './client';
import { endSession, getAccessToken, refreshAccessToken } from './session';

jest.mock('./session', () => ({
  getAccessToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  endSession: jest.fn(),
}));

const fetchMock = jest.fn();
const getTokenMock = jest.mocked(getAccessToken);
const refreshMock = jest.mocked(refreshAccessToken);
const endSessionMock = jest.mocked(endSession);
const schema = z.object({ ok: z.boolean() });

type SentInit = { headers: Record<string, string> };

const ok = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
const unauthorized = () => ({ ok: false, status: 401, json: async () => ({}) });

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(ok());
  getTokenMock.mockResolvedValue('token-1');
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  jest.useRealTimers();
});

function sentHeaders(call = 0): Record<string, string> {
  const [, init] = fetchMock.mock.calls[call] as [string, SentInit];
  return init.headers;
}

describe('apiRequest', () => {
  it('sends the session token and the device local date', async () => {
    // 23:30 on 2026-03-14 in São Paulo (jest.setup.ts), already the 15th in UTC.
    jest.useFakeTimers({ now: new Date('2026-03-15T02:30:00Z') });

    await apiRequest('/v1/home', schema);

    expect(sentHeaders()).toMatchObject({
      Authorization: 'Bearer token-1',
      'X-Local-Date': '2026-03-14',
    });
  });

  it('sends no Authorization header without a session', async () => {
    getTokenMock.mockResolvedValue(null);

    await apiRequest('/v1/home', schema);

    expect(sentHeaders()).not.toHaveProperty('Authorization');
  });

  it('takes the date at each request', async () => {
    jest.useFakeTimers({ now: new Date(2026, 2, 14, 23, 59) });
    await apiRequest('/v1/home', schema);
    jest.setSystemTime(new Date(2026, 2, 15, 0, 1));
    await apiRequest('/v1/home', schema);

    expect([sentHeaders(0)['X-Local-Date'], sentHeaders(1)['X-Local-Date']]).toEqual([
      '2026-03-14',
      '2026-03-15',
    ]);
  });

  it('renews the session after a 401 and repeats the request with the new token', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    refreshMock.mockResolvedValue('token-2');

    await expect(apiRequest('/v1/home', schema)).resolves.toEqual({ ok: true });

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentHeaders(1).Authorization).toBe('Bearer token-2');
    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it('renews only once when the repeated request is refused again', async () => {
    fetchMock.mockResolvedValue(unauthorized());
    refreshMock.mockResolvedValue('token-2');

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({ status: 401 });

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ends the session when it cannot be renewed', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    refreshMock.mockResolvedValue(null);

    const request = apiRequest('/v1/home', schema);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(endSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the renewal fails for lack of network', async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    refreshMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiRequest('/v1/home', schema)).rejects.toBeInstanceOf(TypeError);

    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it('reads no body from a 204', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() });

    await expect(apiRequest('/v1/me', z.undefined(), { method: 'DELETE' })).resolves.toBe(
      undefined,
    );
  });
});
