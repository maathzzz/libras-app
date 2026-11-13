import { StudyGuide, type StudyGroup } from '@libras/contracts';
import { and, asc, eq, sql } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { studies, studyGroups } from '../../../shared/infrastructure/db/schema';
import type { StudyRepository } from '../domain/StudyRepository';

export class DrizzleStudyRepository implements StudyRepository {
  constructor(private readonly db: DbExecutor) {}

  // The list only needs each study's page count, so the pages themselves are not read.
  // Ids break ties in position, so the order is always the same.
  async listByGroup(): Promise<StudyGroup[]> {
    const rows = await this.db
      .select({
        group: { id: studyGroups.id, title: studyGroups.title },
        study: {
          id: studies.id,
          title: studies.title,
          description: studies.description,
          pageCount: sql<number>`jsonb_array_length(${studies.pages})`.mapWith(Number),
        },
      })
      .from(studies)
      .innerJoin(studyGroups, eq(studyGroups.id, studies.groupId))
      // Hidden studies are still being written in the CMS.
      .where(eq(studies.visible, true))
      .orderBy(
        asc(studyGroups.position),
        asc(studyGroups.id),
        asc(studies.position),
        asc(studies.id),
      );

    // Rows arrive sorted by group, so the Map keeps the groups in that order.
    const groups = new Map<string, StudyGroup>();
    for (const { group, study } of rows) {
      const entry = groups.get(group.id) ?? { ...group, studies: [] };
      entry.studies.push(study);
      groups.set(group.id, entry);
    }
    return [...groups.values()];
  }

  async findById(studyId: string): Promise<StudyGuide | null> {
    const [row] = await this.db
      .select({
        id: studies.id,
        groupId: studies.groupId,
        title: studies.title,
        description: studies.description,
        pages: studies.pages,
      })
      .from(studies)
      .where(and(eq(studies.id, studyId), eq(studies.visible, true)));
    if (!row) return null;

    // The pages column is only typed, not checked: content written by hand or by an older
    // seed must still match the contract. A mismatch is a content bug, so it throws.
    return StudyGuide.parse(row);
  }
}
