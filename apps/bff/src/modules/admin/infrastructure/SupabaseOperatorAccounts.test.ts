import { describe, expect, it, vi } from 'vitest';

import { CryptoPasswordGenerator } from './CryptoPasswordGenerator';
import { SupabaseOperatorAccounts } from './SupabaseOperatorAccounts';

const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const secretKey = 'sb_secret_test';
const headers = { apikey: secretKey, Authorization: `Bearer ${secretKey}` };

// No integration test: it would create real accounts in the cloud project, with no rollback.
function accountsAnswering(status: number, body: unknown = null) {
  const fetchFn = vi.fn<typeof fetch>(
    async () => new Response(body === null ? null : JSON.stringify(body), { status }),
  );
  return {
    fetchFn,
    accounts: new SupabaseOperatorAccounts('https://ref.supabase.co', secretKey, fetchFn),
  };
}

describe('SupabaseOperatorAccounts', () => {
  it('creates a confirmed account with the operator role', async () => {
    const { accounts, fetchFn } = accountsAnswering(200, { id: userId });

    expect(await accounts.create('ana+cms@example.com', 'secret-password')).toBe(userId);
    expect(fetchFn).toHaveBeenCalledWith('https://ref.supabase.co/auth/v1/admin/users', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'ana+cms@example.com',
        password: 'secret-password',
        email_confirm: true,
        app_metadata: { role: 'admin' },
      }),
    });
  });

  it('answers null for an e-mail that already has an account', async () => {
    const current = accountsAnswering(422, { error_code: 'email_exists' });
    const older = accountsAnswering(422, {
      msg: 'A user with this email address has already been registered',
    });

    expect(await current.accounts.create('aluno@example.com', 'p')).toBeNull();
    expect(await older.accounts.create('aluno@example.com', 'p')).toBeNull();
  });

  it('throws on any other refusal', async () => {
    const weak = accountsAnswering(422, { error_code: 'weak_password' });
    await expect(weak.accounts.create('a@example.com', 'p')).rejects.toThrow(/HTTP 422/);
    await expect(accountsAnswering(500).accounts.create('a@example.com', 'p')).rejects.toThrow(
      /HTTP 500/,
    );
  });

  it('sets a password and deletes an account', async () => {
    const { accounts, fetchFn } = accountsAnswering(200);

    await accounts.setPassword(userId, 'new-password');
    await accounts.delete(userId);

    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      `https://ref.supabase.co/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'new-password' }),
      },
    );
    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      `https://ref.supabase.co/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers,
      },
    );
    await expect(accountsAnswering(404).accounts.delete(userId)).resolves.toBeUndefined();
    await expect(accountsAnswering(500).accounts.setPassword(userId, 'x')).rejects.toThrow(
      /HTTP 500/,
    );
  });
});

describe('CryptoPasswordGenerator', () => {
  it('makes a different 16-character password each time', () => {
    const passwords = new CryptoPasswordGenerator();
    const [first, second] = [passwords.next(), passwords.next()];

    expect(first).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(first).not.toBe(second);
  });
});
