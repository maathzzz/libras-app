import type { OperatorAccounts, PasswordGenerator } from '../domain/OperatorAccounts';

// For tests: the accounts by e-mail, with their passwords. `takenEmails` stands for accounts
// that already exist, such as learners'.
export class InMemoryOperatorAccounts implements OperatorAccounts {
  readonly passwords = new Map<string, string>();
  private readonly emailOf = new Map<string, string>();
  private count = 0;

  constructor(private readonly takenEmails: ReadonlySet<string> = new Set()) {}

  async create(email: string, password: string): Promise<string | null> {
    if (this.takenEmails.has(email) || [...this.emailOf.values()].includes(email)) return null;
    this.count += 1;
    const userId = `00000000-0000-4000-8000-${String(this.count).padStart(12, '0')}`;
    this.emailOf.set(userId, email);
    this.passwords.set(userId, password);
    return userId;
  }

  async setPassword(userId: string, password: string): Promise<void> {
    this.passwords.set(userId, password);
  }

  async delete(userId: string): Promise<void> {
    this.emailOf.delete(userId);
    this.passwords.delete(userId);
  }
}

// For tests: `temporary-password-1`, `temporary-password-2`...
export class SequentialPasswordGenerator implements PasswordGenerator {
  private count = 0;

  next(): string {
    this.count += 1;
    return `temporary-password-${this.count}`;
  }
}
