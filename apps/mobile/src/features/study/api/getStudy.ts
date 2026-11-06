import { StudyGuide } from '@libras/contracts';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockGetStudy } from './studyFixtures';

// An unknown id rejects with the BFF's 404 (STUDY_NOT_FOUND).
export function getStudy(studyId: string): Promise<StudyGuide> {
  if (mocksEnabled) return mockGetStudy(studyId);
  return apiRequest(`/v1/studies/${encodeURIComponent(studyId)}`, StudyGuide);
}
