import { create } from 'zustand';

import { clearProfile } from '@/features/profile';
import { clearAccessToken, loadAccessToken, saveAccessToken } from '@/shared/api/session';

import { signInWithPassword, signUpWithPassword, type Credentials } from '../api/authApi';

// `restoring` lasts only while the saved session is read at startup; the splash covers it.
export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  submitting: boolean;
  error: string | null;
  restore: () => Promise<void>;
  signIn: (credentials: Credentials) => Promise<void>;
  /**
   * `onAccountCreated` runs before the app switches to the signed-in screens, so the
   * onboarding choices reach the profile before the home asks for it. Resolves to false
   * when the account was not created.
   */
  signUp: (credentials: Credentials, onAccountCreated?: () => Promise<unknown>) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const connectionError = 'Não foi possível continuar. Verifique sua conexão e tente de novo.';

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'restoring',
  submitting: false,
  error: null,

  restore: async () => {
    try {
      const token = await loadAccessToken();
      set({ status: token ? 'signedIn' : 'signedOut' });
    } catch {
      set({ status: 'signedOut' });
    }
  },

  signIn: async (credentials) => {
    if (get().submitting) return;
    set({ submitting: true, error: null });

    try {
      await saveAccessToken(await signInWithPassword(credentials));
      set({ status: 'signedIn' });
    } catch {
      set({ error: connectionError });
    } finally {
      set({ submitting: false });
    }
  },

  signUp: async (credentials, onAccountCreated) => {
    if (get().submitting) return false;
    set({ submitting: true, error: null });

    try {
      await saveAccessToken(await signUpWithPassword(credentials));
    } catch {
      set({ submitting: false, error: connectionError });
      return false;
    }

    // The account already exists at this point: if the choices fail to save, the learner
    // still gets in, with the default goal, and can change it in the settings.
    await onAccountCreated?.().catch(() => undefined);
    set({ submitting: false, status: 'signedIn' });
    return true;
  },

  signOut: async () => {
    await clearAccessToken();
    clearProfile();
    set({ status: 'signedOut', error: null });
  },

  clearError: () => set({ error: null }),
}));
