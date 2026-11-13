import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyGroupNotFound, type CmsStudyRepository } from '../domain/CmsStudy';

// No study disappears with its group: a group with studies stays until they are moved.
export class DeleteStudyGroup {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute({ id }: { id: string }): Promise<Result<void>> {
    switch (await this.studies.deleteGroup(id)) {
      case 'deleted':
        return ok(undefined);
      case 'notFound':
        return err(studyGroupNotFound(id));
      case 'notEmpty':
        return err(new DomainError('STUDY_GROUP_NOT_EMPTY', `Study group ${id} has studies`));
    }
  }
}
