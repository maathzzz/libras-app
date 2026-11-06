import type { StudyGuide, StudyTrail } from '@libras/contracts';

import type { StudyRepository } from '../domain/StudyRepository';

export interface InMemoryTrail {
  id: string;
  title: string;
}

// For tests: trails and studies are listed in the order they are given.
export class InMemoryStudyRepository implements StudyRepository {
  constructor(
    private readonly trails: readonly InMemoryTrail[] = [],
    private readonly studies: readonly StudyGuide[] = [],
  ) {}

  async listByTrail(): Promise<StudyTrail[]> {
    return this.trails.flatMap((trail) => {
      const studies = this.studies
        .filter((study) => study.trailId === trail.id)
        .map(({ id, title, description, pages }) => ({
          id,
          title,
          description,
          pageCount: pages.length,
        }));
      return studies.length === 0 ? [] : [{ ...trail, studies }];
    });
  }

  async findById(studyId: string): Promise<StudyGuide | null> {
    return this.studies.find((study) => study.id === studyId) ?? null;
  }
}
