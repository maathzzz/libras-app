import type { AdminSignsResponse } from '@libras/contracts';

import type { DraftSignRepository } from '../domain/DraftSignRepository';

export class GetDraftSigns {
  constructor(private readonly signs: DraftSignRepository) {}

  async execute(): Promise<AdminSignsResponse> {
    return { signs: await this.signs.list() };
  }
}
