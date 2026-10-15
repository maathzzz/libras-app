import type { Clock } from './Clock';

// For tests: always answers the same instant.
export class FixedClock implements Clock {
  constructor(private readonly instant: Date) {}

  now(): Date {
    // A copy, so a caller mutating the Date can't change the clock for the next one.
    return new Date(this.instant.getTime());
  }
}
