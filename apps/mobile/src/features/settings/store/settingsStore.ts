import { create } from 'zustand';

import {
  disableDailyReminder,
  enableDailyReminder,
  isDailyReminderOn,
} from '../reminder/dailyReminder';

type SettingsState = {
  reminderOn: boolean;
  reminderDenied: boolean;
  // Blocks a second tap while the permission prompt or the scheduling is still running.
  reminderBusy: boolean;
  setReminder: (on: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  reminderOn: isDailyReminderOn(),
  reminderDenied: false,
  reminderBusy: false,

  setReminder: async (on) => {
    if (get().reminderBusy) return;
    set({ reminderBusy: true, reminderDenied: false });

    try {
      if (on) {
        const granted = await enableDailyReminder();
        set({ reminderDenied: !granted });
      } else {
        await disableDailyReminder();
      }
    } catch {
      // A failed schedule or cancel leaves things as they were; the switch shows that.
    } finally {
      set({ reminderBusy: false, reminderOn: isDailyReminderOn() });
    }
  },
}));
