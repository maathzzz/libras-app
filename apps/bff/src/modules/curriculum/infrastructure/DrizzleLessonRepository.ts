import { LessonBundle } from '@libras/contracts';
import { and, asc, eq } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { courses, exercises, lessons, units } from '../../../shared/infrastructure/db/schema';
import type { LessonRepository } from '../domain/LessonRepository';

export class DrizzleLessonRepository implements LessonRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(lessonId: string): Promise<LessonBundle | null> {
    const rows = await this.db
      .select({ id: lessons.id, title: lessons.title, payload: exercises.payload })
      .from(lessons)
      .innerJoin(units, eq(units.id, lessons.unitId))
      .innerJoin(courses, eq(courses.id, units.courseId))
      .leftJoin(exercises, eq(exercises.lessonId, lessons.id))
      // Hidden content, or content inside a hidden unit or trail, does not exist for learners.
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(lessons.visible, true),
          eq(units.visible, true),
          eq(courses.visible, true),
        ),
      )
      .orderBy(asc(exercises.position));

    const [first] = rows;
    // A lesson without exercises cannot be played, so learners do not get it either.
    if (!first || first.payload === null) return null;

    // The payload column is only typed, not checked: content written by hand or by an
    // older seed must still match the contract before it reaches the app or the grader.
    // A mismatch is a content bug, so it throws instead of returning an error.
    return LessonBundle.parse({
      id: first.id,
      title: first.title,
      exercises: rows.flatMap((row) => (row.payload === null ? [] : [row.payload])),
    });
  }
}
