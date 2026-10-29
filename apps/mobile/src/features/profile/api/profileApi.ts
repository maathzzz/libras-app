import { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';
import { z } from 'zod';

import { apiRequest } from '@/shared/api/client';
import { mocksEnabled } from '@/shared/api/mockServer';

import { mockDeleteAccount, mockGetProfile, mockUpdateProfile } from './profileFixtures';

export function getProfile(): Promise<ProfileResponse> {
  if (mocksEnabled) return mockGetProfile();
  return apiRequest('/v1/me', ProfileResponse);
}

export async function updateProfile(update: UpdateProfileRequest): Promise<ProfileResponse> {
  const body = UpdateProfileRequest.parse(update);
  if (mocksEnabled) return mockUpdateProfile(body);
  return apiRequest('/v1/me', ProfileResponse, { method: 'PATCH', body });
}

// The BFF deletes the learner's data and the Supabase Auth user, then answers 204.
export async function deleteAccount(): Promise<void> {
  if (mocksEnabled) return mockDeleteAccount();
  await apiRequest('/v1/me', z.undefined(), { method: 'DELETE' });
}
