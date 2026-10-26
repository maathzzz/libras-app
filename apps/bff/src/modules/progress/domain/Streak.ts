import type { StreakStatus } from '@libras/contracts';

import type { LocalDate } from '../../../shared/domain/LocalDate';

interface StreakState {
  current: number;
  longest: number;
  lastActivity: LocalDate | null;
}

// Immutable: every change returns a new Streak. The status is computed on read, so a
// missed day breaks the streak without any scheduled job.
export class Streak {
  private constructor(
    readonly current: number,
    readonly longest: number,
    readonly lastActivity: LocalDate | null,
  ) {}

  static empty(): Streak {
    return new Streak(0, 0, null);
  }

  static restore({ current, longest, lastActivity }: StreakState): Streak {
    if (longest < current) {
      throw new RangeError(`Streak longest (${longest}) cannot be lower than current (${current})`);
    }
    return new Streak(current, longest, lastActivity);
  }

  registerLessonCompleted(today: LocalDate): Streak {
    if (this.isDoneAt(today)) return this;

    const current = this.isYesterday(today) ? this.current + 1 : 1;
    return new Streak(current, Math.max(this.longest, current), today);
  }

  statusAt(today: LocalDate): StreakStatus {
    if (this.isDoneAt(today)) return 'done_today';
    if (this.isYesterday(today)) return 'at_risk';
    return 'broken';
  }

  currentAt(today: LocalDate): number {
    return this.statusAt(today) === 'broken' ? 0 : this.current;
  }

  // A last activity after today only happens when the learner moves to a zone further
  // west; it counts as today so changing the time zone never costs the streak.
  private isDoneAt(today: LocalDate): boolean {
    if (this.lastActivity === null) return false;
    return this.lastActivity.equals(today) || this.lastActivity.isAfter(today);
  }

  private isYesterday(today: LocalDate): boolean {
    return this.lastActivity?.equals(today.minusDays(1)) ?? false;
  }
}
