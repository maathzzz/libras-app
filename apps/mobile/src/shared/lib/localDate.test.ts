import { getLocalDate } from './localDate';

// jest.setup.ts runs the tests in America/Sao_Paulo (UTC-3, no daylight saving time).

describe('getLocalDate', () => {
  it('keeps the same day until the last millisecond before midnight', () => {
    expect(getLocalDate(new Date(2026, 2, 14, 23, 59, 59, 999))).toBe('2026-03-14');
  });

  it('turns to the next day at local midnight', () => {
    expect(getLocalDate(new Date(2026, 2, 15, 0, 0, 0, 0))).toBe('2026-03-15');
  });

  it('uses the local date, not the UTC one, late at night', () => {
    // 23:30 in São Paulo is already 02:30 of the next day in UTC.
    const lateNight = new Date('2026-03-15T02:30:00Z');

    expect(getLocalDate(lateNight)).toBe('2026-03-14');
    expect(lateNight.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('turns to the next day at 03:00 UTC', () => {
    expect(getLocalDate(new Date('2026-03-15T02:59:59Z'))).toBe('2026-03-14');
    expect(getLocalDate(new Date('2026-03-15T03:00:00Z'))).toBe('2026-03-15');
  });

  it('crosses the month and the year near midnight', () => {
    expect(getLocalDate(new Date(2026, 3, 30, 23, 59))).toBe('2026-04-30');
    expect(getLocalDate(new Date(2026, 4, 1, 0, 1))).toBe('2026-05-01');
    expect(getLocalDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(getLocalDate(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01');
  });

  it('pads month and day with zeros', () => {
    expect(getLocalDate(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
