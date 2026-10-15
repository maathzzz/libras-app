import { StudyGuide } from '@libras/contracts';

import { mockStudy } from './studyMocks';

// Long enough for the loading state to be visible on the device.
const mockLatencyMs = 600;

// Mocked until the BFF exposes GET /v1/studies/:studyId. Then only this function changes, to
// `apiRequest(`/v1/studies/${studyId}`, StudyGuide)`; meanwhile the mock goes through the same
// schema. An unknown id rejects, like the BFF's 404 will.
export async function getStudy(studyId: string): Promise<StudyGuide> {
  await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
  const guide = mockStudy(studyId);
  if (!guide) throw new Error(`Study not found: ${studyId}`);
  return StudyGuide.parse(guide);
}
