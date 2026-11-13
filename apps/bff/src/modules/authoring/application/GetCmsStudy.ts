import type { AdminStudy } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyNotFound, type CmsStudyRepository } from '../domain/CmsStudy';

export class GetCmsStudy {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute({ id }: { id: string }): Promise<Result<AdminStudy>> {
    const study = await this.studies.find(id);
    return study ? ok(study) : err(studyNotFound(id));
  }
}
