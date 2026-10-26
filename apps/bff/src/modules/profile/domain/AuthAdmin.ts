// Port to the identity provider's admin side (Supabase Auth).
export interface AuthAdmin {
  // Idempotent: a user that is already gone counts as deleted.
  deleteUser(userId: string): Promise<void>;
}
