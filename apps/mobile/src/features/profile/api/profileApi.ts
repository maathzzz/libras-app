import { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';

import { getMockProfile, resetMockServer, updateMockProfile } from '@/shared/api/mockServer';

const mockLatencyMs = 400;
const wait = () => new Promise((resolve) => setTimeout(resolve, mockLatencyMs));

// Mocked until the app is wired to the BFF. Then they become
// `apiRequest('/v1/me', ProfileResponse)`,
// `apiRequest('/v1/me', ProfileResponse, { method: 'PATCH', body: update })` and
// `apiRequest('/v1/me', z.undefined(), { method: 'DELETE' })`.
export async function getProfile(): Promise<ProfileResponse> {
  await wait();
  return ProfileResponse.parse(getMockProfile());
}

export async function updateProfile(update: UpdateProfileRequest): Promise<ProfileResponse> {
  const request = UpdateProfileRequest.parse(update);
  await wait();
  return ProfileResponse.parse(updateMockProfile(request));
}

// The BFF deletes the data and the Supabase Auth user; the mock only forgets its own data.
export async function deleteAccount(): Promise<void> {
  await wait();
  resetMockServer();
}
