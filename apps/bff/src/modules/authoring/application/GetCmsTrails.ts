import type { AdminTrailsResponse } from '@libras/contracts';

import type { CmsOutlineRepository } from '../domain/CmsOutline';

export class GetCmsTrails {
  constructor(private readonly outline: CmsOutlineRepository) {}

  async execute(): Promise<AdminTrailsResponse> {
    return { trails: await this.outline.listTrails() };
  }
}
