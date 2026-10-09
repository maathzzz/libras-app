import type { CompleteLessonRequest, ExerciseAnswer, LessonBundle } from '@libras/contracts';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { prefetchImages } from '@/shared/lib/prefetchImages';

import { getLesson } from '../api/getLesson';
import { gradeAnswer } from '../exercises/grading';
import { exerciseImages } from '../exercises/signImages';
import { useCompletionStore } from './completionStore';

type LessonStatus = 'idle' | 'loading' | 'preparing' | 'playing' | 'finished' | 'error';

export type Verdict = 'correct' | 'wrong';

// Past this, the lesson starts anyway; images still missing load (or fail) when shown.
const prefetchTimeoutMs = 5000;

type LessonSession = {
  status: LessonStatus;
  lesson: LessonBundle | null;
  currentIndex: number;
  /** Choice for the current exercise; null until the learner picks something. */
  selection: ExerciseAnswer | null;
  /** Local grading of the current exercise; null until it is checked. */
  verdict: Verdict | null;
  /** Checked answers, by exercise id. */
  answers: Record<string, ExerciseAnswer>;
  correctCount: number;
  /** Sent with the session so a retried submission is processed only once by the BFF. */
  idempotencyKey: string | null;
  /** When the first exercise was shown, in ms; the completion screen shows the time spent. */
  startedAt: number | null;
};

type LessonState = LessonSession & {
  start: (lessonId: string) => Promise<void>;
  select: (answer: ExerciseAnswer) => void;
  check: () => Verdict | null;
  advance: () => 'next' | 'finished';
  submit: () => void;
  reset: () => void;
};

const initialSession: LessonSession = {
  status: 'idle',
  lesson: null,
  currentIndex: 0,
  selection: null,
  verdict: null,
  answers: {},
  correctCount: 0,
  idempotencyKey: null,
  startedAt: null,
};

export const useLessonStore = create<LessonState>()((set, get) => ({
  ...initialSession,

  start: async (lessonId) => {
    const idempotencyKey = Crypto.randomUUID();
    set({ ...initialSession, status: 'loading', idempotencyKey });

    // A later start (or a reset) replaces this session; its late results are dropped.
    const isCurrent = () => get().idempotencyKey === idempotencyKey;

    let lesson: LessonBundle;
    try {
      lesson = await getLesson(lessonId);
    } catch {
      if (isCurrent()) set({ status: 'error' });
      return;
    }
    if (!isCurrent()) return;

    set({ status: 'preparing', lesson });
    const urls = lesson.exercises.flatMap(exerciseImages).map((image) => image.url);
    await prefetchImages(urls, prefetchTimeoutMs);
    if (isCurrent()) set({ status: 'playing', startedAt: Date.now() });
  },

  select: (answer) => {
    if (get().verdict) return;
    set({ selection: answer });
  },

  check: () => {
    const { lesson, currentIndex, selection, verdict, answers, correctCount } = get();
    const exercise = lesson?.exercises[currentIndex];
    if (!exercise || !selection || verdict) return null;

    const correct = gradeAnswer(exercise, selection);
    set({
      verdict: correct ? 'correct' : 'wrong',
      answers: { ...answers, [exercise.id]: selection },
      correctCount: correct ? correctCount + 1 : correctCount,
    });
    return correct ? 'correct' : 'wrong';
  },

  advance: () => {
    const { lesson, currentIndex } = get();
    if (!lesson || currentIndex >= lesson.exercises.length - 1) {
      // The last verdict stays on screen while the app moves to the completion screen.
      set({ status: 'finished' });
      return 'finished';
    }

    set({ currentIndex: currentIndex + 1, selection: null, verdict: null });
    return 'next';
  },

  // Reads the session synchronously: the lesson screen resets it right after, when the
  // app moves to the completion screen, which follows the submission there.
  submit: () => {
    const { lesson, idempotencyKey, answers, correctCount, startedAt } = get();
    if (!lesson || !idempotencyKey) return;

    const request: CompleteLessonRequest = {
      lessonId: lesson.id,
      idempotencyKey,
      answers: lesson.exercises.flatMap((exercise) => {
        const answer = answers[exercise.id];
        return answer ? [{ exerciseId: exercise.id, answer }] : [];
      }),
    };
    const summary = {
      correct: correctCount,
      total: lesson.exercises.length,
      durationMs: startedAt === null ? 0 : Date.now() - startedAt,
    };
    void useCompletionStore.getState().submit(request, summary);
  },

  reset: () => set(initialSession),
}));
