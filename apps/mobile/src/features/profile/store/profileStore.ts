import type { ProfileResponse, UpdateProfileRequest } from '@libras/contracts';
import { create } from 'zustand';

import { reloadHome } from '@/features/home';

import { getProfile, updateProfile } from '../api/profileApi';

type ProfileState = {
  profile: ProfileResponse | null;
  saving: boolean;
  load: () => Promise<void>;
  /** Resolves to false when the change could not be saved. */
  update: (update: UpdateProfileRequest) => Promise<boolean>;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  saving: false,

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

  clear: () => set({ profile: null }),
}));
