import type { CreateOperatorRequest, TemporaryPasswordResponse } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { AdminRepository } from '../domain/AdminRepository';
import type { OperatorAccounts, PasswordGenerator } from '../domain/OperatorAccounts';

// Adds an operator with a new account and a temporary password, shown once. The account is
// always new: an e-mail with any account is refused, so a learner never becomes an operator.
export class CreateOperator {
  constructor(
    private readonly admins: AdminRepository,
    private readonly accounts: OperatorAccounts,
    private readonly passwords: PasswordGenerator,
  ) {}

  async execute({
    email,
    name,
  }: CreateOperatorRequest): Promise<Result<TemporaryPasswordResponse>> {
    const temporaryPassword = this.passwords.next();
    const userId = await this.accounts.create(email, temporaryPassword);
    if (!userId) {
      return err(new DomainError('EMAIL_HAS_ACCOUNT', `${email} already has an account`));
    }

    try {
      await this.admins.save({ userId, email, name, active: true });
    } catch (error) {
      // Without the row the account could not enter the CMS anyway, but it would keep the
      // e-mail taken: remove it so the operator can be added again.
      await this.accounts.delete(userId);
      throw error;
    }
    return ok({ userId, temporaryPassword });
  }
}
