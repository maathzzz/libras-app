import type { AdminTrail, AdminUnit } from '@libras/contracts';
import { asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { courses, exercises, lessons, units } from '../../../shared/infrastructure/db/schema';
import type {
  DeleteOutlineOutcome,
  DraftOutlineRepository,
  NewOutlineItem,
  OutlineLevel,
} from '../domain/DraftOutline';

// The three levels share their shape, so the writes are one SQL per operation with the
// level's table and parent column filled in. They are constants, never user input.
interface LevelTables {
  table: SQL;
  parent: { table: SQL; column: SQL } | null;
}

const levels: Record<OutlineLevel, LevelTables> = {
  trail: { table: sql`app.courses`, parent: null },
  unit: {
    table: sql`app.units`,
    parent: { table: sql`app.courses`, column: sql`course_id` },
  },
  lesson: {
    table: sql`app.lessons`,
    parent: { table: sql`app.units`, column: sql`unit_id` },
  },
};

const IdRows = z.array(z.object({ id: z.string() }));

// The lessons an item holds: learners' progress points to lessons.
const lessonsUnder: Record<OutlineLevel, (id: string) => SQL> = {
  trail: (id) =>
    sql`select lesson.id from app.lessons as lesson join app.units as unit on unit.id = lesson.unit_id where unit.course_id = ${id}`,
  unit: (id) => sql`select id from app.lessons where unit_id = ${id}`,
  lesson: (id) => sql`select ${id}::text`,
};
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
    const trailRows = await this.db
      .select({ id: courses.id, title: courses.title, visible: courses.visible })
      .from(courses)
      .orderBy(asc(courses.position), asc(courses.id));
    const unitRows = await this.db
      .select({
        id: units.id,
        trailId: units.courseId,
        title: units.title,
        visible: units.visible,
      })
      .from(units)
      .orderBy(asc(units.position), asc(units.id));
    const lessonRows = await this.db
      .select({
        id: lessons.id,
        unitId: lessons.unitId,
        title: lessons.title,
        visible: lessons.visible,
        exerciseCount: count(exercises.id),
      })
      .from(lessons)
      .leftJoin(exercises, eq(exercises.lessonId, lessons.id))
      .groupBy(lessons.id)
      .orderBy(asc(lessons.position), asc(lessons.id));

    // Each query is already in order, so pushing keeps every list in order.
    const unitsById = new Map<string, AdminUnit>();
    const unitsOfTrail = new Map<string, AdminUnit[]>();
    for (const { id, trailId, title, visible } of unitRows) {
      const unit: AdminUnit = { id, title, visible, lessons: [] };
      unitsById.set(id, unit);
      unitsOfTrail.set(trailId, [...(unitsOfTrail.get(trailId) ?? []), unit]);
    }
    for (const { id, unitId, title, visible, exerciseCount } of lessonRows) {
      unitsById.get(unitId)?.lessons.push({ id, title, visible, exerciseCount });
    }

    return trailRows.map(({ id, title, visible }) => ({
      id,
      title,
      visible,
      units: unitsOfTrail.get(id) ?? [],
    }));
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

  async setVisible(level: OutlineLevel, id: string, visible: boolean): Promise<boolean> {
    const rows = await this.db.execute(
      sql`update ${levels[level].table} set visible = ${visible} where id = ${id} returning id`,
    );
    return IdRows.parse(rows).length > 0;
  }

  // The foreign keys of the progress tables would refuse it too; checking in the delete
  // itself gives a clear answer instead of a database error.
  async delete(level: OutlineLevel, id: string): Promise<DeleteOutlineOutcome> {
    const under = lessonsUnder[level](id);
    const rows = await this.db.execute(sql`
      delete from ${levels[level].table}
      where id = ${id}
        and not exists (select 1 from app.user_lesson_progress where lesson_id in (${under}))
        and not exists (select 1 from app.lesson_sessions where lesson_id in (${under}))
      returning id
    `);
    if (IdRows.parse(rows).length > 0) return 'deleted';

    const table = levels[level].table;
    const found = await this.db.execute(sql`select id from ${table} where id = ${id}`);
    return IdRows.parse(found).length > 0 ? 'hasProgress' : 'notFound';
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
