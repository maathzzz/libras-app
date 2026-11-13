import type { AdminSignsResponse } from '@libras/contracts';

import type { CmsSignRepository } from '../domain/CmsSignRepository';

export class GetCmsSigns {
  constructor(private readonly signs: CmsSignRepository) {}

  async execute(): Promise<AdminSignsResponse> {
    return { signs: await this.signs.list() };
  }
}
