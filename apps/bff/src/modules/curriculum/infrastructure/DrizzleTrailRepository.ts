import { and, asc, count, eq, exists, inArray, type SQL } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { courses, exercises, lessons, units } from '../../../shared/infrastructure/db/schema';
import type { TrailOutline, TrailOutlineUnit, TrailRepository } from '../domain/TrailRepository';

// Learners only see what the CMS made visible. A lesson without exercises cannot be played,
// so it is left out too, as a unit left without lessons already is.
const visibleTrail = eq(courses.visible, true);

export class DrizzleTrailRepository implements TrailRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(trailId: string): Promise<TrailOutline | null> {
    return this.findOne(eq(courses.id, trailId));
  }

  // The id breaks a tie in position, so the same trail always comes first.
  async findFirst(): Promise<TrailOutline | null> {
    const first = this.db
      .select({ id: courses.id })
      .from(courses)
      .where(visibleTrail)
      .orderBy(asc(courses.position), asc(courses.id))
      .limit(1);
    return this.findOne(inArray(courses.id, first));
  }

  async findByLessonId(lessonId: string): Promise<TrailOutline | null> {
    const trailOfLesson = this.db
      .select({ id: units.courseId })
      .from(lessons)
      .innerJoin(units, eq(units.id, lessons.unitId))
      .where(eq(lessons.id, lessonId));
    return this.findOne(inArray(courses.id, trailOfLesson));
  }

  async count(): Promise<number> {
    const [row] = await this.db.select({ total: count() }).from(courses).where(visibleTrail);
    return row?.total ?? 0;
  }

  // One query for the whole trail. Left joins keep a trail without units and units
  // without lessons, which exist while the content is being planned. `which` must match
  // a single trail.
  private async findOne(which: SQL): Promise<TrailOutline | null> {
    const rows = await this.db
      .select({
        trail: { id: courses.id, title: courses.title, position: courses.position },
        unit: { id: units.id, title: units.title },
        lesson: { id: lessons.id, title: lessons.title },
      })
      .from(courses)
      .leftJoin(units, and(eq(units.courseId, courses.id), eq(units.visible, true)))
      .leftJoin(
        lessons,
        and(
          eq(lessons.unitId, units.id),
          eq(lessons.visible, true),
          exists(
            this.db
              .select({ id: exercises.id })
              .from(exercises)
              .where(eq(exercises.lessonId, lessons.id)),
          ),
        ),
      )
      .where(and(which, visibleTrail))
      .orderBy(asc(units.position), asc(lessons.position));

    const [first] = rows;
    if (!first) return null;

    // Rows arrive sorted by unit, so the Map keeps the units in that order.
    const unitsById = new Map<string, TrailOutlineUnit>();
    for (const { unit, lesson } of rows) {
      if (!unit) continue;
      const outlineUnit = unitsById.get(unit.id) ?? { ...unit, lessons: [] };
      unitsById.set(unit.id, outlineUnit);
      if (lesson) outlineUnit.lessons.push(lesson);
    }

    return { ...first.trail, units: [...unitsById.values()] };
  }
}
