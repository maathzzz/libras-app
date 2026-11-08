import type { StudiesResponse } from '@libras/contracts';

import type { StudyRepository } from '../domain/StudyRepository';

// The "Estudar" tab. Studies are the same for every learner: reading them is never
// recorded, so no user is needed.
export class GetStudies {
  constructor(private readonly studies: StudyRepository) {}

  async execute(): Promise<StudiesResponse> {
    return { groups: await this.studies.listByGroup() };
  }
}
