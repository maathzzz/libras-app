import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storage } from '@/shared/lib/storage';

// The id of the scheduled notification doubles as the "reminder on" flag, so the switch
// can never show on while nothing is scheduled.
const notificationIdKey = 'settings.reminder.notificationId';
const channelId = 'daily-reminder';

export const reminderTime = { hour: 20, minute: 0 } as const;

export function isDailyReminderOn(): boolean {
  return storage.getString(notificationIdKey) !== undefined;
}

// Android 13+ only shows the permission prompt once a channel exists.
async function ensureChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Lembrete diário',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function hasPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Resolves to false when the learner denies notifications. */
export async function enableDailyReminder(): Promise<boolean> {
  await ensureChannel();
  if (!(await hasPermission())) return false;

  // A leftover schedule would fire twice a day.
  await disableDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de praticar Libras',
      body: 'Faça uma lição hoje para manter sua sequência.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      ...reminderTime,
      channelId,
    },
  });
  storage.set(notificationIdKey, id);
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  const id = storage.getString(notificationIdKey);
  if (id === undefined) return;

  await Notifications.cancelScheduledNotificationAsync(id);
  storage.remove(notificationIdKey);
}
