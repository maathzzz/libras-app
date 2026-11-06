import type { Admin, AdminRepository } from '../domain/AdminRepository';

// For tests.
export class InMemoryAdminRepository implements AdminRepository {
  private readonly byUserId = new Map<string, Admin>();

  constructor(admins: readonly Admin[] = []) {
    for (const admin of admins) this.byUserId.set(admin.userId, admin);
  }

  async findByUserId(userId: string): Promise<Admin | null> {
    return this.byUserId.get(userId) ?? null;
  }

  async save(admin: Admin): Promise<void> {
    this.byUserId.set(admin.userId, admin);
  }
}
