import type { AdminStudy } from '@libras/contracts';

import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyNotFound, type DraftStudyRepository } from '../domain/DraftStudy';

export class GetDraftStudy {
  constructor(private readonly studies: DraftStudyRepository) {}

  async execute({ id }: { id: string }): Promise<Result<AdminStudy>> {
    const study = await this.studies.find(id);
    return study ? ok(study) : err(studyNotFound(id));
  }
}
