import { describe, expect, it } from 'vitest';

import { LocalDate } from './LocalDate';

describe('LocalDate.utcDateOf', () => {
  it('takes the date in UTC, whatever the hour', () => {
    expect(LocalDate.utcDateOf(new Date('2026-03-15T00:00:00Z')).toString()).toBe('2026-03-15');
    expect(LocalDate.utcDateOf(new Date('2026-03-15T23:59:59.999Z')).toString()).toBe(
      '2026-03-15',
    );
  });

  it('uses UTC even for an instant written with an offset', () => {
    // 23:30 in São Paulo is already the next day in UTC.
    expect(LocalDate.utcDateOf(new Date('2026-03-14T23:30:00-03:00')).toString()).toBe(
      '2026-03-15',
    );
  });

  it('crosses month and year boundaries at midnight UTC', () => {
    expect(LocalDate.utcDateOf(new Date('2026-04-30T23:59:59Z')).toString()).toBe('2026-04-30');
    expect(LocalDate.utcDateOf(new Date('2027-01-01T00:00:00Z')).toString()).toBe('2027-01-01');
  });
});

describe('LocalDate.minusDays', () => {
  it('goes back within the same month', () => {
    expect(LocalDate.of(2026, 3, 15).minusDays(1).toString()).toBe('2026-03-14');
  });

  it('crosses into the previous month', () => {
    expect(LocalDate.of(2026, 5, 1).minusDays(1).toString()).toBe('2026-04-30');
    expect(LocalDate.of(2026, 3, 1).minusDays(1).toString()).toBe('2026-02-28');
  });

  it('lands on February 29 in a leap year', () => {
    expect(LocalDate.of(2028, 3, 1).minusDays(1).toString()).toBe('2028-02-29');
  });

  it('crosses into the previous year', () => {
    expect(LocalDate.of(2027, 1, 1).minusDays(1).toString()).toBe('2026-12-31');
    expect(LocalDate.of(2027, 1, 10).minusDays(41).toString()).toBe('2026-11-30');
  });

  it('returns the same date for zero days', () => {
    const date = LocalDate.of(2026, 3, 15);
    expect(date.minusDays(0).equals(date)).toBe(true);
  });

  it('is not affected by a daylight saving change', () => {
    // DST started in New York on 2026-03-08: calendar math must not skip or repeat a day.
    expect(LocalDate.of(2026, 3, 9).minusDays(1).toString()).toBe('2026-03-08');
    expect(LocalDate.of(2026, 3, 8).minusDays(1).toString()).toBe('2026-03-07');
  });
});

describe('LocalDate.equals', () => {
  it('is true for the same calendar date', () => {
    expect(LocalDate.of(2026, 3, 15).equals(LocalDate.of(2026, 3, 15))).toBe(true);
  });

  it('is false when the day, month or year differs', () => {
    const date = LocalDate.of(2026, 3, 15);
    expect(date.equals(LocalDate.of(2026, 3, 16))).toBe(false);
    expect(date.equals(LocalDate.of(2026, 4, 15))).toBe(false);
    expect(date.equals(LocalDate.of(2027, 3, 15))).toBe(false);
  });

  it('recognizes yesterday through minusDays', () => {
    const today = LocalDate.of(2026, 3, 1);
    expect(LocalDate.of(2026, 2, 28).equals(today.minusDays(1))).toBe(true);
  });
});

describe('LocalDate.isAfter', () => {
  const date = LocalDate.of(2026, 3, 15);

  it('is true for a later day, month or year', () => {
    expect(LocalDate.of(2026, 3, 16).isAfter(date)).toBe(true);
    expect(LocalDate.of(2026, 4, 1).isAfter(date)).toBe(true);
    expect(LocalDate.of(2027, 1, 1).isAfter(date)).toBe(true);
  });

  it('is false for the same date', () => {
    expect(LocalDate.of(2026, 3, 15).isAfter(date)).toBe(false);
  });

  it('is false for an earlier date, even with a later day or month', () => {
    expect(LocalDate.of(2026, 3, 14).isAfter(date)).toBe(false);
    expect(LocalDate.of(2026, 2, 28).isAfter(date)).toBe(false);
    expect(LocalDate.of(2025, 12, 31).isAfter(date)).toBe(false);
  });
});

describe('LocalDate.isBefore', () => {
  const date = LocalDate.of(2026, 3, 15);

  it('is true for an earlier day, month or year', () => {
    expect(LocalDate.of(2026, 3, 14).isBefore(date)).toBe(true);
    expect(LocalDate.of(2026, 2, 28).isBefore(date)).toBe(true);
    expect(LocalDate.of(2025, 12, 31).isBefore(date)).toBe(true);
  });

  it('is false for the same date', () => {
    expect(LocalDate.of(2026, 3, 15).isBefore(date)).toBe(false);
  });

  it('is false for a later date, even with an earlier day or month', () => {
    expect(LocalDate.of(2026, 3, 16).isBefore(date)).toBe(false);
    expect(LocalDate.of(2026, 4, 1).isBefore(date)).toBe(false);
    expect(LocalDate.of(2027, 1, 1).isBefore(date)).toBe(false);
  });
});

describe('LocalDate.of', () => {
  it('rejects a date that does not exist', () => {
    expect(() => LocalDate.of(2026, 2, 29)).toThrow(RangeError);
    expect(() => LocalDate.of(2026, 13, 1)).toThrow(RangeError);
  });
});

describe('LocalDate.toString', () => {
  it('pads month and day as YYYY-MM-DD', () => {
    expect(LocalDate.of(2026, 1, 5).toString()).toBe('2026-01-05');
  });
});

describe('LocalDate.parse', () => {
  it('reads back what toString writes', () => {
    expect(LocalDate.parse('2026-01-05').equals(LocalDate.of(2026, 1, 5))).toBe(true);
    expect(LocalDate.parse('2028-02-29').toString()).toBe('2028-02-29');
  });

  it('rejects other formats', () => {
    expect(() => LocalDate.parse('2026-1-5')).toThrow(RangeError);
    expect(() => LocalDate.parse('2026-01-05T00:00:00Z')).toThrow(RangeError);
    expect(() => LocalDate.parse('')).toThrow(RangeError);
  });

  it('rejects a date that does not exist', () => {
    expect(() => LocalDate.parse('2026-02-29')).toThrow(RangeError);
  });
});
