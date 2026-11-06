import type { StudyGuide } from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import { err, ok, type Result } from '../../../shared/domain/Result';
import type { StudyRepository } from '../domain/StudyRepository';

export interface GetStudyInput {
  studyId: string;
}

// Studies never lock: they are recommended reading, so any learner may open any of them.
export class GetStudy {
  constructor(private readonly studies: StudyRepository) {}

  async execute({ studyId }: GetStudyInput): Promise<Result<StudyGuide>> {
    const study = await this.studies.findById(studyId);
    if (!study) return err(new DomainError('STUDY_NOT_FOUND', `Study ${studyId} not found`));
    return ok(study);
  }
}
