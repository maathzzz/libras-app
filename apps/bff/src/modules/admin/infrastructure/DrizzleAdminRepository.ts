import { eq } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { admins } from '../../../shared/infrastructure/db/schema';
import type { Admin, AdminRepository } from '../domain/AdminRepository';

export class DrizzleAdminRepository implements AdminRepository {
  constructor(private readonly db: DbExecutor) {}

  async findByUserId(userId: string): Promise<Admin | null> {
    const [row] = await this.db
      .select({
        userId: admins.userId,
        email: admins.email,
        name: admins.name,
        active: admins.active,
      })
      .from(admins)
      .where(eq(admins.userId, userId));
    return row ?? null;
  }

  async save({ userId, email, name, active }: Admin): Promise<void> {
    await this.db
      .insert(admins)
      .values({ userId, email, name, active })
      .onConflictDoUpdate({ target: admins.userId, set: { email, name, active } });
  }
}
