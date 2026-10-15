import type { Clock } from './Clock';

// The only place allowed to read the real time.
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
