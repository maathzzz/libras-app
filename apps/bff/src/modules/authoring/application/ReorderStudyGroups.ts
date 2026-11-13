import { err, ok, type Result } from '../../../shared/domain/Result';
import type { CmsStudyRepository } from '../domain/CmsStudy';
import { invalidOrder, isSameList } from '../domain/listOrder';

export class ReorderStudyGroups {
  constructor(private readonly studies: CmsStudyRepository) {}

  async execute({ ids }: { ids: readonly string[] }): Promise<Result<void>> {
    if (!isSameList(await this.studies.listGroupIds(), ids)) return err(invalidOrder());
    await this.studies.reorderGroups(ids);
    return ok(undefined);
  }
}
