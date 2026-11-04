import type { CompleteLessonResponse } from '@libras/contracts';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useEffect as mockUseEffect } from 'react';

import { haptics } from '@/shared/lib/haptics';

import { useCompletionStore } from '../store/completionStore';
import { LessonCompleteScreen } from './LessonCompleteScreen';

jest.mock('expo-router', () => ({
  router: { dismissTo: jest.fn() },
  // The screen is always focused in these tests.
  useFocusEffect: (effect: () => void | (() => void)) => mockUseEffect(effect, [effect]),
}));
jest.mock('@/shared/lib/haptics', () => ({ haptics: { correct: jest.fn() } }));
// The reminder is tested in its own feature; here it would load the native notifications module.
jest.mock('@/features/reminder', () => ({
  ReminderOffer: () => null,
  markLessonDoneForReminder: jest.fn(),
}));

const initialState = useCompletionStore.getState();
const summary = { correct: 5, total: 6, durationMs: 134_000 };

function result(streakIncreased: boolean): CompleteLessonResponse {
  return {
    xpEarned: 50,
    streak: { current: 8, longest: 12, status: 'done_today' },
    streakIncreased,
  };
}

function renderWith(state: Partial<ReturnType<typeof useCompletionStore.getState>>) {
  useCompletionStore.setState({ ...initialState, ...state }, true);
  return render(<LessonCompleteScreen />);
}

beforeEach(() => {
  jest.mocked(router.dismissTo).mockReset();
  jest.mocked(haptics.correct).mockReset();
});

describe('LessonCompleteScreen', () => {
  it('shows the XP, the correct answers, the time and the grown streak', async () => {
    await renderWith({ status: 'completed', summary, result: result(true) });

    expect(screen.getByText('+50')).toBeOnTheScreen();
    expect(screen.getByText('5/6')).toBeOnTheScreen();
    expect(screen.getByText('2:14')).toBeOnTheScreen();
    expect(screen.getByText('Sequência de 8 dias')).toBeOnTheScreen();
    expect(screen.getByText('+1 hoje')).toBeOnTheScreen();
    expect(haptics.correct).toHaveBeenCalledTimes(1);
  });

  it('does not highlight a streak that stayed the same', async () => {
    await renderWith({ status: 'completed', summary, result: result(false) });

    expect(screen.queryByText('+1 hoje')).toBeNull();
    expect(screen.getByText('A lição de hoje já contou para a sequência.')).toBeOnTheScreen();
    expect(haptics.correct).not.toHaveBeenCalled();
  });

  it('shows the local summary while the lesson is being saved', async () => {
    await renderWith({ status: 'submitting', summary });

    expect(screen.getByText('Salvando sua lição…')).toBeOnTheScreen();
    expect(screen.getByText('5/6')).toBeOnTheScreen();
    expect(screen.queryByText('Sequência de 8 dias')).toBeNull();
  });

  it('tells the learner a lesson that could not be sent will be sent later', async () => {
    await renderWith({ status: 'pending', summary });

    expect(screen.getByText('Lição guardada')).toBeOnTheScreen();
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it('goes back to the home and clears the completion', async () => {
    await renderWith({ status: 'completed', summary, result: result(true) });

    await fireEvent.press(screen.getByRole('button', { name: 'Voltar à trilha' }));

    expect(router.dismissTo).toHaveBeenCalledWith('/');
    expect(useCompletionStore.getState().status).toBe('idle');
  });
});
