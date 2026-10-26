import { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';

import { getMockProfile, updateMockProfile } from '@/shared/api/mockServer';

const mockLatencyMs = 400;
const wait = () => new Promise((resolve) => setTimeout(resolve, mockLatencyMs));

// Mocked until the BFF exposes the profile routes. Then they become
// `apiRequest('/v1/me', ProfileResponse)` and
// `apiRequest('/v1/me', ProfileResponse, { method: 'PATCH', body: update })`.
export async function getProfile(): Promise<ProfileResponse> {
  await wait();
  return ProfileResponse.parse(getMockProfile());
}

export async function updateProfile(update: UpdateProfileRequest): Promise<ProfileResponse> {
  const request = UpdateProfileRequest.parse(update);
  await wait();
  return ProfileResponse.parse(updateMockProfile(request));
}
