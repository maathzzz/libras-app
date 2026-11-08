import type { AdminTrail, AdminUnit } from '@libras/contracts';
import { asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  draftCourses,
  draftExercises,
  draftLessons,
  draftUnits,
} from '../../../shared/infrastructure/db/schema';
import type { DraftOutlineRepository, NewOutlineItem, OutlineLevel } from '../domain/DraftOutline';

// The three levels share their shape, so the writes are one SQL per operation with the
// level's table and parent column filled in. They are constants, never user input.
interface LevelTables {
  table: SQL;
  parent: { table: SQL; column: SQL } | null;
}

const levels: Record<OutlineLevel, LevelTables> = {
  trail: { table: sql`app.draft_courses`, parent: null },
  unit: {
    table: sql`app.draft_units`,
    parent: { table: sql`app.draft_courses`, column: sql`course_id` },
  },
  lesson: {
    table: sql`app.draft_lessons`,
    parent: { table: sql`app.draft_units`, column: sql`unit_id` },
  },
};

const IdRows = z.array(z.object({ id: z.string() }));
const ExistsRows = z.array(z.object({ found: z.boolean() }));

const textArray = (values: readonly string[]) =>
  sql`array[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;

// Restricts a query on the level's table to one list: the children of `parentId`.
function inList({ parent }: LevelTables, parentId: string | null, alias?: SQL): SQL {
  if (!parent) return sql`true`;
  const column = alias ? sql`${alias}.${parent.column}` : parent.column;
  return sql`${column} = ${parentId}`;
}

export class DrizzleDraftOutlineRepository implements DraftOutlineRepository {
  constructor(private readonly db: DbExecutor) {}

  async listTrails(): Promise<AdminTrail[]> {
    const trails = await this.db
      .select({ id: draftCourses.id, title: draftCourses.title })
      .from(draftCourses)
      .orderBy(asc(draftCourses.position), asc(draftCourses.id));
    const units = await this.db
      .select({ id: draftUnits.id, trailId: draftUnits.courseId, title: draftUnits.title })
      .from(draftUnits)
      .orderBy(asc(draftUnits.position), asc(draftUnits.id));
    const lessons = await this.db
      .select({
        id: draftLessons.id,
        unitId: draftLessons.unitId,
        title: draftLessons.title,
        exerciseCount: count(draftExercises.id),
      })
      .from(draftLessons)
      .leftJoin(draftExercises, eq(draftExercises.lessonId, draftLessons.id))
      .groupBy(draftLessons.id)
      .orderBy(asc(draftLessons.position), asc(draftLessons.id));

    // Each query is already in order, so pushing keeps every list in order.
    const unitsById = new Map<string, AdminUnit>();
    const unitsOfTrail = new Map<string, AdminUnit[]>();
    for (const { id, trailId, title } of units) {
      const unit: AdminUnit = { id, title, lessons: [] };
      unitsById.set(id, unit);
      unitsOfTrail.set(trailId, [...(unitsOfTrail.get(trailId) ?? []), unit]);
    }
    for (const { id, unitId, title, exerciseCount } of lessons) {
      unitsById.get(unitId)?.lessons.push({ id, title, exerciseCount });
    }

    return trails.map(({ id, title }) => ({ id, title, units: unitsOfTrail.get(id) ?? [] }));
  }

  async listIds(level: OutlineLevel, parentId: string | null): Promise<string[] | null> {
    const tables = levels[level];
    if (tables.parent && !(await this.exists(tables.parent.table, parentId))) return null;

    const rows = await this.db.execute(
      sql`select id from ${tables.table} where ${inList(tables, parentId)} order by position, id`,
    );
    return IdRows.parse(rows).map(({ id }) => id);
  }

  async create(level: OutlineLevel, { id, parentId, title }: NewOutlineItem): Promise<boolean> {
    const tables = levels[level];
    const { parent } = tables;

    // The position is computed in the same statement, after the last item of the list. The
    // parent check is outside the aggregate, which always returns one row.
    const rows = await this.db.execute(sql`
      insert into ${tables.table} (id, ${parent ? sql`${parent.column}, ` : sql``}title, position)
      select ${id}, ${parent ? sql`${parentId}, ` : sql``}${title}, next.position
      from (
        select coalesce(max(position), 0) + 1 as position
        from ${tables.table}
        where ${inList(tables, parentId)}
      ) as next
      where ${parent ? sql`exists (select 1 from ${parent.table} where id = ${parentId})` : sql`true`}
      returning id
    `);
    return IdRows.parse(rows).length > 0;
  }

  async rename(level: OutlineLevel, id: string, title: string): Promise<boolean> {
    const rows = await this.db.execute(
      sql`update ${levels[level].table} set title = ${title} where id = ${id} returning id`,
    );
    return IdRows.parse(rows).length > 0;
  }

  async delete(level: OutlineLevel, id: string): Promise<boolean> {
    const rows = await this.db.execute(
      sql`delete from ${levels[level].table} where id = ${id} returning id`,
    );
    return IdRows.parse(rows).length > 0;
  }

  async reorder(level: OutlineLevel, parentId: string | null, ids: readonly string[]) {
    const tables = levels[level];
    await this.db.execute(sql`
      update ${tables.table} as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id and ${inList(tables, parentId, sql`item`)}
    `);
  }

  private async exists(table: SQL, id: string | null): Promise<boolean> {
    const rows = await this.db.execute(
      sql`select exists (select 1 from ${table} where id = ${id}) as found`,
    );
    return ExistsRows.parse(rows)[0]?.found ?? false;
  }
}
