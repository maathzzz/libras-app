import { HomeResponse } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockGetHome } from './homeFixtures';

export function getHome(): Promise<HomeResponse> {
  if (mocksEnabled) return mockGetHome();
  return apiRequest('/v1/home', HomeResponse);
}
