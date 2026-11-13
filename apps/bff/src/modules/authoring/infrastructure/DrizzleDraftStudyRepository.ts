import { StudyPage, type AdminStudyGroup } from '@libras/contracts';
import { and, asc, eq, notExists, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { studies, studyGroups } from '../../../shared/infrastructure/db/schema';
import type {
  DeleteStudyGroupOutcome,
  DraftStudy,
  DraftStudyRepository,
  StoredStudy,
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
  sql`(select coalesce(max(position), 0) + 1 from app.studies where group_id = ${groupId})`;

const groupExists = (groupId: string) =>
  sql`exists (select 1 from app.study_groups where id = ${groupId})`;

// Content outside the contract is a content error, as in the curriculum module.
const parsePages = (pages: unknown) => z.array(StudyPage).parse(pages);

export class DrizzleDraftStudyRepository implements DraftStudyRepository {
  constructor(private readonly db: DbExecutor) {}

  async listGroups(): Promise<AdminStudyGroup[]> {
    const groups = await this.db
      .select({ id: studyGroups.id, title: studyGroups.title })
      .from(studyGroups)
      .orderBy(asc(studyGroups.position), asc(studyGroups.id));
    const studyRows = await this.db
      .select({
        id: studies.id,
        groupId: studies.groupId,
        title: studies.title,
        visible: studies.visible,
        description: studies.description,
        pageCount: sql<number>`jsonb_array_length(${studies.pages})::integer`,
      })
      .from(studies)
      .orderBy(asc(studies.position), asc(studies.id));

    return groups.map((group) => ({
      ...group,
      studies: studyRows
        .filter((study) => study.groupId === group.id)
        .map(({ id, title, visible, description, pageCount }) => ({
          id,
          title,
          visible,
          description,
          pageCount,
        })),
    }));
  }

  async listGroupIds(): Promise<string[]> {
    const rows = await this.db
      .select({ id: studyGroups.id })
      .from(studyGroups)
      .orderBy(asc(studyGroups.position), asc(studyGroups.id));
    return rows.map(({ id }) => id);
  }

  async createGroup({ id, title }: { id: string; title: string }): Promise<void> {
    await this.db.execute(sql`
      insert into app.study_groups (id, title, position)
      select ${id}, ${title}, coalesce(max(position), 0) + 1 from app.study_groups
    `);
  }

  async renameGroup(id: string, title: string): Promise<boolean> {
    const rows = await this.db
      .update(studyGroups)
      .set({ title })
      .where(eq(studyGroups.id, id))
      .returning({ id: studyGroups.id });
    return rows.length > 0;
  }

  // The foreign key would refuse a group with studies too; checking in the delete itself
  // gives a clear answer instead of a database error.
  async deleteGroup(id: string): Promise<DeleteStudyGroupOutcome> {
    const members = this.db
      .select({ one: sql`1` })
      .from(studies)
      .where(eq(studies.groupId, id));
    const deleted = await this.db
      .delete(studyGroups)
      .where(and(eq(studyGroups.id, id), notExists(members)))
      .returning({ id: studyGroups.id });
    if (deleted.length > 0) return 'deleted';

    const [existing] = await this.db
      .select({ id: studyGroups.id })
      .from(studyGroups)
      .where(eq(studyGroups.id, id));
    return existing ? 'notEmpty' : 'notFound';
  }

  async reorderGroups(ids: readonly string[]): Promise<void> {
    await this.db.execute(sql`
      update app.study_groups as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id
    `);
  }

  async find(id: string): Promise<StoredStudy | null> {
    const [row] = await this.db
      .select({
        id: studies.id,
        groupId: studies.groupId,
        title: studies.title,
        description: studies.description,
        visible: studies.visible,
        pages: studies.pages,
      })
      .from(studies)
      .where(eq(studies.id, id));
    return row ? { ...row, pages: parsePages(row.pages) } : null;
  }

  async listStudyIds(groupId: string): Promise<string[] | null> {
    const [group] = await this.db
      .select({ id: studyGroups.id })
      .from(studyGroups)
      .where(eq(studyGroups.id, groupId));
    if (!group) return null;

    const rows = await this.db
      .select({ id: studies.id })
      .from(studies)
      .where(eq(studies.groupId, groupId))
      .orderBy(asc(studies.position), asc(studies.id));
    return rows.map(({ id }) => id);
  }

  async create({ id, groupId, title, description, pages }: DraftStudy): Promise<boolean> {
    const rows = await this.db.execute(sql`
      insert into app.studies (id, group_id, position, title, description, pages)
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
      update app.studies as study
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
      .select({ id: studies.id })
      .from(studies)
      .where(eq(studies.id, id));
    return existing ? 'groupNotFound' : 'notFound';
  }

  async setVisible(id: string, visible: boolean): Promise<boolean> {
    const rows = await this.db
      .update(studies)
      .set({ visible })
      .where(eq(studies.id, id))
      .returning({ id: studies.id });
    return rows.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(studies)
      .where(eq(studies.id, id))
      .returning({ id: studies.id });
    return rows.length > 0;
  }

  async reorderStudies(groupId: string, ids: readonly string[]): Promise<void> {
    await this.db.execute(sql`
      update app.studies as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id and item.group_id = ${groupId}
    `);
  }
}
