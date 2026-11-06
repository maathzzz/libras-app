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

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state);
}

export async function signIn(email: string, password: string): Promise<'ok' | 'invalid' | 'error'> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (!error) return 'ok';
  return error.status === 400 ? 'invalid' : 'error';
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
