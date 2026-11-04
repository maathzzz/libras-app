import { create } from 'zustand';

import { storage } from '@/shared/lib/storage';

import {
  cancelLegacyReminder,
  cancelReminders,
  readPermission,
  requestPermission,
  scheduleReminders,
  type NotificationPermission,
} from '../schedule/notifications';
import {
  fromMinuteOfDay,
  reminderDates,
  toMinuteOfDay,
  type ReminderTime,
} from '../schedule/reminderTime';

// Notifications are local to the device, so the choice lives on it too, not on the BFF.
const keys = {
  enabled: 'reminder.enabled',
  time: 'reminder.minuteOfDay',
  lastLessonDate: 'reminder.lastLessonDate',
  offered: 'reminder.offered',
  legacyNotificationId: 'settings.reminder.notificationId',
} as const;

type ReminderState = {
  /** The learner's choice; the reminder only fires while notifications are also allowed. */
  enabled: boolean;
  time: ReminderTime;
  /** Null until read from the system. */
  permission: NotificationPermission | null;
  /** There is a session: nothing is scheduled for a signed-out device. */
  active: boolean;
  // Blocks a second tap while the permission prompt or the scheduling is still running.
  busy: boolean;
  /** Reads the permission again and moves the week of reminders forward. */
  start: () => Promise<void>;
  stop: () => Promise<void>;
  setEnabled: (on: boolean) => Promise<void>;
  setTime: (time: ReminderTime) => Promise<void>;
  markLessonDone: (localDate: string) => Promise<void>;
};

export const useReminderStore = create<ReminderState>()((set, get) => {
  // Each run reads the latest state when it starts. Running them one after another keeps
  // an older run from scheduling today's reminder again after a lesson cancelled it.
  let queue = Promise.resolve();

  const applySchedule = () => {
    queue = queue
      .then(async () => {
        const { active, enabled, permission, time } = get();
        if (!active || !enabled || permission !== 'granted') {
          await cancelReminders();
          return;
        }
        const lastLessonDate = storage.getString(keys.lastLessonDate);
        await scheduleReminders(reminderDates(new Date(), time, lastLessonDate));
      })
      // A failed run is redone on the next start (app opening or foreground); it must not
      // block the runs after it.
      .catch(() => undefined);
    return queue;
  };

  return {
    enabled: storage.getBoolean(keys.enabled) ?? false,
    time: fromMinuteOfDay(storage.getNumber(keys.time)),
    permission: null,
    active: false,
    busy: false,

    start: async () => {
      await migrateLegacyReminder();
      set({ active: true, enabled: storage.getBoolean(keys.enabled) ?? false });
      try {
        // Also catches notifications allowed or blocked in the device settings meanwhile.
        set({ permission: await readPermission() });
      } catch {
        return;
      }
      await applySchedule();
    },

    stop: async () => {
      // The next learner on this device has their own lessons.
      storage.remove(keys.lastLessonDate);
      set({ active: false });
      await applySchedule();
    },

    setEnabled: async (on) => {
      if (get().busy) return;
      set({ busy: true });

      try {
        if (on) {
          const permission = await requestPermission();
          set({ permission });
          if (permission !== 'granted') return;
        }
        storage.set(keys.enabled, on);
        set({ enabled: on });
        await applySchedule();
      } catch {
        // The prompt failed; the switch keeps showing what is actually on.
      } finally {
        set({ busy: false });
      }
    },

    setTime: async (time) => {
      storage.set(keys.time, toMinuteOfDay(time));
      set({ time });
      await applySchedule();
    },

    markLessonDone: async (localDate) => {
      const last = storage.getString(keys.lastLessonDate);
      // YYYY-MM-DD compares as text; an older date never moves it back.
      if (last !== undefined && last >= localDate) return;
      storage.set(keys.lastLessonDate, localDate);
      await applySchedule();
    },
  };
});

async function migrateLegacyReminder() {
  const id = storage.getString(keys.legacyNotificationId);
  if (id === undefined) return;

  try {
    await cancelLegacyReminder(id);
  } catch {
    return;
  }
  storage.remove(keys.legacyNotificationId);
  storage.set(keys.enabled, true);
}

/** Chosen by the learner and allowed by the system. */
export const selectReminderOn = (state: ReminderState) =>
  state.enabled && state.permission === 'granted';

/**
 * Offered once, after a lesson, while the reminder is off and the system can still show
 * its prompt. Right after a finished lesson the streak is on the learner's mind, so the
 * request makes sense to them; on the first launch it would be a blind "allow?".
 */
export function shouldOfferReminder(): boolean {
  if (storage.getBoolean(keys.offered)) return false;

  const state = useReminderStore.getState();
  return state.permission !== null && state.permission !== 'blocked' && !selectReminderOn(state);
}

export function markReminderOffered() {
  storage.set(keys.offered, true);
}
