import type { StudyGroup, StudyGuide } from '@libras/contracts';

export interface StudyRepository {
  // Groups that have studies, by group position, each with its studies by position. Groups
  // without studies are left out.
  listByGroup(): Promise<StudyGroup[]>;
  // The study with all of its pages. Null for an unknown id.
  findById(studyId: string): Promise<StudyGuide | null>;
}
