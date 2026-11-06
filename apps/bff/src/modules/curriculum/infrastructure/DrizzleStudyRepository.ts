import { StudyGuide, type StudyTrail } from '@libras/contracts';
import { asc, eq, sql } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { courses, studies } from '../../../shared/infrastructure/db/schema';
import type { StudyRepository } from '../domain/StudyRepository';

export class DrizzleStudyRepository implements StudyRepository {
  constructor(private readonly db: DbExecutor) {}

  // The list only needs each study's page count, so the pages themselves are not read.
  // Ids break ties in position, so the order is always the same.
  async listByTrail(): Promise<StudyTrail[]> {
    const rows = await this.db
      .select({
        trail: { id: courses.id, title: courses.title },
        study: {
          id: studies.id,
          title: studies.title,
          description: studies.description,
          pageCount: sql<number>`jsonb_array_length(${studies.pages})`.mapWith(Number),
        },
      })
      .from(studies)
      .innerJoin(courses, eq(courses.id, studies.trailId))
      .orderBy(asc(courses.position), asc(courses.id), asc(studies.position), asc(studies.id));

    // Rows arrive sorted by trail, so the Map keeps the trails in that order.
    const trails = new Map<string, StudyTrail>();
    for (const { trail, study } of rows) {
      const entry = trails.get(trail.id) ?? { ...trail, studies: [] };
      entry.studies.push(study);
      trails.set(trail.id, entry);
    }
    return [...trails.values()];
  }

  async findById(studyId: string): Promise<StudyGuide | null> {
    const [row] = await this.db
      .select({
        id: studies.id,
        trailId: studies.trailId,
        title: studies.title,
        description: studies.description,
        pages: studies.pages,
      })
      .from(studies)
      .where(eq(studies.id, studyId));
    if (!row) return null;

    // The pages column is only typed, not checked: content written by hand or by an older
    // seed must still match the contract. A mismatch is a content bug, so it throws.
    return StudyGuide.parse(row);
  }
}
