const pad = (value: number, length: number) => String(value).padStart(length, '0');

// A calendar date with no time of day. The streak's "day" is a LocalDate taken in the
// learner's time zone, so two instants only count as the same day if they are in that zone.
export class LocalDate {
  private constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {}

  static of(year: number, month: number, day: number): LocalDate {
    const date = LocalDate.fromUtcDate(new Date(Date.UTC(year, month - 1, day)));
    // Date.UTC silently rolls over (Feb 30 becomes Mar 2), so a round trip catches bad input.
    if (date.year !== year || date.month !== month || date.day !== day) {
      throw new RangeError(`Invalid date: ${year}-${month}-${day}`);
    }
    return date;
  }

  // The inverse of toString(), for dates read back from Postgres `date` columns.
  static parse(iso: string): LocalDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) throw new RangeError(`Invalid date: ${iso}`);
    return LocalDate.of(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // Uses the Intl API: Node ships with full ICU, so IANA zones work without a date library
  // and the zone database is updated together with the runtime.
  // Throws RangeError for an unknown zone.
  static fromInstant(instant: Date, timeZone: string): LocalDate {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(instant);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value);

    return new LocalDate(part('year'), part('month'), part('day'));
  }

  private static fromUtcDate(date: Date): LocalDate {
    return new LocalDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  // Calendar math in UTC: it has no DST gaps, and Date.UTC already handles month and
  // year boundaries (day 0 is the last day of the previous month).
  minusDays(days: number): LocalDate {
    return LocalDate.fromUtcDate(new Date(Date.UTC(this.year, this.month - 1, this.day - days)));
  }

  equals(other: LocalDate): boolean {
    return this.year === other.year && this.month === other.month && this.day === other.day;
  }

  isAfter(other: LocalDate): boolean {
    if (this.year !== other.year) return this.year > other.year;
    if (this.month !== other.month) return this.month > other.month;
    return this.day > other.day;
  }

  // YYYY-MM-DD, the same format as Postgres `date`.
  toString(): string {
    return `${pad(this.year, 4)}-${pad(this.month, 2)}-${pad(this.day, 2)}`;
  }
}
