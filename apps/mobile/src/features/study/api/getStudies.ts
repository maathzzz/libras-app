import { StudiesResponse } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockGetStudies } from './studyFixtures';

export function getStudies(): Promise<StudiesResponse> {
  if (mocksEnabled) return mockGetStudies();
  return apiRequest('/v1/studies', StudiesResponse);
}
