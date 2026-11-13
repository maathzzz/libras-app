import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyNotFound, type DraftStudyRepository } from '../domain/DraftStudy';

export class DeleteStudy {
  constructor(private readonly studies: DraftStudyRepository) {}

  async execute({ id }: { id: string }): Promise<Result<void>> {
    const deleted = await this.studies.delete(id);
    return deleted ? ok(undefined) : err(studyNotFound(id));
  }
}
