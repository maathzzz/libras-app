import type { Profile, ProfileChanges } from '../domain/Profile';
import type { ProfileRepository } from '../domain/ProfileRepository';

// For tests. Auth users are tracked apart from profiles to mirror the foreign key to
// auth.users: create() only succeeds for a user that still exists there.
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly profilesById = new Map<string, Profile>();
  private readonly deletedAuthUsers = new Set<string>();

  get profiles(): readonly Profile[] {
    return [...this.profilesById.values()];
  }

  seed(profile: Profile): void {
    this.profilesById.set(profile.userId, profile);
  }

  // Simulates a token still valid after its Auth user was removed.
  removeAuthUser(userId: string): void {
    this.deletedAuthUsers.add(userId);
  }

  async findById(userId: string): Promise<Profile | null> {
    return this.profilesById.get(userId) ?? null;
  }

  async create(profile: Profile): Promise<Profile | null> {
    if (this.deletedAuthUsers.has(profile.userId)) return null;
    if (!this.profilesById.has(profile.userId)) this.profilesById.set(profile.userId, profile);
    return this.findById(profile.userId);
  }

  async update(userId: string, changes: ProfileChanges): Promise<Profile | null> {
    const current = this.profilesById.get(userId);
    if (!current) return null;

    const updated: Profile = {
      userId,
      name: changes.name ?? current.name,
      dailyGoal: changes.dailyGoal ?? current.dailyGoal,
      startLevel: changes.startLevel ?? current.startLevel,
    };
    this.profilesById.set(userId, updated);
    return updated;
  }

  async delete(userId: string): Promise<void> {
    this.profilesById.delete(userId);
  }
}
