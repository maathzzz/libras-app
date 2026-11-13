import type { SaveSignRequest } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { DraftSignRepository } from '../domain/DraftSignRepository';

export type UpdateSignInput = SaveSignRequest & { id: string };

// Changes the draft sign and the copy of its label and images in the draft exercises that
// show it, so the draft never holds an exercise with an old picture.
export class UpdateSign {
  constructor(private readonly signs: DraftSignRepository) {}

  async execute(input: UpdateSignInput): Promise<Result<void>> {
    const updated = await this.signs.update(input);
    if (updated) return ok(undefined);
    return err(new DomainError('SIGN_NOT_FOUND', `Draft sign ${input.id} not found`));
  }
}
