import type { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import type { ProfileRepository } from '../domain/ProfileRepository';
import { accountNotFound, ensureProfile, toProfileResponse } from './ensureProfile';

// userId and email come from the access token, never from the request body.
export interface UpdateProfileInput {
  userId: string;
  email: string | null;
  changes: UpdateProfileRequest;
}

export class UpdateProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute({ userId, email, changes }: UpdateProfileInput): Promise<Result<ProfileResponse>> {
    const existing = await ensureProfile(this.profiles, userId, email);
    if (!existing.ok) return existing;

    // Null only if the account was deleted between the two calls.
    const updated = await this.profiles.update(userId, changes);
    if (!updated) return err(accountNotFound(userId));

    return ok(toProfileResponse(updated));
  }
}
