import type { AdminStudiesResponse } from '@libras/contracts';

import type { CmsStudyRepository } from '../domain/CmsStudy';

export class GetCmsStudies {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute(): Promise<AdminStudiesResponse> {
    return { groups: await this.studies.listGroups() };
  }
}
