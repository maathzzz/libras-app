import { formatReminderTime } from './schedule/reminderTime';
import { selectReminderOn, useReminderStore } from './store/reminderStore';

export { ReminderOffer } from './components/ReminderOffer';
export { ReminderTimeScreen } from './components/ReminderTimeScreen';
export { useStreakReminder } from './hooks/useStreakReminder';

export const useReminderOn = () => useReminderStore(selectReminderOn);
export const useReminderTime = () => useReminderStore((state) => formatReminderTime(state.time));
export const useReminderBusy = () => useReminderStore((state) => state.busy);
export const useReminderBlocked = () => useReminderStore((state) => state.permission === 'blocked');
export const setReminderEnabled = (on: boolean) => useReminderStore.getState().setEnabled(on);

// A finished lesson (sent or queued) cancels today's reminder.
export const markLessonDoneForReminder = (localDate: string) =>
  useReminderStore.getState().markLessonDone(localDate);
