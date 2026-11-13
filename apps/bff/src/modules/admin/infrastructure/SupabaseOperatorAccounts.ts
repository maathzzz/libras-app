import { z } from 'zod';

import { OPERATOR_ROLE } from '../../../shared/infrastructure/auth';
import type { OperatorAccounts } from '../domain/OperatorAccounts';

const CreatedUser = z.object({ id: z.uuid() });
const AuthError = z.object({ error_code: z.string().optional(), msg: z.string().optional() });

// Operator accounts through the Supabase Auth admin API, called directly like
// SupabaseAuthAdmin does, instead of pulling in supabase-js for three requests.
export class SupabaseOperatorAccounts implements OperatorAccounts {
  constructor(
    private readonly supabaseUrl: string,
    // The admin API needs the secret key, which never leaves the BFF.
    private readonly secretKey: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async create(email: string, password: string): Promise<string | null> {
    // Confirmed right away: the operator was added by another operator. `app_metadata` can
    // only be written with the secret key, so the role cannot be faked by a learner.
    const response = await this.request('/admin/users', 'POST', {
      email,
      password,
      email_confirm: true,
      app_metadata: { role: OPERATOR_ROLE },
    });
    if (response.ok) return CreatedUser.parse(await response.json()).id;
    if (await isEmailTaken(response)) return null;
    throw new Error(`Supabase Auth refused to create an operator account: HTTP ${response.status}`);
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const response = await this.request(`/admin/users/${encodeURIComponent(userId)}`, 'PUT', {
      password,
    });
    if (!response.ok) {
      throw new Error(
        `Supabase Auth refused to set the password of ${userId}: HTTP ${response.status}`,
      );
    }
  }

  async delete(userId: string): Promise<void> {
    const response = await this.request(`/admin/users/${encodeURIComponent(userId)}`, 'DELETE');
    // 404: already gone.
    if (response.ok || response.status === 404) return;
    throw new Error(`Supabase Auth refused to delete ${userId}: HTTP ${response.status}`);
  }

  private request(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: object) {
    return this.fetchFn(`${this.supabaseUrl}/auth/v1${path}`, {
      method,
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
}

// Auth answers 422 with `email_exists` (older versions only say it in `msg`).
async function isEmailTaken(response: Response): Promise<boolean> {
  if (response.status !== 422) return false;
  const parsed = AuthError.safeParse(await response.json().catch(() => ({})));
  if (!parsed.success) return false;
  return (
    parsed.data.error_code === 'email_exists' ||
    (parsed.data.msg ?? '').includes('already been registered')
  );
}
