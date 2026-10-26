import { LessonBundle } from '@libras/contracts';
import { asc, eq } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { exercises, lessons } from '../../../shared/infrastructure/db/schema';
import type { LessonRepository } from '../domain/LessonRepository';

export class DrizzleLessonRepository implements LessonRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(lessonId: string): Promise<LessonBundle | null> {
    const rows = await this.db
      .select({ id: lessons.id, title: lessons.title, payload: exercises.payload })
      .from(lessons)
      .leftJoin(exercises, eq(exercises.lessonId, lessons.id))
      .where(eq(lessons.id, lessonId))
      .orderBy(asc(exercises.position));

    const [first] = rows;
    if (!first) return null;

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
