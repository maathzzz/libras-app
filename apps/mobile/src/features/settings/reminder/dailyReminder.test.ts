import * as Notifications from 'expo-notifications';

import { storage } from '@/shared/lib/storage';

import { disableDailyReminder, enableDailyReminder, isDailyReminderOn } from './dailyReminder';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
}));

const notifications = jest.mocked(Notifications);
type Permission = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;
const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain }) as Permission;

beforeEach(() => {
  storage.clearAll();
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue(permission(true));
  notifications.scheduleNotificationAsync.mockResolvedValue('reminder-1');
});

describe('enableDailyReminder', () => {
  it('schedules one notification every day at 20:00', async () => {
    await expect(enableDailyReminder()).resolves.toBe(true);

    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(notifications.scheduleNotificationAsync.mock.calls[0]?.[0].trigger).toMatchObject({
      type: 'daily',
      hour: 20,
      minute: 0,
    });
    expect(isDailyReminderOn()).toBe(true);
  });

  it('asks for permission when it was not granted yet', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false));
    notifications.requestPermissionsAsync.mockResolvedValue(permission(true));

    await expect(enableDailyReminder()).resolves.toBe(true);
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('schedules nothing when the permission is denied', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false));
    notifications.requestPermissionsAsync.mockResolvedValue(permission(false));

    await expect(enableDailyReminder()).resolves.toBe(false);
    expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(isDailyReminderOn()).toBe(false);
  });

  it('does not prompt again once the learner blocked notifications', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));

    await expect(enableDailyReminder()).resolves.toBe(false);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('replaces a previous schedule instead of adding a second one', async () => {
    await enableDailyReminder();
    notifications.scheduleNotificationAsync.mockResolvedValue('reminder-2');

    await enableDailyReminder();

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-1');
  });
});

describe('disableDailyReminder', () => {
  it('cancels the scheduled notification', async () => {
    await enableDailyReminder();

    await disableDailyReminder();

    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('reminder-1');
    expect(isDailyReminderOn()).toBe(false);
  });

  it('does nothing when no reminder is scheduled', async () => {
    await disableDailyReminder();

    expect(notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});
