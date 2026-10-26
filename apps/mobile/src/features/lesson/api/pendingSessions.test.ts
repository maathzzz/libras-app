import type { CompleteLessonRequest } from '@libras/contracts';

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
});
