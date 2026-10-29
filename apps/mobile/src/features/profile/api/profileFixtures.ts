import { ProfileResponse, type UpdateProfileRequest } from '@libras/contracts';

import {
  getMockProfile,
  mockLatency,
  resetMockServer,
  updateMockProfile,
} from '@/shared/api/mockServer';

// Development fixtures for /v1/me, used when EXPO_PUBLIC_USE_MOCKS=true.
const profileLatencyMs = 400;

export async function mockGetProfile(): Promise<ProfileResponse> {
  await mockLatency(profileLatencyMs);
  return ProfileResponse.parse(getMockProfile());
}

export async function mockUpdateProfile(update: UpdateProfileRequest): Promise<ProfileResponse> {
  await mockLatency(profileLatencyMs);
  return ProfileResponse.parse(updateMockProfile(update));
}

// The BFF deletes the data and the Supabase Auth user; the mock only forgets its own data.
export async function mockDeleteAccount(): Promise<void> {
  await mockLatency(profileLatencyMs);
  resetMockServer();
}
