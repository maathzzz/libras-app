import type { Profile, ProfileChanges } from './Profile';

export interface ProfileRepository {
  findById(userId: string): Promise<Profile | null>;
  // Keeps a profile that already exists (two first accesses at once) and returns the stored
  // one. Null when the Auth user no longer exists, as with a token of a deleted account.
  create(profile: Profile): Promise<Profile | null>;
  // Null when there is no profile to update.
  update(userId: string, changes: ProfileChanges): Promise<Profile | null>;
  // Removes the profile and all of the learner's progress. A missing profile is not an error.
  delete(userId: string): Promise<void>;
}
