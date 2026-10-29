import { mockHome } from './homeFixtures';
import { getHome } from './getHome';

jest.mock('@/shared/api/session', () => ({ getAccessToken: async () => 'token-1' }));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

describe('getHome', () => {
  it('reads GET /v1/home from the BFF', async () => {
    const home = mockHome();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => home });

    await expect(getHome()).resolves.toEqual(home);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://bff.test/v1/home');
    expect(init.method).toBe('GET');
  });
});
