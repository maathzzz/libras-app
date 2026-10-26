import type { ProfileResponse } from '@libras/contracts';

import { ok, type Result } from '../../../shared/domain/Result';
import type { ProfileRepository } from '../domain/ProfileRepository';
import { ensureProfile, toProfileResponse } from './ensureProfile';

// Both come from the access token.
export interface GetProfileInput {
  userId: string;
  email: string | null;
}

export class GetProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute({ userId, email }: GetProfileInput): Promise<Result<ProfileResponse>> {
    const profile = await ensureProfile(this.profiles, userId, email);
    if (!profile.ok) return profile;

    return ok(toProfileResponse(profile.value));
  }
}
