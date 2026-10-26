import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { getSupabase } from './supabase';

// Supabase keeps the session (in the encrypted storage) and renews it. This is what the API
// client and the auth feature need from it.

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

/** Whether this device has a session to restore at startup. */
export async function hasSavedSession(): Promise<boolean> {
  const { data, error } = await getSupabase().auth.getSession();
  if (data.session) return true;
  // Offline with an expired token Supabase keeps the session and renews it once the network
  // is back, so the learner stays in (and the offline queue keeps working).
  return isAuthRetryableFetchError(error);
}

/**
 * The renewed access token, or null when Supabase refused to renew the session.
 * Without network it throws a TypeError, the same error fetch gives, so callers retry later.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await getSupabase().auth.refreshSession();
  if (isAuthRetryableFetchError(error)) throw new TypeError('Network request failed');
  return data.session?.access_token ?? null;
}

/** Forgets the session on this device only; other devices stay signed in. */
export async function endSession(): Promise<void> {
  await getSupabase().auth.signOut({ scope: 'local' });
}

/** Calls the listener whenever the session ends, whoever ended it. Returns the unsubscribe. */
export function onSessionEnded(listener: () => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') listener();
  });
  return () => data.subscription.unsubscribe();
}
