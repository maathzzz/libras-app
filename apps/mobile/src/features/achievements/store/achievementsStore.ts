import type { AchievementStatus } from '@libras/contracts';
import { create } from 'zustand';

import { getAchievements } from '../api/getAchievements';

type AchievementsState = {
  /** Null until loaded once. */
  achievements: AchievementStatus[] | null;
  /** True when the first load failed; a failed reload keeps the last list on screen. */
  failed: boolean;
  load: () => Promise<void>;
  clear: () => void;
};

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  achievements: null,
  failed: false,

  load: async () => {
    try {
      const { achievements } = await getAchievements();
      set({ achievements, failed: false });
    } catch {
      if (get().achievements === null) set({ failed: true });
    }
  },

  clear: () => set({ achievements: null, failed: false }),
}));
