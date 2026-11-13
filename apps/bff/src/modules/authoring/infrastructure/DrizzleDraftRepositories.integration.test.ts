import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  draftCourses,
  draftExercises,
  draftExerciseSigns,
  draftLessons,
  draftSigns,
  draftUnits,
} from '../../../shared/infrastructure/db/schema';
import { signToWordExercise } from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { buildExercise } from '../domain/DraftExercise';
import type { DraftSign } from '../domain/DraftSignRepository';
import { DrizzleDraftExerciseRepository } from './DrizzleDraftExerciseRepository';
import { DrizzleDraftOutlineRepository } from './DrizzleDraftOutlineRepository';
import { DrizzleDraftSignRepository } from './DrizzleDraftSignRepository';

const inRollback = useTestDatabase();

// The shared database has the seed's draft; inside the rolled-back transaction it moves
// far behind, so the fixtures below come first.
async function moveDraftTrailsBack(tx: DbExecutor) {
  await tx.update(draftCourses).set({ position: sql`${draftCourses.position} + 1000000` });
}

async function insertDraftOutline(tx: DbExecutor) {
  await moveDraftTrailsBack(tx);
  await tx.insert(draftCourses).values({ id: 'it-trail', title: 'Trilha IT', position: 1 });
  await tx.insert(draftUnits).values([
    { id: 'it-unit-1', courseId: 'it-trail', title: 'Módulo 1', position: 1 },
    { id: 'it-unit-2', courseId: 'it-trail', title: 'Módulo 2', position: 2 },
  ]);
  await tx.insert(draftLessons).values([
    { id: 'it-lesson-2', unitId: 'it-unit-1', title: 'Lição 2', position: 2 },
    { id: 'it-lesson-1', unitId: 'it-unit-1', title: 'Lição 1', position: 1 },
  ]);
}

async function insertDraftSign(tx: DbExecutor, id: string, label: string) {
  await tx.insert(draftSigns).values({
    id,
    label,
    imagePaths: [`https://x.test/${id}.webp`],
    alt: 'Mão de teste',
  });
}

async function insertExerciseShowing(tx: DbExecutor, signId: string) {
  const payload = signToWordExercise('it-exercise');
  await tx
    .insert(draftExercises)
    .values({ id: payload.id, lessonId: 'it-lesson-1', type: payload.type, position: 1, payload });
  await tx.insert(draftExerciseSigns).values({ exerciseId: 'it-exercise', signId });
}

describe('DrizzleDraftOutlineRepository', () => {
  it(
    'lists trails, units and lessons in order, with exercise counts',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      await insertDraftSign(tx, 'it-sign', 'Z IT');
      await insertExerciseShowing(tx, 'it-sign');

      const [trail] = await new DrizzleDraftOutlineRepository(tx).listTrails();

      expect(trail).toEqual({
        id: 'it-trail',
        title: 'Trilha IT',
        units: [
          {
            id: 'it-unit-1',
            title: 'Módulo 1',
            lessons: [
              { id: 'it-lesson-1', title: 'Lição 1', exerciseCount: 1 },
              { id: 'it-lesson-2', title: 'Lição 2', exerciseCount: 0 },
            ],
          },
          { id: 'it-unit-2', title: 'Módulo 2', lessons: [] },
        ],
      });
    }),
  );

  it(
    'creates at the end of the list and refuses a missing parent',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      const outline = new DrizzleDraftOutlineRepository(tx);

      const created = await outline.create('lesson', {
        id: 'it-lesson-3',
        parentId: 'it-unit-1',
        title: 'Lição 3',
      });
      const orphan = await outline.create('lesson', {
        id: 'it-orphan',
        parentId: 'it-missing',
        title: 'Órfã',
      });

      expect([created, orphan]).toEqual([true, false]);
      expect(await outline.listIds('lesson', 'it-unit-1')).toEqual([
        'it-lesson-1',
        'it-lesson-2',
        'it-lesson-3',
      ]);
      expect(await outline.listIds('lesson', 'it-missing')).toBeNull();
    }),
  );

  it(
    'reorders one list without touching the others',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      const outline = new DrizzleDraftOutlineRepository(tx);

      await outline.reorder('unit', 'it-trail', ['it-unit-2', 'it-unit-1']);

      expect(await outline.listIds('unit', 'it-trail')).toEqual(['it-unit-2', 'it-unit-1']);
      expect(await outline.listIds('lesson', 'it-unit-1')).toEqual(['it-lesson-1', 'it-lesson-2']);
    }),
  );

  it(
    'renames and deletes with everything below',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      const outline = new DrizzleDraftOutlineRepository(tx);

      expect(await outline.rename('unit', 'it-unit-2', 'Renomeado')).toBe(true);
      expect(await outline.delete('trail', 'it-trail')).toBe(true);
      expect(await outline.delete('trail', 'it-trail')).toBe(false);

      expect(await outline.listIds('lesson', 'it-unit-1')).toBeNull();
    }),
  );
});

describe('DrizzleDraftSignRepository', () => {
  it(
    'creates, updates and lists signs with how many exercises show them',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      const signs = new DrizzleDraftSignRepository(tx);
      await signs.create({
        id: 'it-sign',
        label: 'IT sinal',
        imageUrls: ['https://x.test/1.webp'],
        alt: 'Mão',
        description: null,
      });
      await insertExerciseShowing(tx, 'it-sign');

      const updated = await signs.update({
        id: 'it-sign',
        label: 'IT sinal',
        imageUrls: ['https://x.test/1.webp', 'https://x.test/2.webp'],
        alt: 'Mão aberta',
        description: 'Abre a mão.',
      });

      expect(updated).toBe(true);
      expect((await signs.list()).find((sign) => sign.id === 'it-sign')).toEqual({
        id: 'it-sign',
        label: 'IT sinal',
        imageUrls: ['https://x.test/1.webp', 'https://x.test/2.webp'],
        alt: 'Mão aberta',
        description: 'Abre a mão.',
        exerciseCount: 1,
      });
    }),
  );

  it(
    'deletes only a sign no exercise shows',
    inRollback(async (tx) => {
      await insertDraftOutline(tx);
      await insertDraftSign(tx, 'it-used', 'IT usado');
      await insertDraftSign(tx, 'it-free', 'IT livre');
      await insertExerciseShowing(tx, 'it-used');
      const signs = new DrizzleDraftSignRepository(tx);

      expect(await signs.delete('it-used')).toBe('inUse');
      expect(await signs.delete('it-free')).toBe('deleted');
      expect(await signs.delete('it-free')).toBe('notFound');
    }),
  );
});

describe('DrizzleDraftExerciseRepository', () => {
  const signA: DraftSign = {
    id: 'it-a',
    label: 'IT A',
    imageUrls: ['https://x.test/it-a.webp'],
    alt: 'Mão de teste',
    description: null,
  };
  const signB: DraftSign = {
    ...signA,
    id: 'it-b',
    label: 'IT B',
    imageUrls: ['https://x.test/it-b.webp'],
  };
  const signs = new Map([signA, signB].map((sign) => [sign.id, sign]));

  async function prepare(tx: DbExecutor) {
    await insertDraftOutline(tx);
    await insertDraftSign(tx, 'it-a', 'IT A');
    await insertDraftSign(tx, 'it-b', 'IT B');
  }

  const recognize = (id: string) =>
    buildExercise(
      id,
      { type: 'sign_to_word', signIds: ['it-a', 'it-b'], correctSignId: 'it-a' },
      signs,
    );

  it(
    'creates exercises at the end of a lesson with the signs they show',
    inRollback(async (tx) => {
      await prepare(tx);
      const exercises = new DrizzleDraftExerciseRepository(tx);

      expect(await exercises.create('it-lesson-1', recognize('it-ex-1'))).toBe(true);
      expect(await exercises.create('it-lesson-1', recognize('it-ex-2'))).toBe(true);
      expect(await exercises.create('it-missing', recognize('it-ex-3'))).toBe(false);

      const found = await exercises.listByLesson('it-lesson-1');
      expect(found?.lesson).toEqual({ id: 'it-lesson-1', title: 'Lição 1' });
      expect(found?.exercises.map((exercise) => exercise.id)).toEqual(['it-ex-1', 'it-ex-2']);
      expect(await exercises.listByLesson('it-missing')).toBeNull();

      const shown = await tx
        .select({ signId: draftExerciseSigns.signId })
        .from(draftExerciseSigns)
        .where(sql`${draftExerciseSigns.exerciseId} = 'it-ex-1'`);
      expect(shown.map(({ signId }) => signId).sort()).toEqual(['it-a', 'it-b']);
    }),
  );

  it(
    'replaces, reorders and deletes exercises',
    inRollback(async (tx) => {
      await prepare(tx);
      await insertDraftSign(tx, 'it-c', 'IT C');
      const exercises = new DrizzleDraftExerciseRepository(tx);
      await exercises.create('it-lesson-1', recognize('it-ex-1'));
      await exercises.create('it-lesson-1', recognize('it-ex-2'));

      const signC: DraftSign = { ...signA, id: 'it-c', label: 'IT C' };
      const produce = buildExercise(
        'it-ex-1',
        { type: 'word_to_sign', signIds: ['it-c', 'it-a'], correctSignId: 'it-c' },
        new Map([...signs, ['it-c', signC]]),
      );
      expect(await exercises.update(produce)).toBe(true);
      await exercises.reorder('it-lesson-1', ['it-ex-2', 'it-ex-1']);
      expect(await exercises.delete('it-ex-2')).toBe(true);
      expect(await exercises.delete('it-ex-2')).toBe(false);

      const found = await exercises.listByLesson('it-lesson-1');
      expect(found?.exercises).toEqual([produce]);
      const signRepo = new DrizzleDraftSignRepository(tx);
      expect(await signRepo.delete('it-b')).toBe('deleted');
      expect(await signRepo.delete('it-c')).toBe('inUse');
    }),
  );

  it(
    'brings the copy of an edited sign up to date in the exercises that show it',
    inRollback(async (tx) => {
      await prepare(tx);
      const exercises = new DrizzleDraftExerciseRepository(tx);
      await exercises.create('it-lesson-1', recognize('it-ex-1'));

      await new DrizzleDraftSignRepository(tx).update({
        ...signA,
        label: 'IT Á',
        imageUrls: ['https://x.test/it-a-v2.webp'],
      });

      const [exercise] = (await exercises.listByLesson('it-lesson-1'))?.exercises ?? [];
      expect(exercise).toMatchObject({
        images: [{ url: 'https://x.test/it-a-v2.webp' }],
        options: [
          { id: 'it-a', label: 'IT Á' },
          { id: 'it-b', label: 'IT B' },
        ],
      });
    }),
  );
});
