import { describe, expect, it } from 'vitest';

import { LocalDate } from './LocalDate';

const at = (iso: string, timeZone: string) =>
  LocalDate.fromInstant(new Date(iso), timeZone).toString();

describe('LocalDate.fromInstant', () => {
  it('keeps the previous day in São Paulo until 03:00 UTC', () => {
    expect(at('2026-03-15T02:59:59Z', 'America/Sao_Paulo')).toBe('2026-03-14');
    expect(at('2026-03-15T03:00:00Z', 'America/Sao_Paulo')).toBe('2026-03-15');
  });

  it('gives different dates for the same instant in different zones', () => {
    const instant = '2026-03-15T01:00:00Z';
    expect(at(instant, 'America/Sao_Paulo')).toBe('2026-03-14');
    expect(at(instant, 'UTC')).toBe('2026-03-15');
  });

  it('moves to the next day earlier in zones ahead of UTC', () => {
    expect(at('2026-03-14T14:59:59Z', 'Asia/Tokyo')).toBe('2026-03-14');
    expect(at('2026-03-14T15:00:00Z', 'Asia/Tokyo')).toBe('2026-03-15');
  });

  it('handles half-hour offsets', () => {
    expect(at('2026-01-31T18:29:59Z', 'Asia/Kolkata')).toBe('2026-01-31');
    expect(at('2026-01-31T18:30:00Z', 'Asia/Kolkata')).toBe('2026-02-01');
  });

  it('follows daylight saving time', () => {
    // New York is UTC-4 in July and UTC-5 in January.
    expect(at('2026-07-10T03:59:59Z', 'America/New_York')).toBe('2026-07-09');
    expect(at('2026-07-10T04:00:00Z', 'America/New_York')).toBe('2026-07-10');
    expect(at('2026-01-10T04:59:59Z', 'America/New_York')).toBe('2026-01-09');
    expect(at('2026-01-10T05:00:00Z', 'America/New_York')).toBe('2026-01-10');
  });

  it('crosses month and year boundaries near midnight', () => {
    expect(at('2026-05-01T02:30:00Z', 'America/Sao_Paulo')).toBe('2026-04-30');
    expect(at('2027-01-01T02:30:00Z', 'America/Sao_Paulo')).toBe('2026-12-31');
    expect(at('2027-01-01T03:30:00Z', 'America/Sao_Paulo')).toBe('2027-01-01');
  });

  it('rejects an unknown time zone', () => {
    expect(() => at('2026-03-15T12:00:00Z', 'America/Nowhere')).toThrow(RangeError);
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

  it('compares dates, not instants', () => {
    const morning = LocalDate.fromInstant(new Date('2026-03-15T11:00:00Z'), 'America/Sao_Paulo');
    const night = LocalDate.fromInstant(new Date('2026-03-16T02:00:00Z'), 'America/Sao_Paulo');
    expect(morning.equals(night)).toBe(true);
  });

  it('recognizes yesterday through minusDays', () => {
    const today = LocalDate.of(2026, 3, 1);
    expect(LocalDate.of(2026, 2, 28).equals(today.minusDays(1))).toBe(true);
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
