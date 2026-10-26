import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { getSupabase } from '@/shared/api/supabase';

export type Credentials = {
  email: string;
  password: string;
};

export type AuthFailureReason =
  | 'invalidCredentials'
  | 'confirmationRequired'
  | 'emailInUse'
  | 'invalidCode'
  | 'weakPassword'
  | 'samePassword'
  | 'rateLimited'
  | 'offline'
  | 'unknown';

/** An expected Supabase Auth failure, already told apart so the screens can explain it. */
export class AuthFailure extends Error {
  constructor(readonly reason: AuthFailureReason) {
    super(reason);
    this.name = 'AuthFailure';
  }
}

// https://supabase.com/docs/guides/auth/debugging/error-codes
const reasonsByCode: Partial<Record<string, AuthFailureReason>> = {
  invalid_credentials: 'invalidCredentials',
  user_already_exists: 'emailInUse',
  email_exists: 'emailInUse',
  // Supabase answers a wrong code and an expired one alike.
  otp_expired: 'invalidCode',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  over_email_send_rate_limit: 'rateLimited',
  over_request_rate_limit: 'rateLimited',
};

function toFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) return error;
  // Without network fetch rejects with a TypeError, which Supabase wraps in a retryable error.
  if (isAuthRetryableFetchError(error) || error instanceof TypeError) {
    return new AuthFailure('offline');
  }
  if (isAuthError(error) && error.code)
    return new AuthFailure(reasonsByCode[error.code] ?? 'unknown');
  return new AuthFailure('unknown');
}

// Every call throws an AuthFailure, so callers handle a single error type.
async function run<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toFailure(error);
  }
}

const auth = () => getSupabase().auth;

export function signInWithPassword(credentials: Credentials): Promise<void> {
  return run(async () => {
    const { error } = await auth().signInWithPassword(credentials);
    if (error) throw error;
  });
}

// The project does not ask for an e-mail confirmation (Confirm email is off in Supabase), so a
// new account comes with a session. Without one the setting was turned back on: the account
// exists but cannot be used until confirmed, which the app has no screen for.
export function signUpWithPassword(credentials: Credentials): Promise<void> {
  return run(async () => {
    const { data, error } = await auth().signUp(credentials);
    if (error) throw error;
    if (!data.session) throw new AuthFailure('confirmationRequired');
  });
}

// Supabase answers the same whether the e-mail has an account or not, so nobody can use the
// form to find out who is signed up.
export function requestPasswordReset(email: string): Promise<void> {
  return run(async () => {
    const { error } = await auth().resetPasswordForEmail(email);
    if (error) throw error;
  });
}

/** Checks the reset code. A valid one opens a session that can change the password. */
export function verifyResetCode(email: string, code: string): Promise<void> {
  return run(async () => {
    const { error } = await auth().verifyOtp({ email, token: code, type: 'recovery' });
    if (error) throw error;
  });
}

export function updatePassword(password: string): Promise<void> {
  return run(async () => {
    const { error } = await auth().updateUser({ password });
    if (error) throw error;
  });
}
