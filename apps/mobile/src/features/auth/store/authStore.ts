import { create } from 'zustand';

import { endSession, hasSavedSession, onSessionEnded } from '@/shared/api/session';

import * as authApi from '../api/authApi';
import { AuthFailure, type Credentials } from '../api/authApi';
import { authErrorMessage } from '../messages';

// `restoring` lasts only while the saved session is read at startup; the splash covers it.
export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  submitting: boolean;
  error: string | null;
  /** E-mail waiting for the password reset code. */
  resetEmail: string | null;
  /** The reset code was accepted: the session it opened only serves to set the new password. */
  resetVerified: boolean;
  restore: () => Promise<void>;
  /** Resolves to false when the learner could not sign in. */
  signIn: (credentials: Credentials) => Promise<boolean>;
  /**
   * `onAccountCreated` runs before the app switches to the signed-in screens, so the
   * onboarding choices reach the profile before the home asks for it. Resolves to false when
   * the account was not created or did not open a session.
   */
  signUp: (credentials: Credentials, onAccountCreated?: () => Promise<unknown>) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resendResetCode: () => Promise<boolean>;
  verifyResetCode: (code: string) => Promise<boolean>;
  setNewPassword: (password: string) => Promise<boolean>;
  /** Ends the session a reset code opened when the learner leaves without a new password. */
  cancelPasswordReset: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

let watchingSession = false;

export const useAuthStore = create<AuthState>()((set, get) => {
  // Runs an auth call under the shared busy flag and turns its failure into the message on
  // screen. Resolves to false when it failed (or another call was still running).
  const attempt = async (call: () => Promise<void>): Promise<boolean> => {
    if (get().submitting) return false;
    set({ submitting: true, error: null });

    try {
      await call();
      return true;
    } catch (error) {
      set({ error: authErrorMessage(error) });
      return false;
    } finally {
      set({ submitting: false });
    }
  };

  return {
    status: 'restoring',
    submitting: false,
    error: null,
    resetEmail: null,
    resetVerified: false,

    restore: async () => {
      try {
        // A session can also end outside the store, e.g. when the API client cannot renew it.
        if (!watchingSession) {
          onSessionEnded(() => set({ status: 'signedOut', resetVerified: false }));
          watchingSession = true;
        }
        set({ status: (await hasSavedSession()) ? 'signedIn' : 'signedOut' });
      } catch {
        set({ status: 'signedOut' });
      }
    },

    signIn: (credentials) =>
      attempt(async () => {
        await authApi.signInWithPassword(credentials);
        set({ status: 'signedIn' });
      }),

    signUp: (credentials, onAccountCreated) =>
      attempt(async () => {
        await authApi.signUpWithPassword(credentials);
        // The account already exists at this point: if the choices fail to save, the learner
        // still gets in, with the default goal, and can change it in the settings.
        await onAccountCreated?.().catch(() => undefined);
        set({ status: 'signedIn' });
      }),

    requestPasswordReset: (email) =>
      attempt(async () => {
        await authApi.requestPasswordReset(email);
        set({ resetEmail: email, resetVerified: false });
      }),

    resendResetCode: () =>
      attempt(async () => {
        const email = get().resetEmail;
        if (!email) throw new AuthFailure('unknown');
        await authApi.requestPasswordReset(email);
      }),

    // The session opened by the code is not a sign-in yet: the auth screens stay until the
    // new password is saved.
    verifyResetCode: (code) =>
      attempt(async () => {
        const email = get().resetEmail;
        if (!email) throw new AuthFailure('unknown');
        await authApi.verifyResetCode(email, code);
        set({ resetVerified: true });
      }),

    setNewPassword: (password) =>
      attempt(async () => {
        await authApi.updatePassword(password);
        set({ status: 'signedIn', resetEmail: null, resetVerified: false });
      }),

    cancelPasswordReset: async () => {
      if (!get().resetVerified) return;
      set({ resetVerified: false });
      await endSession().catch(() => undefined);
    },

    signOut: async () => {
      // Supabase forgets the session on the device even when the network call fails.
      await endSession().catch(() => undefined);
      set({ status: 'signedOut', error: null });
    },

    clearError: () => set({ error: null }),
  };
});
