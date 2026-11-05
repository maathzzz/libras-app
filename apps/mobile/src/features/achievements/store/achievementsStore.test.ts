import type { AchievementsResponse } from '@libras/contracts';

import { ApiError } from '@/shared/api/client';

import { getAchievements } from '../api/getAchievements';
import { useAchievementsStore } from './achievementsStore';

jest.mock('../api/getAchievements');

const getAchievementsMock = jest.mocked(getAchievements);
const initialState = useAchievementsStore.getState();

const response: AchievementsResponse = {
  achievements: [
    {
      id: 'first-lesson',
      title: 'Primeiro sinal',
      description: 'Conclua sua primeira lição.',
      category: 'lessons',
      progress: { current: 1, target: 1 },
      unlockedAt: '2026-03-15T15:00:00.000Z',
    },
  ],
};

beforeEach(() => {
  useAchievementsStore.setState(initialState, true);
  getAchievementsMock.mockReset();
});

describe('achievementsStore', () => {
  it('keeps the loaded achievements', async () => {
    getAchievementsMock.mockResolvedValue(response);

    await useAchievementsStore.getState().load();

    expect(useAchievementsStore.getState()).toMatchObject({
      achievements: response.achievements,
      failed: false,
    });
  });

  it('marks a failed first load', async () => {
    getAchievementsMock.mockRejectedValue(new ApiError('network', 'offline'));

    await useAchievementsStore.getState().load();

    expect(useAchievementsStore.getState()).toMatchObject({ achievements: null, failed: true });
  });

  it('keeps the last list when a reload fails', async () => {
    getAchievementsMock.mockResolvedValueOnce(response);
    await useAchievementsStore.getState().load();

    getAchievementsMock.mockRejectedValueOnce(new ApiError('server', 'boom', 500));
    await useAchievementsStore.getState().load();

    expect(useAchievementsStore.getState()).toMatchObject({
      achievements: response.achievements,
      failed: false,
    });
  });

  it('forgets everything on clear', async () => {
    getAchievementsMock.mockResolvedValue(response);
    await useAchievementsStore.getState().load();

    useAchievementsStore.getState().clear();

    expect(useAchievementsStore.getState()).toMatchObject({ achievements: null, failed: false });
  });
});
