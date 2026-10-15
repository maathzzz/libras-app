import type { Clock } from './shared/application/Clock';
import { SystemClock } from './shared/application/SystemClock';

// Composition root: the one place that picks concrete implementations and wires them by
// constructor. Tests build their own Container with in-memory fakes.
export interface Container {
  clock: Clock;
}

export function createContainer(): Container {
  return {
    clock: new SystemClock(),
  };
}
