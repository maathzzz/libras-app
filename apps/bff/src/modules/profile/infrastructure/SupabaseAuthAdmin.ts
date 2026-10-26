import type { AuthAdmin } from '../domain/AuthAdmin';

// Calls the Auth admin API directly instead of pulling in supabase-js for a single request.
export class SupabaseAuthAdmin implements AuthAdmin {
  constructor(
    private readonly supabaseUrl: string,
    // The secret key bypasses every access rule: it exists only here, never in the app.
    private readonly secretKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async deleteUser(userId: string): Promise<void> {
    const response = await this.fetchFn(
      `${this.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        // The same pair of headers supabase-js sends with a secret key.
        headers: { apikey: this.secretKey, Authorization: `Bearer ${this.secretKey}` },
      },
    );

    // 404: already deleted, as when the app repeats the request.
    if (response.ok || response.status === 404) return;
    throw new Error(`Supabase Auth refused to delete user ${userId}: HTTP ${response.status}`);
  }
}
