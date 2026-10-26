import type { ProfileResponse } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { defaultProfileFor, type Profile } from '../domain/Profile';
import type { ProfileRepository } from '../domain/ProfileRepository';

export const accountNotFound = (userId: string) =>
  new DomainError('ACCOUNT_NOT_FOUND', `Account ${userId} not found`);

// Shared by GetProfile and UpdateProfile: the onboarding updates the profile before anything
// reads it, so either one may be the first access.
export async function ensureProfile(
  profiles: ProfileRepository,
  userId: string,
  email: string | null,
): Promise<Result<Profile>> {
  const existing = await profiles.findById(userId);
  if (existing) return ok(existing);

  const created = await profiles.create(defaultProfileFor(userId, email));
  return created ? ok(created) : err(accountNotFound(userId));
}

export function toProfileResponse({ name, dailyGoal, startLevel }: Profile): ProfileResponse {
  return { name, dailyGoal, startLevel };
}
