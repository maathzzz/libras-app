import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { Admin, AdminRepository } from '../domain/AdminRepository';

// userId comes from the token.
export interface AuthorizeAdminInput {
  userId: string;
}

// Runs before every /v1/admin route. A learner and a deactivated operator get the same
// answer, so the CMS does not reveal which accounts are operators.
export class AuthorizeAdmin {
  constructor(private readonly admins: AdminRepository) {}

  async execute({ userId }: AuthorizeAdminInput): Promise<Result<Admin>> {
    const admin = await this.admins.findByUserId(userId);
    if (!admin?.active) {
      return err(new DomainError('NOT_ADMIN', 'This account is not a CMS operator'));
    }
    return ok(admin);
  }
}
