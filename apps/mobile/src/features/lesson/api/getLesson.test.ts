import { mockLesson } from './lessonFixtures';
import { getLesson } from './getLesson';

jest.mock('@/shared/api/session', () => ({ getAccessToken: async () => 'token-1' }));

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

describe('getLesson', () => {
  it('reads GET /v1/lessons/:lessonId from the BFF', async () => {
    const lesson = mockLesson('saudacoes-bom-dia');
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => lesson });

    await expect(getLesson('saudacoes-bom-dia')).resolves.toEqual(lesson);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://bff.test/v1/lessons/saudacoes-bom-dia');
    expect(init.method).toBe('GET');
  });
});
