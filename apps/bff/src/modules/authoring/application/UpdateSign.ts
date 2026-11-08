import type { SaveSignRequest } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { DraftSignRepository } from '../domain/DraftSignRepository';

export type UpdateSignInput = SaveSignRequest & { id: string };

// Changes only the draft sign. Exercises keep their own copy of the sign's images; that
// copy is brought up to date by the exercise editing and publishing phases.
export class UpdateSign {
  constructor(private readonly signs: DraftSignRepository) {}

  async execute(input: UpdateSignInput): Promise<Result<void>> {
    const updated = await this.signs.update(input);
    if (updated) return ok(undefined);
    return err(new DomainError('SIGN_NOT_FOUND', `Draft sign ${input.id} not found`));
  }
}
