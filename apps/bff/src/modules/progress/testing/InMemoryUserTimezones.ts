import type { UserTimezoneProvider } from '../domain/UserTimezoneProvider';

// For tests: users without an explicit zone get the default one.
export class InMemoryUserTimezones implements UserTimezoneProvider {
  private readonly timezones = new Map<string, string>();

  constructor(private readonly defaultTimezone: string) {}

  set(userId: string, timezone: string): void {
    this.timezones.set(userId, timezone);
  }

  async timezoneOf(userId: string): Promise<string> {
    return this.timezones.get(userId) ?? this.defaultTimezone;
  }
}
