import type { AdminTrailsResponse } from '@libras/contracts';

import type { DraftOutlineRepository } from '../domain/DraftOutline';

export class GetDraftTrails {
  constructor(private readonly outline: DraftOutlineRepository) {}

  async execute(): Promise<AdminTrailsResponse> {
    return { trails: await this.outline.listTrails() };
  }
}
