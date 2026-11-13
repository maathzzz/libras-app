import { Exercise } from '@libras/contracts';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  exercises,
  exerciseSigns,
  lessons,
} from '../../../shared/infrastructure/db/schema';
import {
  exerciseFields,
  type DraftExerciseRepository,
  type DraftLessonExercises,
} from '../domain/DraftExercise';

const IdRows = z.array(z.object({ id: z.string() }));

const textArray = (values: readonly string[]) =>
  sql`array[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;

// Rows of draft_exercise_signs: the signs an exercise shows are its options.
const signRows = (exercise: Exercise) =>
  exerciseFields(exercise).signIds.map((signId) => ({ exerciseId: exercise.id, signId }));

export class DrizzleDraftExerciseRepository implements DraftExerciseRepository {
  constructor(private readonly db: DbExecutor) {}

  async listByLesson(lessonId: string): Promise<DraftLessonExercises | null> {
    const [lesson] = await this.db
      .select({ id: lessons.id, title: lessons.title })
      .from(lessons)
      .where(eq(lessons.id, lessonId));
    if (!lesson) return null;

    const rows = await this.db
      .select({ payload: exercises.payload })
      .from(exercises)
      .where(eq(exercises.lessonId, lessonId))
      .orderBy(asc(exercises.position), asc(exercises.id));
    // Content outside the contract is a content error, as in the curriculum module.
    return { lesson, exercises: rows.map(({ payload }) => Exercise.parse(payload)) };
  }

  async create(lessonId: string, exercise: Exercise): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      // The position is computed in the same statement, after the last exercise.
      const inserted = await tx.execute(sql`
        insert into app.exercises (id, lesson_id, type, position, payload)
        select ${exercise.id}, ${lessonId}, ${exercise.type}, next.position,
          ${JSON.stringify(exercise)}::jsonb
        from (
          select coalesce(max(position), 0) + 1 as position
          from app.exercises where lesson_id = ${lessonId}
        ) as next
        where exists (select 1 from app.lessons where id = ${lessonId})
        returning id
      `);
      if (IdRows.parse(inserted).length === 0) return false;

      await tx.insert(exerciseSigns).values(signRows(exercise));
      return true;
    });
  }

  async update(exercise: Exercise): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const updated = await tx
        .update(exercises)
        .set({ type: exercise.type, payload: exercise })
        .where(eq(exercises.id, exercise.id))
        .returning({ id: exercises.id });
      if (updated.length === 0) return false;

      await tx.delete(exerciseSigns).where(eq(exerciseSigns.exerciseId, exercise.id));
      await tx.insert(exerciseSigns).values(signRows(exercise));
      return true;
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(exercises)
      .where(eq(exercises.id, id))
      .returning({ id: exercises.id });
    return deleted.length > 0;
  }

  async reorder(lessonId: string, ids: readonly string[]): Promise<void> {
    await this.db.execute(sql`
      update app.exercises as item
      set position = ordered.position::integer
      from unnest(${textArray(ids)}) with ordinality as ordered (id, position)
      where item.id = ordered.id and item.lesson_id = ${lessonId}
    `);
  }
}
