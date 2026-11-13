import { err, ok, type Result } from '../../../shared/domain/Result';
import { studyGroupNotFound, type DraftStudyRepository } from '../domain/DraftStudy';
import { invalidOrder, isSameList } from '../domain/listOrder';

export interface ReorderStudiesInput {
  groupId: string;
  ids: readonly string[];
}

export class ReorderStudies {
  constructor(private readonly studies: DraftStudyRepository) {}

  async execute({ groupId, ids }: ReorderStudiesInput): Promise<Result<void>> {
    const current = await this.studies.listStudyIds(groupId);
    if (!current) return err(studyGroupNotFound(groupId));
    if (!isSameList(current, ids)) return err(invalidOrder());

    await this.studies.reorderStudies(groupId, ids);
    return ok(undefined);
  }
}
