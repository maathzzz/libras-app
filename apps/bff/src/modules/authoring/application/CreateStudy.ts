import type { SaveStudyRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  buildStudyPages,
  signIdsOf,
  unknownStudyGroup,
  type CmsStudyRepository,
} from '../domain/CmsStudy';
import type { CmsSignRepository } from '../domain/CmsSignRepository';
import { findCmsSigns } from './findCmsSigns';

// Adds a study at the end of its group.
export class CreateStudy {
  constructor(
    private readonly studies: CmsStudyRepository,
    private readonly signs: CmsSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ pages, ...fields }: SaveStudyRequest): Promise<Result<{ id: string }>> {
    const signs = await findCmsSigns(this.signs, signIdsOf(pages));
    if (!signs.ok) return signs;

    const id = this.ids.next('study');
    const built = buildStudyPages(pages, signs.value, () => this.ids.next('page'));
    const created = await this.studies.create({ id, ...fields, pages: built });
    return created ? ok({ id }) : err(unknownStudyGroup(fields.groupId));
  }
}
