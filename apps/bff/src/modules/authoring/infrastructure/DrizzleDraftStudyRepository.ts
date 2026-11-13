import { StudyPage, type AdminStudyGroup } from '@libras/contracts';
import { and, asc, eq, notExists, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { draftStudies, draftStudyGroups } from '../../../shared/infrastructure/db/schema';
import type {
  DeleteStudyGroupOutcome,
  DraftStudy,
  DraftStudyRepository,
  UpdateStudyOutcome,
} from '../domain/DraftStudy';

const IdRows = z.array(z.object({ id: z.string() }));

const textArray = (values: readonly string[]) =>
  sql`array[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;

// The position after the last study of a group, computed in the statement that uses it.
const nextPositionIn = (groupId: string) =>
  sql`(select coalesce(max(position), 0) + 1 from app.draft_studies where group_id = ${groupId})`;

const groupExists = (groupId: string) =>
  sql`exists (select 1 from app.draft_study_groups where id = ${groupId})`;

// Content outside the contract is a content error, as in the curriculum module.
const parsePages = (pages: unknown) => z.array(StudyPage).parse(pages);

export class DrizzleDraftStudyRepository implements DraftStudyRepository {
  constructor(private readonly db: DbExecutor) {}

  async listGroups(): Promise<AdminStudyGroup[]> {
    const groups = await this.db
      .select({ id: draftStudyGroups.id, title: draftStudyGroups.title })
      .from(draftStudyGroups)
      .orderBy(asc(draftStudyGroups.position), asc(draftStudyGroups.id));
    const studies = await this.db
      .select({
        id: draftStudies.id,
        groupId: draftStudies.groupId,
        title: draftStudies.title,
        description: draftStudies.description,
        pageCount: sql<number>`jsonb_array_length(${draftStudies.pages})::integer`,
      })
      .from(draftStudies)
      .orderBy(asc(draftStudies.position), asc(draftStudies.id));

    return groups.map((group) => ({
      ...group,
      studies: studies
        .filter((study) => study.groupId === group.id)
        .map(({ id, title, description, pageCount }) => ({ id, title, description, pageCount })),
    }));
  }

  async listGroupIds(): Promise<string[]> {
    const rows = await this.db
      .select({ id: draftStudyGroups.id })
      .from(draftStudyGroups)
      .orderBy(asc(draftStudyGroups.position), asc(draftStudyGroups.id));
    return rows.map(({ id }) => id);
  }

  async createGroup({ id, title }: { id: string; title: string }): Promise<void> {
    await this.db.execute(sql`
      insert into app.draft_study_groups (id, title, position)
      select ${id}, ${title}, coalesce(max(position), 0) + 1 from app.draft_study_groups
    `);
  }

  async renameGroup(id: string, title: string): Promise<boolean> {
    const rows = await this.db
      .update(draftStudyGroups)
      .set({ title })
      .where(eq(draftStudyGroups.id, id))
      .returning({ id: draftStudyGroups.id });
    return rows.length > 0;
  }

  // The foreign key would refuse a group with studies too; checking in the delete itself
  // gives a clear answer instead of a database error.
  async deleteGroup(id: string): Promise<DeleteStudyGroupOutcome> {
    const members = this.db
      .select({ one: sql`1` })
      .from(draftStudies)
      .where(eq(draftStudies.groupId, id));
    const deleted = await this.db
      .delete(draftStudyGroups)
      .where(and(eq(draftStudyGroups.id, id), notExists(members)))
      .returning({ id: draftStudyGroups.id });
    if (deleted.length > 0) return 'deleted';

    const [existing] = await this.db
      .select({ id: draftStudyGroups.id })
      .from(draftStudyGroups)
      .where(eq(draftStudyGroups.id, id));
    return existing ? 'notEmpty' : 'notFound';
  }

  async reorderGroups(ids: readonly string[]): Promise<void> {
    await this.db.execute(sql`
      update app.draft_study_groups as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id
    `);
  }

  async find(id: string): Promise<DraftStudy | null> {
    const [row] = await this.db
      .select({
        id: draftStudies.id,
        groupId: draftStudies.groupId,
        title: draftStudies.title,
        description: draftStudies.description,
        pages: draftStudies.pages,
      })
      .from(draftStudies)
      .where(eq(draftStudies.id, id));
    return row ? { ...row, pages: parsePages(row.pages) } : null;
  }

  async listStudyIds(groupId: string): Promise<string[] | null> {
    const [group] = await this.db
      .select({ id: draftStudyGroups.id })
      .from(draftStudyGroups)
      .where(eq(draftStudyGroups.id, groupId));
    if (!group) return null;

    const rows = await this.db
      .select({ id: draftStudies.id })
      .from(draftStudies)
      .where(eq(draftStudies.groupId, groupId))
      .orderBy(asc(draftStudies.position), asc(draftStudies.id));
    return rows.map(({ id }) => id);
  }

  async create({ id, groupId, title, description, pages }: DraftStudy): Promise<boolean> {
    const rows = await this.db.execute(sql`
      insert into app.draft_studies (id, group_id, position, title, description, pages)
      select ${id}, ${groupId}, ${nextPositionIn(groupId)}, ${title}, ${description},
        ${JSON.stringify(pages)}::jsonb
      where ${groupExists(groupId)}
      returning id
    `);
    return IdRows.parse(rows).length > 0;
  }

  async update({
    id,
    groupId,
    title,
    description,
    pages,
  }: DraftStudy): Promise<UpdateStudyOutcome> {
    // The position changes only when the study moves to another group.
    const rows = await this.db.execute(sql`
      update app.draft_studies as study
      set
        position = case when study.group_id = ${groupId} then study.position
          else ${nextPositionIn(groupId)} end,
        group_id = ${groupId},
        title = ${title},
        description = ${description},
        pages = ${JSON.stringify(pages)}::jsonb
      where study.id = ${id} and ${groupExists(groupId)}
      returning study.id
    `);
    if (IdRows.parse(rows).length > 0) return 'updated';

    const [existing] = await this.db
      .select({ id: draftStudies.id })
      .from(draftStudies)
      .where(eq(draftStudies.id, id));
    return existing ? 'groupNotFound' : 'notFound';
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(draftStudies)
      .where(eq(draftStudies.id, id))
      .returning({ id: draftStudies.id });
    return rows.length > 0;
  }

  async reorderStudies(groupId: string, ids: readonly string[]): Promise<void> {
    await this.db.execute(sql`
      update app.draft_studies as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id and item.group_id = ${groupId}
    `);
  }
}
