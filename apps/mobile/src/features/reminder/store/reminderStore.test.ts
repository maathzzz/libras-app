import * as Notifications from 'expo-notifications';

import { storage } from '@/shared/lib/storage';

import { markReminderOffered, shouldOfferReminder, useReminderStore } from './reminderStore';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
}));

const notifications = jest.mocked(Notifications);
type Permission = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;
type Scheduled = Awaited<ReturnType<typeof Notifications.getAllScheduledNotificationsAsync>>;
const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain }) as Permission;

const initialState = useReminderStore.getState();
// Fake system: what is scheduled, by identifier.
let scheduled: Map<string, Date>;

const scheduledDays = () => [...scheduled.keys()].sort();
const today = '2026-11-04';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 4, 9, 0), doNotFake: ['nextTick', 'setImmediate'] });
  storage.clearAll();
  jest.clearAllMocks();
  useReminderStore.setState(initialState, true);
  scheduled = new Map();

  notifications.getPermissionsAsync.mockResolvedValue(permission(true));
  notifications.getAllScheduledNotificationsAsync.mockImplementation(
    async () => [...scheduled.keys()].map((identifier) => ({ identifier })) as Scheduled,
  );
  notifications.scheduleNotificationAsync.mockImplementation(async (request) => {
    const trigger = request.trigger as { date: Date };
    scheduled.set(request.identifier ?? '', trigger.date);
    return request.identifier ?? '';
  });
  notifications.cancelScheduledNotificationAsync.mockImplementation(async (id) => {
    scheduled.delete(id);
  });
});

afterEach(() => {
  jest.useRealTimers();
});

const store = () => useReminderStore.getState();

async function turnOn() {
  await store().start();
  await store().setEnabled(true);
}

describe('setEnabled', () => {
  it('schedules one reminder a day for the next week, starting today', async () => {
    await turnOn();

    expect(scheduledDays()).toHaveLength(7);
    expect(scheduledDays()[0]).toBe(`streak-reminder-${today}`);
    expect(scheduled.get(`streak-reminder-${today}`)).toEqual(new Date(2026, 10, 4, 20, 0));
  });

  it('asks for permission only when turned on', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false));
    notifications.requestPermissionsAsync.mockResolvedValue(permission(true));

    await store().start();
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();

    await store().setEnabled(true);
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(store().enabled).toBe(true);
  });

  it('stays off and schedules nothing when the learner denies', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false));
    notifications.requestPermissionsAsync.mockResolvedValue(permission(false, false));

    await turnOn();

    expect(store()).toMatchObject({ enabled: false, permission: 'blocked' });
    expect(scheduled.size).toBe(0);
  });

  it('does not prompt again once notifications are blocked', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));

    await turnOn();

    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('cancels every reminder when turned off', async () => {
    await turnOn();

    await store().setEnabled(false);

    expect(scheduled.size).toBe(0);
    expect(store().enabled).toBe(false);
  });
});

describe('markLessonDone', () => {
  it("cancels today's reminder and keeps the next days", async () => {
    await turnOn();

    await store().markLessonDone(today);

    expect(scheduled.has(`streak-reminder-${today}`)).toBe(false);
    expect(scheduledDays()[0]).toBe('streak-reminder-2026-11-05');
  });

  it("keeps today's reminder skipped when the app comes back", async () => {
    await turnOn();
    await store().markLessonDone(today);

    await store().start();

    expect(scheduled.has(`streak-reminder-${today}`)).toBe(false);
  });

  it('wins over a reschedule that was already running', async () => {
    await turnOn();

    const refreshing = store().start();
    const lessonDone = store().markLessonDone(today);
    await Promise.all([refreshing, lessonDone]);

    expect(scheduled.has(`streak-reminder-${today}`)).toBe(false);
  });
});

describe('setTime', () => {
  it('moves every reminder to the new time', async () => {
    await turnOn();

    await store().setTime({ hour: 7, minute: 30 });

    expect(scheduled.get('streak-reminder-2026-11-05')).toEqual(new Date(2026, 10, 5, 7, 30));
    // 07:30 already passed today.
    expect(scheduled.has(`streak-reminder-${today}`)).toBe(false);
  });
});

describe('stop', () => {
  it('cancels the reminders while signed out and forgets the last lesson', async () => {
    await turnOn();
    await store().markLessonDone(today);

    await store().stop();
    expect(scheduled.size).toBe(0);

    await store().start();
    expect(scheduled.has(`streak-reminder-${today}`)).toBe(true);
  });
});

describe('legacy reminder', () => {
  it('cancels the old repeating notification and keeps the reminder on', async () => {
    storage.set('settings.reminder.notificationId', 'old-daily');
    scheduled.set('old-daily', new Date());

    await store().start();

    expect(scheduled.has('old-daily')).toBe(false);
    expect(store().enabled).toBe(true);
    expect(scheduledDays()).toHaveLength(7);
  });
});

describe('shouldOfferReminder', () => {
  it('offers once while the reminder is off', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false));
    await store().start();

    expect(shouldOfferReminder()).toBe(true);
    markReminderOffered();
    expect(shouldOfferReminder()).toBe(false);
  });

  it('does not offer when it is already on', async () => {
    await turnOn();

    expect(shouldOfferReminder()).toBe(false);
  });

  it('does not offer when the system can no longer show the prompt', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));
    await store().start();

    expect(shouldOfferReminder()).toBe(false);
  });
});
