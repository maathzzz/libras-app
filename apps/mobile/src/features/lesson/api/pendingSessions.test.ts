import type { CompleteLessonRequest } from '@libras/contracts';

import { ApiError } from '@/shared/api/client';
import { storage } from '@/shared/lib/storage';

import { pendingSessions } from './pendingSessions';
import { submitSession } from './submitSession';

jest.mock('./submitSession', () => ({ submitSession: jest.fn() }));

const submitMock = jest.mocked(submitSession);

const session: CompleteLessonRequest = {
  lessonId: 'saudacoes-bom-dia',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  answers: [{ exerciseId: 'ex-oi', answer: { type: 'sign_to_word', optionId: 'oi' } }],
  localDate: '2026-03-14',
};
const nextSession: CompleteLessonRequest = {
  ...session,
  idempotencyKey: '00000000-0000-4000-8000-000000000002',
};

const refused = (status: number, code: string) => new ApiError('request', 'recusada', status, code);

beforeEach(() => {
  storage.clearAll();
  submitMock.mockReset().mockResolvedValue({
    xpEarned: 15,
    streak: { current: 1, longest: 1, status: 'done_today' },
    streakIncreased: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('pendingSessions', () => {
  it('sends a retried session with the date the lesson ended, not the current one', async () => {
    pendingSessions.enqueue(session);
    // The connection only comes back two days later.
    jest.useFakeTimers({ now: new Date(2026, 2, 16, 9, 0) });

    await pendingSessions.flush();

    expect(submitMock).toHaveBeenCalledWith(session);
    expect(submitMock.mock.calls[0]?.[0].localDate).toBe('2026-03-14');
  });

  it('keeps the date in MMKV, so it survives an app restart', () => {
    pendingSessions.enqueue(session);

    expect(JSON.parse(storage.getString('lesson.pendingSessions') ?? '[]')).toEqual([session]);
  });

  it.each([
    ['there is no network', new ApiError('network', 'Sem resposta')],
    ['the server fails', new ApiError('server', 'falhou', 500, 'INTERNAL_ERROR')],
  ])('keeps the sessions to send later when %s', async (_case, error) => {
    pendingSessions.enqueue(session);
    pendingSessions.enqueue(nextSession);
    submitMock.mockRejectedValueOnce(error);

    await expect(pendingSessions.flush()).resolves.toEqual({ sent: 0 });

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(pendingSessions.pending()).toEqual([session, nextSession]);
  });

  it.each([
    ['a date past the limit', refused(422, 'LOCAL_DATE_TOO_FAR_AHEAD')],
    ['a locked lesson', refused(403, 'LESSON_LOCKED')],
    ['an unknown lesson', refused(404, 'LESSON_NOT_FOUND')],
  ])('drops a session refused for %s and goes on with the next one', async (_case, error) => {
    pendingSessions.enqueue(session);
    pendingSessions.enqueue(nextSession);
    submitMock.mockRejectedValueOnce(error);

    await expect(pendingSessions.flush()).resolves.toEqual({ sent: 1 });

    expect(submitMock).toHaveBeenCalledTimes(2);
    expect(pendingSessions.pending()).toEqual([]);
  });

  it('drops a session whose answer was outside the contract, since it would never change', async () => {
    pendingSessions.enqueue(session);
    submitMock.mockRejectedValueOnce(new ApiError('server', 'inválida', 200, 'INVALID_RESPONSE'));

    await pendingSessions.flush();

    expect(pendingSessions.pending()).toEqual([]);
  });

  it('removes a session the BFF had already processed when it answers 200 again', async () => {
    // The first attempt reached the BFF but its answer was lost; the retry gets the original
    // result back, thanks to the Idempotency-Key.
    pendingSessions.enqueue(session);

    await expect(pendingSessions.flush()).resolves.toEqual({ sent: 1 });

    expect(submitMock).toHaveBeenCalledWith(session);
    expect(pendingSessions.pending()).toEqual([]);
  });
});
