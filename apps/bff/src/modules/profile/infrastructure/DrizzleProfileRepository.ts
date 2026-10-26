import { eq } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { profiles } from '../../../shared/infrastructure/db/schema';
import type { Profile, ProfileChanges } from '../domain/Profile';
import type { ProfileRepository } from '../domain/ProfileRepository';

const FOREIGN_KEY_VIOLATION = '23503';

type ProfileRow = typeof profiles.$inferSelect;

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.id,
    name: row.name,
    dailyGoal: row.dailyGoal,
    startLevel: row.startLevel,
  };
}

// Drizzle wraps driver errors, so the Postgres SQLSTATE is on the cause.
function isForeignKeyViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    cause.code === FOREIGN_KEY_VIOLATION
  );
}

export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(userId: string): Promise<Profile | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.id, userId));
    return row ? toProfile(row) : null;
  }

  async create(profile: Profile): Promise<Profile | null> {
    try {
      // Two first accesses at once both try to insert: the second keeps the first profile.
      await this.db
        .insert(profiles)
        .values({
          id: profile.userId,
          name: profile.name,
          dailyGoal: profile.dailyGoal,
          startLevel: profile.startLevel,
        })
        .onConflictDoNothing({ target: profiles.id });
    } catch (error) {
      // profiles.id references auth.users: the account was deleted but its token is still valid.
      if (isForeignKeyViolation(error)) return null;
      throw error;
    }
    return this.findById(profile.userId);
  }

  async update(userId: string, changes: ProfileChanges): Promise<Profile | null> {
    const [row] = await this.db
      .update(profiles)
      .set(changes)
      .where(eq(profiles.id, userId))
      .returning();
    return row ? toProfile(row) : null;
  }

  // lesson_sessions, user_lesson_progress and user_stats reference the profile with
  // `on delete cascade`, so this one statement removes all of the learner's data.
  async delete(userId: string): Promise<void> {
    await this.db.delete(profiles).where(eq(profiles.id, userId));
  }
}
