import type { AuthAdmin } from '../domain/AuthAdmin';
import type { ProfileRepository } from '../domain/ProfileRepository';

export interface DeleteAccountInput {
  userId: string;
}

export class DeleteAccount {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly authAdmin: AuthAdmin,
  ) {}

  // Both steps are idempotent. The learner's data goes first: if Supabase Auth fails, the
  // request answers 500 and the app can repeat it while the token is still valid.
  async execute({ userId }: DeleteAccountInput): Promise<void> {
    await this.profiles.delete(userId);
    await this.authAdmin.deleteUser(userId);
  }
}
