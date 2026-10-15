import { StudiesResponse } from '@libras/contracts';

import { mockStudies } from './studyMocks';

// Long enough for the loading state to be visible on the device.
const mockLatencyMs = 600;

// Mocked until the BFF exposes GET /v1/studies. Then only this function changes, to
// `apiRequest('/v1/studies', StudiesResponse)`; meanwhile the mock goes through the same schema.
export async function getStudies(): Promise<StudiesResponse> {
  await new Promise((resolve) => setTimeout(resolve, mockLatencyMs));
  return StudiesResponse.parse(mockStudies());
}
