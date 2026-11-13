import type { AdminSign } from '@libras/contracts';
import { and, asc, count, eq, inArray, notExists, sql } from 'drizzle-orm';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import { draftExerciseSigns, draftSigns } from '../../../shared/infrastructure/db/schema';
import type {
  DeleteSignOutcome,
  DraftSign,
  DraftSignRepository,
} from '../domain/DraftSignRepository';

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

  async update({ id, label, imageUrls, alt, description }: DraftSign): Promise<boolean> {
    const rows = await this.db
      .update(draftSigns)
      .set({ label, imagePaths: imageUrls, alt, description })
      .where(eq(draftSigns.id, id))
      .returning({ id: draftSigns.id });
    return rows.length > 0;
  }

  // The foreign key would refuse a sign in use too; checking in the delete itself gives a
  // clear answer instead of a database error.
  async delete(id: string): Promise<DeleteSignOutcome> {
    const usage = this.db
      .select({ one: sql`1` })
      .from(draftExerciseSigns)
      .where(eq(draftExerciseSigns.signId, id));
    const deleted = await this.db
      .delete(draftSigns)
      .where(and(eq(draftSigns.id, id), notExists(usage)))
      .returning({ id: draftSigns.id });
    if (deleted.length > 0) return 'deleted';

    const [existing] = await this.db
      .select({ id: draftSigns.id })
      .from(draftSigns)
      .where(eq(draftSigns.id, id));
    return existing ? 'inUse' : 'notFound';
  }
}
