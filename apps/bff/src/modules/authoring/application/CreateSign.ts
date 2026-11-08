import type { SaveSignRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import type { DraftSignRepository } from '../domain/DraftSignRepository';

export class CreateSign {
  constructor(
    private readonly signs: DraftSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: SaveSignRequest): Promise<{ id: string }> {
    const id = this.ids.next('sign');
    await this.signs.create({ id, ...input });
    return { id };
  }
}
