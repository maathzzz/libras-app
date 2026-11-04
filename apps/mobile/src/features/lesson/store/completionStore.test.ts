import type { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';

import { reloadHome } from '@/features/home';
import { markLessonDoneForReminder } from '@/features/reminder';
import { ApiError } from '@/shared/api/client';

import { pendingSessions } from '../api/pendingSessions';
import { submitSession } from '../api/submitSession';
import { useCompletionStore } from './completionStore';

jest.mock('@/features/home', () => ({ reloadHome: jest.fn() }));
jest.mock('@/features/reminder', () => ({ markLessonDoneForReminder: jest.fn() }));
jest.mock('../api/submitSession');
jest.mock('../api/pendingSessions', () => ({ pendingSessions: { enqueue: jest.fn() } }));

const submitMock = jest.mocked(submitSession);
const enqueueMock = jest.mocked(pendingSessions.enqueue);
const reloadHomeMock = jest.mocked(reloadHome);
const markLessonDoneMock = jest.mocked(markLessonDoneForReminder);
const networkError = () => new ApiError('network', 'Sem resposta');
const initialState = useCompletionStore.getState();

const request: CompleteLessonRequest = {
  lessonId: 'saudacoes-bom-dia',
  idempotencyKey: '00000000-0000-4000-8000-000000000001',
  answers: [{ exerciseId: 'ex-oi', answer: { type: 'sign_to_word', optionId: 'oi' } }],
  localDate: '2026-03-14',
};
const summary = { correct: 5, total: 6, durationMs: 134_000 };
const response: CompleteLessonResponse = {
  xpEarned: 50,
  streak: { current: 8, longest: 12, status: 'done_today' },
  streakIncreased: true,
};

beforeEach(() => {
  useCompletionStore.setState(initialState, true);
  submitMock.mockReset();
  enqueueMock.mockReset();
  reloadHomeMock.mockReset().mockResolvedValue(undefined);
  markLessonDoneMock.mockReset();
});

describe('useCompletionStore', () => {
  it('shows the local summary while submitting, then the BFF result', async () => {
    submitMock.mockResolvedValue(response);

    const submitting = useCompletionStore.getState().submit(request, summary);
    expect(useCompletionStore.getState()).toMatchObject({ status: 'submitting', summary });
    await submitting;

    expect(submitMock).toHaveBeenCalledWith(request);
    expect(useCompletionStore.getState()).toMatchObject({ status: 'completed', result: response });
    expect(enqueueMock).not.toHaveBeenCalled();
    expect(markLessonDoneMock).toHaveBeenCalledWith('2026-03-14');
  });

  it('reloads the home once the BFF answers, even after the learner left', async () => {
    let answer = (_value: CompleteLessonResponse) => {};
    submitMock.mockReturnValue(new Promise((resolve) => (answer = resolve)));

    const submitting = useCompletionStore.getState().submit(request, summary);
    useCompletionStore.getState().reset();
    expect(reloadHomeMock).not.toHaveBeenCalled();
    answer(response);
    await submitting;

    expect(reloadHomeMock).toHaveBeenCalledTimes(1);
  });

  it('queues the session when there is no network', async () => {
    submitMock.mockRejectedValue(networkError());

    await useCompletionStore.getState().submit(request, summary);

    expect(enqueueMock).toHaveBeenCalledWith(request);
    expect(useCompletionStore.getState()).toMatchObject({ status: 'pending', result: null });
    expect(reloadHomeMock).not.toHaveBeenCalled();
    // The lesson was done today: today's reminder is cancelled before the BFF hears of it.
    expect(markLessonDoneMock).toHaveBeenCalledWith('2026-03-14');
  });

  it('queues the session when the server fails', async () => {
    submitMock.mockRejectedValue(new ApiError('server', 'falhou', 503, 'INTERNAL_ERROR'));

    await useCompletionStore.getState().submit(request, summary);

    expect(enqueueMock).toHaveBeenCalledWith(request);
    expect(useCompletionStore.getState().status).toBe('pending');
  });

  it('does not queue a session the BFF refused', async () => {
    submitMock.mockRejectedValue(
      new ApiError('request', 'recusada', 422, 'LOCAL_DATE_TOO_FAR_AHEAD'),
    );

    await useCompletionStore.getState().submit(request, summary);

    expect(enqueueMock).not.toHaveBeenCalled();
    expect(useCompletionStore.getState().status).toBe('failed');
    expect(reloadHomeMock).not.toHaveBeenCalled();
    expect(markLessonDoneMock).not.toHaveBeenCalled();
  });

  it('still queues a failed session after the learner left the screen', async () => {
    let fail = (_error: unknown) => {};
    submitMock.mockReturnValue(new Promise((_, reject) => (fail = reject)));

    const submitting = useCompletionStore.getState().submit(request, summary);
    useCompletionStore.getState().reset();
    fail(networkError());
    await submitting;

    expect(enqueueMock).toHaveBeenCalledWith(request);
    expect(useCompletionStore.getState().status).toBe('idle');
  });
});
