import type { SaveStudyRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  buildStudyPages,
  signIdsOf,
  studyNotFound,
  unknownStudyGroup,
  type CmsStudyRepository,
} from '../domain/CmsStudy';
import type { CmsSignRepository } from '../domain/CmsSignRepository';
import { findCmsSigns } from './findCmsSigns';

export type UpdateStudyInput = SaveStudyRequest & { id: string };

// Replaces every field of a study but its visibility. Changing the group moves it to the end of the new one.
export class UpdateStudy {
  constructor(
    private readonly studies: CmsStudyRepository,
    private readonly signs: CmsSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ id, pages, ...fields }: UpdateStudyInput): Promise<Result<void>> {
    const signs = await findCmsSigns(this.signs, signIdsOf(pages));
    if (!signs.ok) return signs;

    const built = buildStudyPages(pages, signs.value, () => this.ids.next('page'));
    switch (await this.studies.update({ id, ...fields, pages: built })) {
      case 'updated':
        return ok(undefined);
      case 'notFound':
        return err(studyNotFound(id));
      case 'groupNotFound':
        return err(unknownStudyGroup(fields.groupId));
    }
  }
}
