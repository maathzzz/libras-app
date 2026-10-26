import { describe, expect, it, vi } from 'vitest';

import { SupabaseAuthAdmin } from './SupabaseAuthAdmin';

const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const secretKey = 'sb_secret_test';

// No integration test: it would delete real users of the cloud project, with no rollback.
function adminAnswering(status: number) {
  const fetchFn = vi.fn<typeof fetch>(async () => new Response(null, { status }));
  return { fetchFn, admin: new SupabaseAuthAdmin('https://ref.supabase.co', secretKey, fetchFn) };
}

describe('SupabaseAuthAdmin.deleteUser', () => {
  it('calls the admin API with the secret key', async () => {
    const { admin, fetchFn } = adminAnswering(200);

    await admin.deleteUser(userId);

    expect(fetchFn).toHaveBeenCalledWith(`https://ref.supabase.co/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
    });
  });

  it('treats a user that is already gone as deleted', async () => {
    await expect(adminAnswering(404).admin.deleteUser(userId)).resolves.toBeUndefined();
  });

  it('throws on any other failure', async () => {
    await expect(adminAnswering(500).admin.deleteUser(userId)).rejects.toThrow(/HTTP 500/);
    await expect(adminAnswering(401).admin.deleteUser(userId)).rejects.toThrow(/HTTP 401/);
  });
});
