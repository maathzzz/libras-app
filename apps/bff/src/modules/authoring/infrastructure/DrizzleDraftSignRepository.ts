import { Exercise, StudyPage, type AdminSign } from '@libras/contracts';
import { z } from 'zod';
import { and, asc, count, eq, inArray, notExists, sql, type SQL } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  draftExercises,
  draftExerciseSigns,
  draftSigns,
  draftStudies,
} from '../../../shared/infrastructure/db/schema';
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
  sql`select 1 from app.draft_studies as study where ${pagesShowing(sql`study.pages`, signId)}`;

export class DrizzleDraftSignRepository implements DraftSignRepository {
  constructor(private readonly db: DbExecutor) {}

  async list(): Promise<AdminSign[]> {
    const rows = await this.db
      .select({
        id: draftSigns.id,
        label: draftSigns.label,
        imageUrls: draftSigns.imagePaths,
        alt: draftSigns.alt,
        description: draftSigns.description,
        exerciseCount: count(draftExerciseSigns.exerciseId),
        studyCount: sql<number>`(select count(*) from (${studiesShowing(sql`${draftSigns.id}`)}) as showing)::integer`,
      })
      .from(draftSigns)
      .leftJoin(draftExerciseSigns, eq(draftExerciseSigns.signId, draftSigns.id))
      .groupBy(draftSigns.id)
      .orderBy(asc(draftSigns.label), asc(draftSigns.id));
    return rows;
  }

  async findByIds(ids: readonly string[]): Promise<DraftSign[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        id: draftSigns.id,
        label: draftSigns.label,
        imageUrls: draftSigns.imagePaths,
        alt: draftSigns.alt,
        description: draftSigns.description,
      })
      .from(draftSigns)
      .where(inArray(draftSigns.id, [...ids]));
  }

  async create({ id, label, imageUrls, alt, description }: DraftSign): Promise<void> {
    await this.db.insert(draftSigns).values({ id, label, imagePaths: imageUrls, alt, description });
  }

  async update(sign: DraftSign): Promise<boolean> {
    const { id, label, imageUrls, alt, description } = sign;
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(draftSigns)
        .set({ label, imagePaths: imageUrls, alt, description })
        .where(eq(draftSigns.id, id))
        .returning({ id: draftSigns.id });
      if (rows.length === 0) return false;

      // Exercises carry their own copy of the sign, as the app receives it.
      const showing = await tx
        .select({ id: draftExercises.id, payload: draftExercises.payload })
        .from(draftExercises)
        .innerJoin(draftExerciseSigns, eq(draftExerciseSigns.exerciseId, draftExercises.id))
        .where(eq(draftExerciseSigns.signId, id));
      for (const exercise of showing) {
        await tx
          .update(draftExercises)
          .set({ payload: withSign(Exercise.parse(exercise.payload), sign) })
          .where(eq(draftExercises.id, exercise.id));
      }

      // So do the sign blocks of studies.
      const studies = await tx
        .select({ id: draftStudies.id, pages: draftStudies.pages })
        .from(draftStudies)
        .where(pagesShowing(sql`${draftStudies.pages}`, id));
      for (const study of studies) {
        const pages = withSignInPages(z.array(StudyPage).parse(study.pages), sign);
        await tx.update(draftStudies).set({ pages }).where(eq(draftStudies.id, study.id));
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
      .from(draftExerciseSigns)
      .where(eq(draftExerciseSigns.signId, id));
    const deleted = await this.db
      .delete(draftSigns)
      .where(and(eq(draftSigns.id, id), notExists(usage), sql`not exists (${studiesShowing(id)})`))
      .returning({ id: draftSigns.id });
    if (deleted.length > 0) return 'deleted';

    const [existing] = await this.db
      .select({ id: draftSigns.id })
      .from(draftSigns)
      .where(eq(draftSigns.id, id));
    return existing ? 'inUse' : 'notFound';
  }
}
