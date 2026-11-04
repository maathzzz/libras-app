import {
  formatReminderTime,
  fromMinuteOfDay,
  reminderDates,
  reminderId,
  reminderWindowDays,
  toMinuteOfDay,
} from './reminderTime';

// Local time (jest.setup fixes America/Sao_Paulo).
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);
const eight = { hour: 20, minute: 0 };

describe('reminderDates', () => {
  it('starts today when the time has not passed and no lesson was done', () => {
    const dates = reminderDates(at(4, 9), eight, '2026-11-03');

    expect(dates).toHaveLength(reminderWindowDays);
    expect(dates[0]).toEqual(at(4, 20));
    expect(dates[6]).toEqual(at(10, 20));
  });

  it('skips today once a lesson was done today', () => {
    const dates = reminderDates(at(4, 9), eight, '2026-11-04');

    expect(dates[0]).toEqual(at(5, 20));
    expect(dates).toHaveLength(reminderWindowDays - 1);
  });

  it('skips today when the time has already passed', () => {
    expect(reminderDates(at(4, 20, 30), eight)[0]).toEqual(at(5, 20));
  });

  it('crosses the end of the month on the local calendar', () => {
    const dates = reminderDates(at(29, 21), { hour: 7, minute: 30 });

    expect(dates[0]).toEqual(at(30, 7, 30));
    expect(dates[1]).toEqual(new Date(2026, 11, 1, 7, 30));
  });

  // 22:00 in São Paulo is already the next day in UTC.
  it('names each day by its local date', () => {
    expect(reminderId(at(4, 22))).toBe('streak-reminder-2026-11-04');
  });
});

describe('stored time', () => {
  it('goes to minutes after midnight and back', () => {
    const time = { hour: 7, minute: 45 };
    expect(fromMinuteOfDay(toMinuteOfDay(time))).toEqual(time);
  });

  it.each([undefined, -1, 1440, 12.5])('falls back to 20:00 when it reads %p', (value) => {
    expect(fromMinuteOfDay(value)).toEqual(eight);
  });

  it('formats with two digits', () => {
    expect(formatReminderTime({ hour: 7, minute: 5 })).toBe('07:05');
  });
});
