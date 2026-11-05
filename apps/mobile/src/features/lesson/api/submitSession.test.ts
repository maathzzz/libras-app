import type { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';

import { submitSession } from './submitSession';

jest.mock('@/shared/api/session', () => ({ getAccessToken: async () => 'token-1' }));

const fetchMock = jest.fn();

const session: CompleteLessonRequest = {
  lessonId: 'saudacoes-bom-dia',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  answers: [{ exerciseId: 'ex-oi', answer: { type: 'sign_to_word', optionId: 'oi' } }],
  localDate: '2026-03-14',
};
const response: CompleteLessonResponse = {
  xpEarned: 15,
  streak: { current: 1, longest: 1, status: 'done_today' },
  streakIncreased: true,
  achievementsUnlocked: [],
};

type SentInit = { method: string; headers: Record<string, string>; body: string };

function sent(): { url: string; init: SentInit } {
  const [url, init] = fetchMock.mock.calls[0] as [string, SentInit];
  return { url, init };
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => response });
  globalThis.fetch = fetchMock;
});

describe('submitSession', () => {
  it('posts the session with its Idempotency-Key and returns the official result', async () => {
    await expect(submitSession(session)).resolves.toEqual(response);

    const { url, init } = sent();
    expect(url).toBe('https://bff.test/v1/lessons/saudacoes-bom-dia/sessions');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe(session.idempotencyKey);
  });

  it('sends only the answers and the date the lesson ended in the body', async () => {
    await submitSession(session);

    expect(JSON.parse(sent().init.body)).toEqual({
      answers: session.answers,
      localDate: '2026-03-14',
    });
  });

  it('rejects a request outside the contract without sending it', async () => {
    await expect(submitSession({ ...session, answers: [] })).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
