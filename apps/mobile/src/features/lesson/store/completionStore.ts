import type { CompleteLessonRequest, CompleteLessonResponse } from '@libras/contracts';
import { create } from 'zustand';

import { reloadHome } from '@/features/home';
import { markLessonDoneForReminder } from '@/features/reminder';
import { isRetryableError } from '@/shared/api/client';

import { pendingSessions } from '../api/pendingSessions';
import { submitSession } from '../api/submitSession';

// `pending`: no network or a server failure; the session is queued and will be sent later.
// `failed`: the BFF refused it; sending it again would fail the same way.
type CompletionStatus = 'idle' | 'submitting' | 'completed' | 'pending' | 'failed';

/** What the app already knows locally, shown while (or instead of) the BFF's result. */
export type LessonSummary = {
  correct: number;
  total: number;
  durationMs: number;
};

type CompletionState = {
  status: CompletionStatus;
  summary: LessonSummary | null;
  /** Official XP and streak from the BFF; null until it answers. */
  result: CompleteLessonResponse | null;
  idempotencyKey: string | null;
  submit: (request: CompleteLessonRequest, summary: LessonSummary) => Promise<void>;
  reset: () => void;
};

const initialCompletion = {
  status: 'idle',
  summary: null,
  result: null,
  idempotencyKey: null,
} satisfies Partial<CompletionState>;

export const useCompletionStore = create<CompletionState>()((set, get) => ({
  ...initialCompletion,

  submit: async (request, summary) => {
    const { idempotencyKey } = request;
    set({ status: 'submitting', summary, result: null, idempotencyKey });

    // Leaving the screen does not cancel the submission; only its result is no longer shown.
    const isCurrent = () => get().idempotencyKey === idempotencyKey;

    try {
      const result = await submitSession(request);
      if (isCurrent()) set({ status: 'completed', result });
      void markLessonDoneForReminder(request.localDate);
      // Streak and XP changed. Reloaded here, not when the learner leaves: they may leave
      // before the answer arrives.
      void reloadHome();
    } catch (error) {
      if (!isRetryableError(error)) {
        if (isCurrent()) set({ status: 'failed' });
        return;
      }
      // Queued even if the learner already left: the lesson must not be lost.
      pendingSessions.enqueue(request);
      // The lesson was done today even if the BFF only hears about it later.
      void markLessonDoneForReminder(request.localDate);
      if (isCurrent()) set({ status: 'pending' });
    }
  },

  reset: () => set(initialCompletion),
}));
