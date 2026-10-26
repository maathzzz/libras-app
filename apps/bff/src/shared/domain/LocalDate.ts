const pad = (value: number, length: number) => String(value).padStart(length, '0');

// A calendar date with no time of day. The streak's "day" is the device's local date, sent
// by the app as YYYY-MM-DD, so the BFF never needs the learner's time zone.
export class LocalDate {
  private constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {}

  static of(year: number, month: number, day: number): LocalDate {
    const date = LocalDate.utcDateOf(new Date(Date.UTC(year, month - 1, day)));
    // Date.UTC silently rolls over (Feb 30 becomes Mar 2), so a round trip catches bad input.
    if (date.year !== year || date.month !== month || date.day !== day) {
      throw new RangeError(`Invalid date: ${year}-${month}-${day}`);
    }
    return date;
  }

  // The inverse of toString(), for dates sent by the app or read back from Postgres `date`.
  static parse(iso: string): LocalDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) throw new RangeError(`Invalid date: ${iso}`);
    return LocalDate.of(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // The date of an instant in UTC. Only a reference to bound the device's date, never the
  // learner's day.
  static utcDateOf(instant: Date): LocalDate {
    return new LocalDate(instant.getUTCFullYear(), instant.getUTCMonth() + 1, instant.getUTCDate());
  }

  // Calendar math in UTC: it has no DST gaps, and Date.UTC already handles month and
  // year boundaries (day 0 is the last day of the previous month).
  minusDays(days: number): LocalDate {
    return LocalDate.utcDateOf(new Date(Date.UTC(this.year, this.month - 1, this.day - days)));
  }

  equals(other: LocalDate): boolean {
    return this.year === other.year && this.month === other.month && this.day === other.day;
  }

  isAfter(other: LocalDate): boolean {
    if (this.year !== other.year) return this.year > other.year;
    if (this.month !== other.month) return this.month > other.month;
    return this.day > other.day;
  }

  isBefore(other: LocalDate): boolean {
    return other.isAfter(this);
  }

  // YYYY-MM-DD, the same format as Postgres `date`.
  toString(): string {
    return `${pad(this.year, 4)}-${pad(this.month, 2)}-${pad(this.day, 2)}`;
  }
}
