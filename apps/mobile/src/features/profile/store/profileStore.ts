import type { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';
import { create } from 'zustand';

import { signOut } from '@/features/auth';
import { reloadHome } from '@/features/home';

import { deleteAccount, getProfile, updateProfile } from '../api/profileApi';

type ProfileState = {
  profile: ProfileResponse | null;
  saving: boolean;
  deleting: boolean;
  load: () => Promise<void>;
  /** Resolves to false when the change could not be saved. */
  update: (update: UpdateProfileRequest) => Promise<boolean>;
  /** Deletes the account for good, then ends the session. Resolves to false when it failed. */
  deleteAccount: () => Promise<boolean>;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  saving: false,
  deleting: false,

  load: async () => {
    try {
      set({ profile: await getProfile() });
    } catch {
      // Screens that show the profile keep the last one, or simply leave it out.
    }
  },

  update: async (update) => {
    set({ saving: true });
    try {
      set({ profile: await updateProfile(update) });
      // The home shows today's progress against the daily goal.
      if (update.dailyGoal !== undefined) void reloadHome();
      return true;
    } catch {
      return false;
    } finally {
      set({ saving: false });
    }
  },

  deleteAccount: async () => {
    if (get().deleting) return false;
    set({ deleting: true });
    try {
      await deleteAccount();
    } catch {
      set({ deleting: false });
      return false;
    }
    // The account is gone, so is the session that pointed to it. The session guard takes the
    // learner back to the welcome screen.
    await signOut();
    set({ deleting: false });
    return true;
  },

  clear: () => set({ profile: null }),
}));
