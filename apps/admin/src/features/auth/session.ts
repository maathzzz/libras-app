import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';

import { getSupabase } from '@/shared/api/supabase';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; userId: string; email: string | null };

let state: SessionState = { status: 'loading' };
const listeners = new Set<() => void>();
let started = false;

function stateOf(session: Session | null): SessionState {
  if (!session) return { status: 'signedOut' };
  return { status: 'signedIn', userId: session.user.id, email: session.user.email ?? null };
}

// Supabase reports the stored session first (INITIAL_SESSION) and every change after it. A
// token refresh keeps the same user, so it does not re-render the CMS.
function start() {
  if (started) return;
  started = true;
  getSupabase().auth.onAuthStateChange((_event, session) => {
    const next = stateOf(session);
    const sameUser =
      next.status === 'signedIn' && state.status === 'signedIn' && next.userId === state.userId;
    if (sameUser || (next.status === 'signedOut' && state.status === 'signedOut')) return;
    state = next;
    for (const listener of listeners) listener();
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The session lives in browser storage, so the server render (and hydration) always sees
// "loading"; the real state arrives once Supabase reports it.
const serverState: SessionState = { status: 'loading' };

export function useSession(): SessionState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export async function signIn(email: string, password: string): Promise<'ok' | 'invalid' | 'error'> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (!error) return 'ok';
  return error.status === 400 ? 'invalid' : 'error';
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

export const MIN_PASSWORD_LENGTH = 10;

export type ChangePasswordOutcome = 'ok' | 'wrongCurrent' | 'weak' | 'error';

// Changes the signed-in operator's own password. The current one is checked first by signing
// in with it, so an open, unattended CMS cannot have its password changed.
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordOutcome> {
  const supabase = getSupabase();
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) return check.error.status === 400 ? 'wrongCurrent' : 'error';

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) return 'ok';
  return error.code === 'weak_password' || error.code === 'same_password' ? 'weak' : 'error';
}
