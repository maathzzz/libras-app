import { z } from 'zod';

import { ApiError, apiRequest, isNetworkError, isRetryableError } from './client';
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
const failed = (status: number, body: unknown) => ({
  ok: false,
  status,
  json: async () => body,
});
const unreadable = (status: number) => ({
  ok: status < 400,
  status,
  json: () => Promise.reject(new SyntaxError('Unexpected token <')),
});
const errorBody = (code: string) => ({ error: { code, message: 'details for the logs' } });

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

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({ kind: 'network' });

    expect(endSessionMock).not.toHaveBeenCalled();
  });

  it('reads no body from a 204', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() });

    await expect(apiRequest('/v1/me', z.undefined(), { method: 'DELETE' })).resolves.toBe(
      undefined,
    );
  });
});

describe('contract validation', () => {
  it('turns an answer outside the contract into a handled error instead of a crash', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: 'yes' }) });

    const request = apiRequest('/v1/home', schema);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      kind: 'server',
      status: 200,
      code: 'INVALID_RESPONSE',
    });
  });

  it('treats a 200 whose body is not JSON as outside the contract', async () => {
    fetchMock.mockResolvedValue(unreadable(200));

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({
      kind: 'server',
      code: 'INVALID_RESPONSE',
    });
  });
});

describe('error classification', () => {
  it('reports a network error when fetch gets no response', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const request = apiRequest('/v1/home', schema);

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ kind: 'network', status: null, code: null });
  });

  it('gives up waiting after 15 seconds and reports a network error', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );

    const request = apiRequest('/v1/home', schema);
    const settled = request.catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(15_000);

    await expect(settled).resolves.toMatchObject({ kind: 'network' });
  });

  it('reports a server error with the code of a 5xx', async () => {
    fetchMock.mockResolvedValue(failed(500, errorBody('INTERNAL_ERROR')));

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({
      kind: 'server',
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });

  it('reports a 5xx without the BFF error format, such as a proxy page', async () => {
    fetchMock.mockResolvedValue(unreadable(502));

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({
      kind: 'server',
      status: 502,
      code: null,
    });
  });

  it('reports a request error with the code the BFF sent', async () => {
    fetchMock.mockResolvedValue(failed(403, errorBody('LESSON_LOCKED')));

    await expect(apiRequest('/v1/lessons/x', schema)).rejects.toMatchObject({
      kind: 'request',
      status: 403,
      code: 'LESSON_LOCKED',
    });
  });

  it('keeps the status of a 4xx whose body is not in the error format', async () => {
    fetchMock.mockResolvedValue(failed(422, { message: 'unexpected' }));

    await expect(apiRequest('/v1/home', schema)).rejects.toMatchObject({
      kind: 'request',
      status: 422,
      code: null,
    });
  });
});

describe('isRetryableError', () => {
  it.each([
    ['no network', new ApiError('network', 'x'), true],
    ['a 5xx', new ApiError('server', 'x', 503, null), true],
    ['a 4xx', new ApiError('request', 'x', 422, 'LOCAL_DATE_TOO_FAR_AHEAD'), false],
    ['a 2xx outside the contract', new ApiError('server', 'x', 200, 'INVALID_RESPONSE'), false],
    ['an error that is not from the API', new Error('bug'), false],
  ])('is %s retryable: %s', (_case, error, retryable) => {
    expect(isRetryableError(error)).toBe(retryable);
  });

  it('tells a network error apart', () => {
    expect(isNetworkError(new ApiError('network', 'x'))).toBe(true);
    expect(isNetworkError(new ApiError('server', 'x', 500, null))).toBe(false);
  });
});
