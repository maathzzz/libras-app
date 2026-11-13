import type { IdGenerator } from './IdGenerator';

// For tests: `<prefix>-1`, `<prefix>-2`... counted per prefix.
export class SequentialIdGenerator implements IdGenerator {
  private readonly counts = new Map<string, number>();

  next(prefix: string): string {
    const count = (this.counts.get(prefix) ?? 0) + 1;
    this.counts.set(prefix, count);
    return `${prefix}-${count}`;
  }
}
