import type { AdminStudyGroup } from '@libras/contracts';

import type {
  DeleteStudyGroupOutcome,
  CmsStudy,
  CmsStudyRepository,
  StoredStudy,
  UpdateStudyOutcome,
} from '../domain/CmsStudy';

interface Group {
  id: string;
  title: string;
}

// For tests: the groups and the studies, each list in the order given.
export class InMemoryCmsStudies implements CmsStudyRepository {
  private groups: Group[];
  private studies: StoredStudy[];

  constructor(groups: readonly Group[] = [], studies: readonly StoredStudy[] = []) {
    this.groups = structuredClone([...groups]);
    this.studies = structuredClone([...studies]);
  }

  async listGroups(): Promise<AdminStudyGroup[]> {
    return this.groups.map(({ id, title }) => ({
      id,
      title,
      studies: this.studiesOf(id).map((study) => ({
        id: study.id,
        title: study.title,
        visible: study.visible,
        description: study.description,
        pageCount: study.pages.length,
      })),
    }));
  }

  async listGroupIds(): Promise<string[]> {
    return this.groups.map((group) => group.id);
  }

  async createGroup(group: Group): Promise<void> {
    this.groups.push({ ...group });
  }

  async renameGroup(id: string, title: string): Promise<boolean> {
    const group = this.groups.find((candidate) => candidate.id === id);
    if (group) group.title = title;
    return group !== undefined;
  }

  async deleteGroup(id: string): Promise<DeleteStudyGroupOutcome> {
    if (!this.hasGroup(id)) return 'notFound';
    if (this.studiesOf(id).length > 0) return 'notEmpty';
    this.groups = this.groups.filter((group) => group.id !== id);
    return 'deleted';
  }

  async reorderGroups(ids: readonly string[]): Promise<void> {
    this.groups = ids.flatMap((id) => this.groups.filter((group) => group.id === id));
  }

  async find(id: string): Promise<StoredStudy | null> {
    const study = this.studies.find((candidate) => candidate.id === id);
    return study ? structuredClone(study) : null;
  }

  async listStudyIds(groupId: string): Promise<string[] | null> {
    if (!this.hasGroup(groupId)) return null;
    return this.studiesOf(groupId).map((study) => study.id);
  }

  async create(study: CmsStudy): Promise<boolean> {
    if (!this.hasGroup(study.groupId)) return false;
    this.studies.push({ ...structuredClone(study), visible: false });
    return true;
  }

  async update(study: CmsStudy): Promise<UpdateStudyOutcome> {
    const index = this.studies.findIndex((candidate) => candidate.id === study.id);
    if (index < 0) return 'notFound';
    if (!this.hasGroup(study.groupId)) return 'groupNotFound';

    const current = this.studies[index];
    const updated = { ...structuredClone(study), visible: current?.visible ?? false };
    if (current?.groupId !== study.groupId) {
      // To the end of the new group.
      this.studies.splice(index, 1);
      this.studies.push(updated);
    } else {
      this.studies[index] = updated;
    }
    return 'updated';
  }

  async setVisible(id: string, visible: boolean): Promise<boolean> {
    const study = this.studies.find((candidate) => candidate.id === id);
    if (study) study.visible = visible;
    return study !== undefined;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.studies.length;
    this.studies = this.studies.filter((study) => study.id !== id);
    return this.studies.length < before;
  }

  async reorderStudies(groupId: string, ids: readonly string[]): Promise<void> {
    const others = this.studies.filter((study) => study.groupId !== groupId);
    const ordered = ids.flatMap((id) => this.studies.filter((study) => study.id === id));
    this.studies = [...others, ...ordered];
  }

  private hasGroup(id: string): boolean {
    return this.groups.some((group) => group.id === id);
  }

  private studiesOf(groupId: string): StoredStudy[] {
    return this.studies.filter((study) => study.groupId === groupId);
  }
}
