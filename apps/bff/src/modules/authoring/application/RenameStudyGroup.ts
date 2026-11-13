import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyGroupNotFound, type CmsStudyRepository } from '../domain/CmsStudy';

// Renaming changes only the title: studies point to the group's id.
export class RenameStudyGroup {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute({ id, title }: { id: string; title: string }): Promise<Result<void>> {
    const renamed = await this.studies.renameGroup(id, title);
    return renamed ? ok(undefined) : err(studyGroupNotFound(id));
  }
}
