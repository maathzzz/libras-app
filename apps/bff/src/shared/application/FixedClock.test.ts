import { describe, expect, it } from 'vitest';

import { FixedClock } from './FixedClock';

describe('FixedClock', () => {
  it('always returns the same instant', () => {
    const clock = new FixedClock(new Date('2026-03-15T12:00:00Z'));
    expect(clock.now().toISOString()).toBe('2026-03-15T12:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-03-15T12:00:00.000Z');
  });

  it('is not changed when a caller mutates the returned Date', () => {
    const clock = new FixedClock(new Date('2026-03-15T12:00:00Z'));
    clock.now().setUTCFullYear(2000);
    expect(clock.now().toISOString()).toBe('2026-03-15T12:00:00.000Z');
  });
});
