import { Exercise, StudyPage, type AdminSign } from '@libras/contracts';
import { z } from 'zod';
import { and, asc, count, eq, inArray, notExists, sql, type SQL } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { exercises, exerciseSigns, signs, studies } from '../../../shared/infrastructure/db/schema';
import { withSign } from '../domain/DraftExercise';
import { withSignInPages } from '../domain/DraftStudy';
import type {
  DeleteSignOutcome,
  DraftSign,
  DraftSignRepository,
} from '../domain/DraftSignRepository';

// Studies have no join table: a sign block names its sign in `signId`, so a study shows a sign
// when its pages contain a block with that id (jsonb containment).
const pagesShowing = (pages: SQL, signId: SQL | string) => sql`${pages} @> jsonb_build_array(
  jsonb_build_object('blocks', jsonb_build_array(jsonb_build_object('signId', ${signId}::text)))
)`;

const studiesShowing = (signId: SQL | string) =>
  sql`select 1 from app.studies as study where ${pagesShowing(sql`study.pages`, signId)}`;

export class DrizzleDraftSignRepository implements DraftSignRepository {
  constructor(private readonly db: DbExecutor) {}

  async list(): Promise<AdminSign[]> {
    const rows = await this.db
      .select({
        id: signs.id,
        label: signs.label,
        imageUrls: signs.imagePaths,
        alt: signs.alt,
        description: signs.description,
        exerciseCount: count(exerciseSigns.exerciseId),
        studyCount: sql<number>`(select count(*) from (${studiesShowing(sql`${signs.id}`)}) as showing)::integer`,
      })
      .from(signs)
      .leftJoin(exerciseSigns, eq(exerciseSigns.signId, signs.id))
      .groupBy(signs.id)
      .orderBy(asc(signs.label), asc(signs.id));
    return rows;
  }

  async findByIds(ids: readonly string[]): Promise<DraftSign[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        id: signs.id,
        label: signs.label,
        imageUrls: signs.imagePaths,
        alt: signs.alt,
        description: signs.description,
      })
      .from(signs)
      .where(inArray(signs.id, [...ids]));
  }

  async create({ id, label, imageUrls, alt, description }: DraftSign): Promise<void> {
    await this.db.insert(signs).values({ id, label, imagePaths: imageUrls, alt, description });
  }

  async update(sign: DraftSign): Promise<boolean> {
    const { id, label, imageUrls, alt, description } = sign;
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(signs)
        .set({ label, imagePaths: imageUrls, alt, description })
        .where(eq(signs.id, id))
        .returning({ id: signs.id });
      if (rows.length === 0) return false;

      // Exercises carry their own copy of the sign, as the app receives it.
      const showing = await tx
        .select({ id: exercises.id, payload: exercises.payload })
        .from(exercises)
        .innerJoin(exerciseSigns, eq(exerciseSigns.exerciseId, exercises.id))
        .where(eq(exerciseSigns.signId, id));
      for (const exercise of showing) {
        await tx
          .update(exercises)
          .set({ payload: withSign(Exercise.parse(exercise.payload), sign) })
          .where(eq(exercises.id, exercise.id));
      }

      // So do the sign blocks of studies.
      const showingStudies = await tx
        .select({ id: studies.id, pages: studies.pages })
        .from(studies)
        .where(pagesShowing(sql`${studies.pages}`, id));
      for (const study of showingStudies) {
        const pages = withSignInPages(z.array(StudyPage).parse(study.pages), sign);
        await tx.update(studies).set({ pages }).where(eq(studies.id, study.id));
      }
      return true;
    });
  }

  // The foreign key would refuse a sign shown by an exercise too; checking in the delete
  // itself gives a clear answer instead of a database error. Studies have no foreign key,
  // so this check is what keeps their signs.
  async delete(id: string): Promise<DeleteSignOutcome> {
    const usage = this.db
      .select({ one: sql`1` })
      .from(exerciseSigns)
      .where(eq(exerciseSigns.signId, id));
    const deleted = await this.db
      .delete(signs)
      .where(and(eq(signs.id, id), notExists(usage), sql`not exists (${studiesShowing(id)})`))
      .returning({ id: signs.id });
    if (deleted.length > 0) return 'deleted';

    const [existing] = await this.db.select({ id: signs.id }).from(signs).where(eq(signs.id, id));
    return existing ? 'inUse' : 'notFound';
  }
}
