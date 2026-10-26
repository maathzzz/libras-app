import { describe, expect, it } from 'vitest';

import { LocalDate } from '../../../shared/domain/LocalDate';
import { Streak } from './Streak';

// 'YYYY-MM-DD' → LocalDate, to keep the scenarios readable.
const d = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return LocalDate.of(year ?? 0, month ?? 0, day ?? 0);
};

const streakOf = (current: number, longest: number, lastActivity: string) =>
  Streak.restore({ current, longest, lastActivity: d(lastActivity) });

describe('Streak.registerLessonCompleted', () => {
  it('starts at 1 on the first lesson', () => {
    const streak = Streak.empty().registerLessonCompleted(d('2026-03-15'));

    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(1);
    expect(streak.statusAt(d('2026-03-15'))).toBe('done_today');
  });

  it('does not change on a second lesson the same day', () => {
    const streak = streakOf(4, 6, '2026-03-15').registerLessonCompleted(d('2026-03-15'));

    expect(streak.current).toBe(4);
    expect(streak.longest).toBe(6);
  });

  it('grows by 1 on a lesson the next day', () => {
    const streak = streakOf(4, 4, '2026-03-14').registerLessonCompleted(d('2026-03-15'));

    expect(streak.current).toBe(5);
    expect(streak.longest).toBe(5);
    expect(streak.lastActivity?.toString()).toBe('2026-03-15');
  });

  it('restarts at 1 after a skipped day', () => {
    const streak = streakOf(4, 4, '2026-03-13').registerLessonCompleted(d('2026-03-15'));

    expect(streak.current).toBe(1);
  });

  it('keeps longest after a restart and updates it once the new run passes it', () => {
    const restarted = streakOf(5, 5, '2026-03-10').registerLessonCompleted(d('2026-03-15'));
    expect(restarted.current).toBe(1);
    expect(restarted.longest).toBe(5);

    const passed = streakOf(5, 5, '2026-03-14').registerLessonCompleted(d('2026-03-15'));
    expect(passed.longest).toBe(6);
  });

  it('grows across a month boundary', () => {
    expect(streakOf(2, 2, '2026-04-30').registerLessonCompleted(d('2026-05-01')).current).toBe(3);
    expect(streakOf(2, 2, '2026-02-28').registerLessonCompleted(d('2026-03-01')).current).toBe(3);
  });

  it('grows across a year boundary', () => {
    expect(streakOf(2, 2, '2026-12-31').registerLessonCompleted(d('2027-01-01')).current).toBe(3);
  });

  it('does not change on a lesson dated the day before the last activity', () => {
    const streak = streakOf(3, 5, '2026-03-16');

    const next = streak.registerLessonCompleted(d('2026-03-15'));

    expect(next.current).toBe(3);
    expect(next.longest).toBe(5);
    expect(next.lastActivity?.toString()).toBe('2026-03-16');
  });

  it('does not change on a lesson dated several days before the last activity', () => {
    const streak = streakOf(1, 4, '2026-03-16');

    const next = streak.registerLessonCompleted(d('2026-03-01'));

    expect(next.current).toBe(1);
    expect(next.longest).toBe(4);
    expect(next.lastActivity?.toString()).toBe('2026-03-16');
  });

  it('returns a new streak and leaves the original unchanged', () => {
    const original = streakOf(2, 2, '2026-03-14');

    const next = original.registerLessonCompleted(d('2026-03-15'));

    expect(next).not.toBe(original);
    expect(original.current).toBe(2);
    expect(original.lastActivity?.toString()).toBe('2026-03-14');
  });
});

describe('Streak.statusAt and currentAt', () => {
  it('is done_today when the last lesson was today', () => {
    const streak = streakOf(3, 5, '2026-03-15');

    expect(streak.statusAt(d('2026-03-15'))).toBe('done_today');
    expect(streak.currentAt(d('2026-03-15'))).toBe(3);
  });

  it('is at_risk and still shows the value when the last lesson was yesterday', () => {
    const streak = streakOf(3, 5, '2026-03-14');

    expect(streak.statusAt(d('2026-03-15'))).toBe('at_risk');
    expect(streak.currentAt(d('2026-03-15'))).toBe(3);
  });

  it('is broken and shows 0 when the last lesson was before yesterday', () => {
    const streak = streakOf(3, 5, '2026-03-13');

    expect(streak.statusAt(d('2026-03-15'))).toBe('broken');
    expect(streak.currentAt(d('2026-03-15'))).toBe(0);
    expect(streak.longest).toBe(5);
  });

  it('is done_today when the last lesson is dated after today', () => {
    const streak = streakOf(3, 5, '2026-03-16');

    expect(streak.statusAt(d('2026-03-15'))).toBe('done_today');
    expect(streak.currentAt(d('2026-03-15'))).toBe(3);
  });

  it('is broken with 0 before the first lesson', () => {
    expect(Streak.empty().statusAt(d('2026-03-15'))).toBe('broken');
    expect(Streak.empty().currentAt(d('2026-03-15'))).toBe(0);
  });
});

describe('Streak.restore', () => {
  it('rebuilds the saved state', () => {
    const streak = streakOf(3, 5, '2026-03-15');

    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(5);
    expect(streak.lastActivity?.toString()).toBe('2026-03-15');
  });

  it('rejects longest lower than current', () => {
    expect(() => streakOf(5, 3, '2026-03-15')).toThrow(RangeError);
  });
});
