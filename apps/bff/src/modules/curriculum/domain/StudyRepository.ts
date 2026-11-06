import type { StudyGuide, StudyTrail } from '@libras/contracts';

export interface StudyRepository {
  // Trails that have studies, by trail position, each with its studies by position. Trails
  // without studies are left out.
  listByTrail(): Promise<StudyTrail[]>;
  // The study with all of its pages. Null for an unknown id.
  findById(studyId: string): Promise<StudyGuide | null>;
}
