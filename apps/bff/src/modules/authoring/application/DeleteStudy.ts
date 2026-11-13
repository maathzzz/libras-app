import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyNotFound, type CmsStudyRepository } from '../domain/CmsStudy';

export class DeleteStudy {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute({ id }: { id: string }): Promise<Result<void>> {
    const deleted = await this.studies.delete(id);
    return deleted ? ok(undefined) : err(studyNotFound(id));
  }
}
