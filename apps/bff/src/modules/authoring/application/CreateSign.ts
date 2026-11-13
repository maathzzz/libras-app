import type { SaveSignRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import type { CmsSignRepository } from '../domain/CmsSignRepository';

export class CreateSign {
  constructor(
    private readonly signs: CmsSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: SaveSignRequest): Promise<{ id: string }> {
    const id = this.ids.next('sign');
    await this.signs.create({ id, ...input });
    return { id };
  }
}
