import type { UpdateOperatorRequest } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { AdminRepository } from '../domain/AdminRepository';
import { operatorNotFound } from '../domain/operatorErrors';

export type UpdateOperatorInput = UpdateOperatorRequest & {
  userId: string;
  // The operator making the change, from the token.
  byUserId: string;
};

// Renames, deactivates or reactivates an operator. Nobody deactivates themselves, so the
// CMS always keeps at least one active operator. A deactivated operator loses access on the
// next request, since every /v1/admin request checks `active`.
export class UpdateOperator {
  constructor(private readonly admins: AdminRepository) {}

  async execute({ userId, byUserId, name, active }: UpdateOperatorInput): Promise<Result<void>> {
    const operator = await this.admins.findByUserId(userId);
    if (!operator) return err(operatorNotFound(userId));
    if (userId === byUserId && !active) {
      return err(
        new DomainError('CANNOT_DEACTIVATE_SELF', 'Operators cannot deactivate themselves'),
      );
    }

    await this.admins.save({ ...operator, name, active });
    return ok(undefined);
  }
}
