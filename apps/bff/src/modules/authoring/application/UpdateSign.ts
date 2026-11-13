import type { SaveSignRequest } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { CmsSignRepository } from '../domain/CmsSignRepository';

export type UpdateSignInput = SaveSignRequest & { id: string };

// Changes the sign and the copy of its label and images in the exercises and studies that
// show it, so no exercise or study keeps an old picture.
export class UpdateSign {
  constructor(private readonly signs: CmsSignRepository) {}

  async execute(input: UpdateSignInput): Promise<Result<void>> {
    const updated = await this.signs.update(input);
    if (updated) return ok(undefined);
    return err(new DomainError('SIGN_NOT_FOUND', `Sign ${input.id} not found`));
  }
}
