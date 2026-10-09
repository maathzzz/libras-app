import * as Crypto from 'expo-crypto';

import { prefetchImages } from '@/shared/lib/prefetchImages';

import { getLesson } from '../api/getLesson';
import { mockLesson } from '../api/lessonMocks';
import { useCompletionStore } from './completionStore';
import { useLessonStore } from './lessonStore';

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/shared/lib/prefetchImages', () => ({ prefetchImages: jest.fn() }));
jest.mock('../api/getLesson');

const getLessonMock = jest.mocked(getLesson);
const prefetchMock = jest.mocked(prefetchImages);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);
const initialState = useLessonStore.getState();
const completionSubmitMock = jest.fn();
const lesson = mockLesson('saudacoes-bom-dia');

function correctAnswerFor(index: number) {
  const exercise = lesson.exercises[index];
  if (!exercise) throw new Error(`no exercise at ${index}`);
  return { type: exercise.type, optionId: exercise.correctOptionId };
}

async function startPlaying() {
  await useLessonStore.getState().start(lesson.id);
  expect(useLessonStore.getState().status).toBe('playing');
}

let uuidCount = 0;
// The idempotency key must be a UUID to pass the CompleteLessonRequest contract.
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

beforeEach(() => {
  useLessonStore.setState(initialState, true);
  useCompletionStore.setState({ submit: completionSubmitMock });
  completionSubmitMock.mockReset();
  getLessonMock.mockReset().mockResolvedValue(lesson);
  prefetchMock.mockReset().mockResolvedValue(undefined);
  randomUUIDMock.mockImplementation(() => uuid((uuidCount += 1)));
});

describe('start', () => {
  it('loads, prefetches every image of the lesson and then plays', async () => {
    const starting = useLessonStore.getState().start(lesson.id);
    expect(useLessonStore.getState().status).toBe('loading');
    await starting;

    const urls = prefetchMock.mock.calls[0]?.[0] ?? [];
    expect(urls).toContain('https://placeholder.invalid/signs/bom-dia-2.png');
    expect(useLessonStore.getState()).toMatchObject({ status: 'playing', lesson, currentIndex: 0 });
  });

  it('is preparing while the images are prefetched', async () => {
    let finishPrefetch = () => {};
    prefetchMock.mockReturnValue(new Promise<void>((resolve) => (finishPrefetch = resolve)));

    const starting = useLessonStore.getState().start(lesson.id);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useLessonStore.getState().status).toBe('preparing');
    finishPrefetch();
    await starting;

    expect(useLessonStore.getState().status).toBe('playing');
  });

  it('generates a new idempotency key for each lesson session', async () => {
    await startPlaying();
    const firstKey = useLessonStore.getState().idempotencyKey;
    await startPlaying();

    expect(firstKey).toBeTruthy();
    expect(useLessonStore.getState().idempotencyKey).not.toBe(firstKey);
  });

  it('shows an error when the lesson cannot be loaded', async () => {
    getLessonMock.mockRejectedValue(new Error('offline'));

    await useLessonStore.getState().start(lesson.id);

    expect(useLessonStore.getState()).toMatchObject({ status: 'error', lesson: null });
  });

  it('ignores a session that was reset before it finished loading', async () => {
    const starting = useLessonStore.getState().start(lesson.id);
    useLessonStore.getState().reset();
    await starting;

    expect(useLessonStore.getState()).toMatchObject({ status: 'idle', lesson: null });
  });
});

describe('answering', () => {
  it('counts a correct answer and records it', async () => {
    await startPlaying();
    const answer = correctAnswerFor(0);

    useLessonStore.getState().select(answer);
    expect(useLessonStore.getState().check()).toBe('correct');

    expect(useLessonStore.getState()).toMatchObject({
      verdict: 'correct',
      correctCount: 1,
      answers: { [lesson.exercises[0]?.id ?? '']: answer },
    });
  });

  it('does not count a wrong answer', async () => {
    await startPlaying();

    useLessonStore.getState().select({ type: 'word_to_sign', optionId: 'tchau' });

    expect(useLessonStore.getState().check()).toBe('wrong');
    expect(useLessonStore.getState().correctCount).toBe(0);
  });

  it('does not check without a selection', async () => {
    await startPlaying();

    expect(useLessonStore.getState().check()).toBeNull();
  });

  it('keeps the checked answer when the learner taps another option', async () => {
    await startPlaying();
    const answer = correctAnswerFor(0);
    useLessonStore.getState().select(answer);
    useLessonStore.getState().check();

    useLessonStore.getState().select({ type: 'word_to_sign', optionId: 'tchau' });

    expect(useLessonStore.getState().selection).toEqual(answer);
    expect(useLessonStore.getState().check()).toBeNull();
  });
});

describe('advance', () => {
  it('moves to the next exercise with a clean slate', async () => {
    await startPlaying();
    useLessonStore.getState().select(correctAnswerFor(0));
    useLessonStore.getState().check();

    expect(useLessonStore.getState().advance()).toBe('next');
    expect(useLessonStore.getState()).toMatchObject({
      currentIndex: 1,
      selection: null,
      verdict: null,
    });
  });

  it('finishes after the last exercise', async () => {
    await startPlaying();

    lesson.exercises.forEach((_, index) => {
      useLessonStore.getState().select(correctAnswerFor(index));
      useLessonStore.getState().check();
      const step = useLessonStore.getState().advance();
      expect(step).toBe(index === lesson.exercises.length - 1 ? 'finished' : 'next');
    });

    expect(useLessonStore.getState()).toMatchObject({
      status: 'finished',
      correctCount: lesson.exercises.length,
    });
  });
});

describe('submit', () => {
  function answerAll(wrongIndexes: number[] = []) {
    lesson.exercises.forEach((exercise, index) => {
      const answer = wrongIndexes.includes(index)
        ? { type: exercise.type, optionId: 'wrong-option' }
        : correctAnswerFor(index);
      useLessonStore.getState().select(answer);
      useLessonStore.getState().check();
      useLessonStore.getState().advance();
    });
  }

  it('hands the session to the completion with the answers in exercise order', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await startPlaying();
    answerAll([1]);
    now.mockReturnValue(1_000_000 + 134_000);

    useLessonStore.getState().submit();

    const { idempotencyKey } = useLessonStore.getState();
    expect(completionSubmitMock).toHaveBeenCalledWith(
      {
        lessonId: lesson.id,
        idempotencyKey,
        answers: lesson.exercises.map((exercise, index) => ({
          exerciseId: exercise.id,
          answer: index === 1 ? { type: exercise.type, optionId: 'wrong-option' } : correctAnswerFor(index),
        })),
      },
      { correct: lesson.exercises.length - 1, total: lesson.exercises.length, durationMs: 134_000 },
    );
    now.mockRestore();
  });

  it('sends nothing without a lesson', () => {
    useLessonStore.getState().submit();

    expect(completionSubmitMock).not.toHaveBeenCalled();
  });
});
