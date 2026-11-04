import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { reminderId, reminderIdPrefix } from './reminderTime';

const channelId = 'daily-reminder';

/** `blocked`: the system no longer shows the prompt; only the device settings can allow it. */
export type NotificationPermission = 'granted' | 'undetermined' | 'blocked';

// Android 13+ only shows the permission prompt once a channel exists.
async function ensureChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Lembrete de sequência',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function toPermission(response: Notifications.NotificationPermissionsStatus) {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'undetermined' : 'blocked';
}

export async function readPermission(): Promise<NotificationPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows the system prompt when it still can. */
export async function requestPermission(): Promise<NotificationPermission> {
  await ensureChannel();
  const current = await readPermission();
  if (current !== 'undetermined') return current;

  return toPermission(await Notifications.requestPermissionsAsync());
}

export async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter((request) => request.identifier.startsWith(reminderIdPrefix));
  await Promise.all(
    reminders.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

/** Replaces every scheduled reminder with one per date. */
export async function scheduleReminders(dates: Date[]): Promise<void> {
  await cancelReminders();
  if (dates.length === 0) return;

  await ensureChannel();
  for (const date of dates) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(date),
      content: {
        title: 'Sua sequência está esperando',
        body: 'Você ainda não fez uma lição hoje. Pratique Libras para manter sua sequência.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
    });
  }
}

// Earlier builds scheduled one repeating notification and kept its id; left alone, it would
// keep firing every day even after a lesson.
export async function cancelLegacyReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
