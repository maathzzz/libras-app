import type { DailyGoal, StartLevel } from '@libras/contracts';
import { create } from 'zustand';

import { signUp, type SignUpValues } from '@/features/auth';
import { updateProfile } from '@/features/profile';

type OnboardingState = {
  // Filled in the first step; the account is only created in the last one, so going back
  // and forth between the steps never creates two accounts.
  account: SignUpValues | null;
  startLevel: StartLevel;
  dailyGoal: DailyGoal;
  setAccount: (account: SignUpValues) => void;
  setStartLevel: (level: StartLevel) => void;
  setDailyGoal: (goal: DailyGoal) => void;
  /** Resolves to false when the account could not be created. */
  createAccount: () => Promise<boolean>;
};

const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  account: null,
  startLevel: 'beginner',
  dailyGoal: 3,

  setAccount: (account) => set({ account }),
  setStartLevel: (startLevel) => set({ startLevel }),
  setDailyGoal: (dailyGoal) => set({ dailyGoal }),

  createAccount: async () => {
    const { account, startLevel, dailyGoal } = get();
    if (!account) return false;

    const { name, email, password } = account;
    const created = await signUp({ email, password }, () =>
      updateProfile({ name, startLevel, dailyGoal, timezone: deviceTimezone() }),
    );
    // The password is kept in memory only until the account exists.
    if (created) set({ account: null });
    return created;
  },
}));
