import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { getSupabase } from '@/shared/api/supabase';

import { AuthFailure, signInWithPassword, signUpWithPassword, verifyResetCode } from './authApi';

jest.mock('@/shared/api/supabase', () => ({ getSupabase: jest.fn() }));

const auth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  verifyOtp: jest.fn(),
};
jest.mocked(getSupabase).mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabase>);

const credentials = { email: 'ana@exemplo.com', password: 'segredo1' };
const apiError = (code: string, status = 400) => new AuthApiError('message', status, code);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Supabase errors', () => {
  it.each([
    ['invalid_credentials', 'invalidCredentials'],
    ['user_already_exists', 'emailInUse'],
    ['over_email_send_rate_limit', 'rateLimited'],
    ['some_new_code', 'unknown'],
  ])('tells %s apart as %s', async (code, reason) => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: apiError(code) });

    await expect(signInWithPassword(credentials)).rejects.toEqual(new AuthFailure(reason as never));
  });

  it('reports a wrong or expired code as invalid', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: apiError('otp_expired', 403) });

    await expect(verifyResetCode('ana@exemplo.com', '000000')).rejects.toMatchObject({
      reason: 'invalidCode',
    });
  });

  it('reports no network as offline', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });

    await expect(signInWithPassword(credentials)).rejects.toMatchObject({ reason: 'offline' });
  });
});

describe('signUpWithPassword', () => {
  it('resolves when the new account comes with a session', async () => {
    auth.signUp.mockResolvedValue({
      data: { user: { id: '1' }, session: { access_token: 'token-1' } },
      error: null,
    });

    await expect(signUpWithPassword(credentials)).resolves.toBeUndefined();
  });

  // Confirm email turned back on in Supabase: the account is created without a session.
  it('reports a new account without a session', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: '1' }, session: null }, error: null });

    await expect(signUpWithPassword(credentials)).rejects.toMatchObject({
      reason: 'confirmationRequired',
    });
  });
});
