import type { AuthAdmin } from '../domain/AuthAdmin';

// For tests: records the deletions and can be made to fail like an unreachable Supabase Auth.
export class InMemoryAuthAdmin implements AuthAdmin {
  readonly deletedUserIds: string[] = [];
  failure: Error | null = null;

  async deleteUser(userId: string): Promise<void> {
    if (this.failure) throw this.failure;
    this.deletedUserIds.push(userId);
  }
}
