import { z } from 'zod';

import { apiRequest } from './client';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  jest.useRealTimers();
});

function sentHeaders(): Record<string, string> {
  const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
  return init.headers;
}

describe('apiRequest', () => {
  it('sends the device local date in X-Local-Date', async () => {
    // 23:30 on 2026-03-14 in São Paulo (jest.setup.ts), already the 15th in UTC.
    jest.useFakeTimers({ now: new Date('2026-03-15T02:30:00Z') });
    await apiRequest('/v1/home', z.object({ ok: z.boolean() }));

    expect(sentHeaders()['X-Local-Date']).toBe('2026-03-14');
  });

  it('takes the date at each request', async () => {
    const schema = z.object({ ok: z.boolean() });

    jest.useFakeTimers({ now: new Date(2026, 2, 14, 23, 59) });
    await apiRequest('/v1/home', schema);
    jest.setSystemTime(new Date(2026, 2, 15, 0, 1));
    await apiRequest('/v1/home', schema);

    const dates = fetchMock.mock.calls.map(
      ([, init]: [string, { headers: Record<string, string> }]) => init.headers['X-Local-Date'],
    );
    expect(dates).toEqual(['2026-03-14', '2026-03-15']);
  });
});
