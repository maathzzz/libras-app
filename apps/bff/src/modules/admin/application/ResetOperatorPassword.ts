import type { TemporaryPasswordResponse } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import type { AdminRepository } from '../domain/AdminRepository';
import type { OperatorAccounts, PasswordGenerator } from '../domain/OperatorAccounts';
import { operatorNotFound } from '../domain/operatorErrors';

// Replaces a forgotten password with a new temporary one, shown once. Only operator accounts:
// the CMS never touches a learner's password.
export class ResetOperatorPassword {
  constructor(
    private readonly admins: AdminRepository,
    private readonly accounts: OperatorAccounts,
    private readonly passwords: PasswordGenerator,
  ) {}

  async execute({ userId }: { userId: string }): Promise<Result<TemporaryPasswordResponse>> {
    if (!(await this.admins.findByUserId(userId))) return err(operatorNotFound(userId));

    const temporaryPassword = this.passwords.next();
    await this.accounts.setPassword(userId, temporaryPassword);
    return ok({ userId, temporaryPassword });
  }
}
