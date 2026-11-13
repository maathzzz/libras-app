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

  async list(): Promise<Admin[]> {
    return [...this.byUserId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async save(admin: Admin): Promise<void> {
    this.byUserId.set(admin.userId, admin);
  }
}
