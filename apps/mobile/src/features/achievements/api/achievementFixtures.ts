import { AchievementsResponse } from '@libras/contracts';

import { getMockAchievements, mockLatency } from '@/shared/api/mockServer';

// Development fixtures for GET /v1/achievements, used when EXPO_PUBLIC_USE_MOCKS=true.
export async function mockGetAchievements(): Promise<AchievementsResponse> {
  await mockLatency(400);
  return AchievementsResponse.parse({ achievements: getMockAchievements() });
}
