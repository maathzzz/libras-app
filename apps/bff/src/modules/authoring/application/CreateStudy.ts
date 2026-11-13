import type { SaveStudyRequest } from '@libras/contracts';

import type { IdGenerator } from '../../../shared/application/IdGenerator';
import { err, ok, type Result } from '../../../shared/domain/Result';
import {
  buildStudyPages,
  signIdsOf,
  unknownStudyGroup,
  type DraftStudyRepository,
} from '../domain/DraftStudy';
import type { DraftSignRepository } from '../domain/DraftSignRepository';
import { findDraftSigns } from './findDraftSigns';

// Adds a study at the end of its group.
export class CreateStudy {
  constructor(
    private readonly studies: DraftStudyRepository,
    private readonly signs: DraftSignRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ pages, ...fields }: SaveStudyRequest): Promise<Result<{ id: string }>> {
    const signs = await findDraftSigns(this.signs, signIdsOf(pages));
    if (!signs.ok) return signs;

    const id = this.ids.next('study');
    const built = buildStudyPages(pages, signs.value, () => this.ids.next('page'));
    const created = await this.studies.create({ id, ...fields, pages: built });
    return created ? ok({ id }) : err(unknownStudyGroup(fields.groupId));
  }
}
