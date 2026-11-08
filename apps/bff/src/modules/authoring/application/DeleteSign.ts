import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { DraftSignRepository } from '../domain/DraftSignRepository';

export interface DeleteSignInput {
  id: string;
}

export class DeleteSign {
  constructor(private readonly signs: DraftSignRepository) {}

  async execute({ id }: DeleteSignInput): Promise<Result<void>> {
    switch (await this.signs.delete(id)) {
      case 'deleted':
        return ok(undefined);
      case 'notFound':
        return err(new DomainError('SIGN_NOT_FOUND', `Draft sign ${id} not found`));
      case 'inUse':
        return err(new DomainError('SIGN_IN_USE', `Draft sign ${id} is shown by an exercise`));
    }
  }
}
