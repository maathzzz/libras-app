import type { AdminStudiesResponse } from '@libras/contracts';

import type { DraftStudyRepository } from '../domain/DraftStudy';

export class GetDraftStudies {
  constructor(private readonly studies: DraftStudyRepository) {}

  async execute(): Promise<AdminStudiesResponse> {
    return { groups: await this.studies.listGroups() };
  }
}
