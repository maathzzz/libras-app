import type { StudyGroup, StudyGuide } from '@libras/contracts';

import type { StudyRepository } from '../domain/StudyRepository';

export interface InMemoryStudyGroup {
  id: string;
  title: string;
}

// For tests: groups and studies are listed in the order they are given.
export class InMemoryStudyRepository implements StudyRepository {
  constructor(
    private readonly groups: readonly InMemoryStudyGroup[] = [],
    private readonly studies: readonly StudyGuide[] = [],
  ) {}

  async listByGroup(): Promise<StudyGroup[]> {
    return this.groups.flatMap((group) => {
      const studies = this.studies
        .filter((study) => study.groupId === group.id)
        .map(({ id, title, description, pages }) => ({
          id,
          title,
          description,
          pageCount: pages.length,
        }));
      return studies.length === 0 ? [] : [{ ...group, studies }];
    });
  }

  async findById(studyId: string): Promise<StudyGuide | null> {
    return this.studies.find((study) => study.id === studyId) ?? null;
  }
}
