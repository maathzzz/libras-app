import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { Admin, AdminRepository } from '../domain/AdminRepository';

// Both come from the token: `operator` says the account was created as an operator account.
export interface AuthorizeAdminInput {
  userId: string;
  operator: boolean;
}

// Runs before every /v1/admin route. Two checks: the account must be an operator account
// (learner accounts never are, even if listed by mistake) and be active in app.admins. A
// learner and a deactivated operator get the same answer, so the CMS does not reveal which
// accounts are operators.
export class AuthorizeAdmin {
  constructor(private readonly admins: AdminRepository) {}

  async execute({ userId, operator }: AuthorizeAdminInput): Promise<Result<Admin>> {
    const admin = operator ? await this.admins.findByUserId(userId) : null;
    if (!admin?.active) {
      return err(new DomainError('NOT_ADMIN', 'This account is not a CMS operator'));
    }
    return ok(admin);
  }
}
