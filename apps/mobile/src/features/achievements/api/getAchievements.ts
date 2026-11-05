import { AchievementsResponse } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockGetAchievements } from './achievementFixtures';

export function getAchievements(): Promise<AchievementsResponse> {
  if (mocksEnabled) return mockGetAchievements();
  return apiRequest('/v1/achievements', AchievementsResponse);
}
