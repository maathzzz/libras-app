import { getLocalDate } from '@/shared/lib/localDate';

export type ReminderTime = { hour: number; minute: number };

export const defaultReminderTime: ReminderTime = { hour: 20, minute: 0 };

// A daily repeating trigger cannot skip one day, so each day is a single notification
// scheduled ahead. Opening the app moves the window forward; a learner away for a whole
// week stops being reminded instead of being nagged forever.
export const reminderWindowDays = 7;

const minutesPerDay = 24 * 60;
const pad = (value: number) => String(value).padStart(2, '0');

export function formatReminderTime({ hour, minute }: ReminderTime): string {
  return `${pad(hour)}:${pad(minute)}`;
}

// Stored as minutes after midnight: one number is easy to validate when read back.
export function toMinuteOfDay({ hour, minute }: ReminderTime): number {
  return hour * 60 + minute;
}

export function fromMinuteOfDay(value: number | undefined): ReminderTime {
  if (value === undefined || !Number.isInteger(value) || value < 0 || value >= minutesPerDay) {
    return defaultReminderTime;
  }
  return { hour: Math.floor(value / 60), minute: value % 60 };
}

/**
 * When to remind, starting today. Today is skipped once a lesson was done or the time has
 * passed. Built from the local date components, so the reminder follows the device's clock.
 */
export function reminderDates(now: Date, time: ReminderTime, lastLessonDate?: string): Date[] {
  const lessonDoneToday = lastLessonDate === getLocalDate(now);
  const dates: Date[] = [];

  for (let offset = 0; offset < reminderWindowDays; offset++) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      time.hour,
      time.minute,
    );
    if (offset === 0 && (lessonDoneToday || date <= now)) continue;
    dates.push(date);
  }
  return dates;
}

export const reminderIdPrefix = 'streak-reminder-';

/** The notification's identifier: one per day, so scheduling a day again replaces it. */
export function reminderId(date: Date): string {
  return `${reminderIdPrefix}${getLocalDate(date)}`;
}
