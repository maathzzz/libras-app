import { eq } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { profiles } from '../../../shared/infrastructure/db/schema';

// Serves progress as its UserTimezoneProvider port, matched by shape.
export class DrizzleUserTimezones {
  constructor(private readonly db: DbExecutor) {}

  // An authenticated learner always has a profile, so a missing one is a bug, not an
  // expected error.
  async timezoneOf(userId: string): Promise<string> {
    const [row] = await this.db
      .select({ timezone: profiles.timezone })
      .from(profiles)
      .where(eq(profiles.id, userId));
    if (!row) throw new Error(`Profile ${userId} not found`);
    return row.timezone;
  }
}
