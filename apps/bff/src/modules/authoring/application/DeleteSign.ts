import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { CmsSignRepository } from '../domain/CmsSignRepository';

export interface DeleteSignInput {
  id: string;
}

export class DeleteSign {
  constructor(private readonly signs: CmsSignRepository) {}

  async execute({ id }: DeleteSignInput): Promise<Result<void>> {
    switch (await this.signs.delete(id)) {
      case 'deleted':
        return ok(undefined);
      case 'notFound':
        return err(new DomainError('SIGN_NOT_FOUND', `Sign ${id} not found`));
      case 'inUse':
        return err(new DomainError('SIGN_IN_USE', `Sign ${id} is shown by an exercise or a study`));
    }
  }
}
