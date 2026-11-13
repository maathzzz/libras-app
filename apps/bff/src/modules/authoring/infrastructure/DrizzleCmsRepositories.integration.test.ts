import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { DbExecutor } from '../../../shared/infrastructure/db/client';
import {
  courses,
  exercises,
  exerciseSigns,
  lessons,
  signs,
  studies,
  studyGroups,
  units,
  userLessonProgress,
} from '../../../shared/infrastructure/db/schema';
import { insertUser, signToWordExercise } from '../../../shared/infrastructure/db/testing/fixtures';
import { useTestDatabase } from '../../../shared/infrastructure/db/testing/testDatabase';
import { buildExercise } from '../domain/CmsExercise';
import { signBlock } from '../domain/CmsStudy';
import type { CmsSign } from '../domain/CmsSignRepository';
import { DrizzleCmsExerciseRepository } from './DrizzleCmsExerciseRepository';
import { DrizzleCmsOutlineRepository } from './DrizzleCmsOutlineRepository';
import { DrizzleCmsSignRepository } from './DrizzleCmsSignRepository';

const inRollback = useTestDatabase();

// The shared database has the seed's content; inside the rolled-back transaction it moves
// far behind, so the fixtures below come first.
async function moveCmsTrailsBack(tx: DbExecutor) {
  await tx.update(courses).set({ position: sql`${courses.position} + 1000000` });
}

async function insertCmsOutline(tx: DbExecutor) {
  await moveCmsTrailsBack(tx);
  await tx.insert(courses).values({ id: 'it-trail', title: 'Trilha IT', position: 1 });
  await tx.insert(units).values([
    { id: 'it-unit-1', courseId: 'it-trail', title: 'Módulo 1', position: 1 },
    { id: 'it-unit-2', courseId: 'it-trail', title: 'Módulo 2', position: 2 },
  ]);
  await tx.insert(lessons).values([
    { id: 'it-lesson-2', unitId: 'it-unit-1', title: 'Lição 2', position: 2 },
    { id: 'it-lesson-1', unitId: 'it-unit-1', title: 'Lição 1', position: 1 },
  ]);
}

async function insertCmsSign(tx: DbExecutor, id: string, label: string) {
  await tx.insert(signs).values({
    id,
    label,
    imagePaths: [`https://x.test/${id}.webp`],
    alt: 'Mão de teste',
  });
}

async function insertExerciseShowing(tx: DbExecutor, signId: string) {
  const payload = signToWordExercise('it-exercise');
  await tx
    .insert(exercises)
    .values({ id: payload.id, lessonId: 'it-lesson-1', type: payload.type, position: 1, payload });
  await tx.insert(exerciseSigns).values({ exerciseId: 'it-exercise', signId });
}

describe('DrizzleCmsOutlineRepository', () => {
  it(
    'lists trails, units and lessons in order, with exercise counts',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      await insertCmsSign(tx, 'it-sign', 'Z IT');
      await insertExerciseShowing(tx, 'it-sign');

      const [trail] = await new DrizzleCmsOutlineRepository(tx).listTrails();

      expect(trail).toEqual({
        id: 'it-trail',
        title: 'Trilha IT',
        visible: false,
        units: [
          {
            id: 'it-unit-1',
            title: 'Módulo 1',
            visible: false,
            lessons: [
              { id: 'it-lesson-1', title: 'Lição 1', visible: false, exerciseCount: 1 },
              { id: 'it-lesson-2', title: 'Lição 2', visible: false, exerciseCount: 0 },
            ],
          },
          { id: 'it-unit-2', title: 'Módulo 2', visible: false, lessons: [] },
        ],
      });
    }),
  );

  it(
    'creates at the end of the list and refuses a missing parent',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      const outline = new DrizzleCmsOutlineRepository(tx);

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
      await insertCmsOutline(tx);
      const outline = new DrizzleCmsOutlineRepository(tx);

      await outline.reorder('unit', 'it-trail', ['it-unit-2', 'it-unit-1']);

      expect(await outline.listIds('unit', 'it-trail')).toEqual(['it-unit-2', 'it-unit-1']);
      expect(await outline.listIds('lesson', 'it-unit-1')).toEqual(['it-lesson-1', 'it-lesson-2']);
    }),
  );

  it(
    'renames and deletes with everything below',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      const outline = new DrizzleCmsOutlineRepository(tx);

      expect(await outline.rename('unit', 'it-unit-2', 'Renomeado')).toBe(true);
      expect(await outline.delete('trail', 'it-trail')).toBe('deleted');
      expect(await outline.delete('trail', 'it-trail')).toBe('notFound');

      expect(await outline.listIds('lesson', 'it-unit-1')).toBeNull();
    }),
  );
});

describe('DrizzleCmsOutlineRepository visibility and progress', () => {
  it(
    'shows and hides an item',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      const outline = new DrizzleCmsOutlineRepository(tx);

      expect(await outline.setVisible('unit', 'it-unit-2', true)).toBe(true);
      expect(await outline.setVisible('lesson', 'it-missing', true)).toBe(false);

      const trail = (await outline.listTrails()).find((item) => item.id === 'it-trail');
      expect(trail?.units.map((unit) => unit.visible)).toEqual([false, true]);
    }),
  );

  it(
    'keeps a lesson that a learner did, with its unit and trail',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      const userId = await insertUser(tx);
      await tx
        .insert(userLessonProgress)
        .values({ userId, lessonId: 'it-lesson-1', lastCompletedAt: new Date() });
      const outline = new DrizzleCmsOutlineRepository(tx);

      expect(await outline.delete('trail', 'it-trail')).toBe('hasProgress');
      expect(await outline.delete('unit', 'it-unit-1')).toBe('hasProgress');
      expect(await outline.delete('lesson', 'it-lesson-1')).toBe('hasProgress');
      expect(await outline.delete('lesson', 'it-lesson-2')).toBe('deleted');
      expect(await outline.delete('lesson', 'it-lesson-2')).toBe('notFound');
    }),
  );
});

describe('DrizzleCmsSignRepository', () => {
  it(
    'creates, updates and lists signs with how many exercises show them',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      const signs = new DrizzleCmsSignRepository(tx);
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
        studyCount: 0,
      });
    }),
  );

  it(
    'deletes only a sign no exercise shows',
    inRollback(async (tx) => {
      await insertCmsOutline(tx);
      await insertCmsSign(tx, 'it-used', 'IT usado');
      await insertCmsSign(tx, 'it-free', 'IT livre');
      await insertExerciseShowing(tx, 'it-used');
      const signs = new DrizzleCmsSignRepository(tx);

      expect(await signs.delete('it-used')).toBe('inUse');
      expect(await signs.delete('it-free')).toBe('deleted');
      expect(await signs.delete('it-free')).toBe('notFound');
    }),
  );
});

describe('DrizzleCmsSignRepository with studies', () => {
  const sign: CmsSign = {
    id: 'it-sign',
    label: 'IT sinal',
    imageUrls: ['https://x.test/it-sign.webp'],
    alt: 'Mão de teste',
    description: null,
  };

  async function insertStudyShowing(tx: DbExecutor) {
    await tx.insert(studyGroups).values({ id: 'it-group', title: 'Grupo IT', position: 1 });
    await tx.insert(studies).values({
      id: 'it-study',
      groupId: 'it-group',
      position: 1,
      title: 'Estudo IT',
      description: 'Descrição IT.',
      pages: [
        {
          id: 'it-page',
          title: 'Página IT',
          blocks: [{ type: 'text', body: 'Oi.' }, signBlock(sign)],
        },
      ],
    });
  }

  it(
    'counts the studies that show a sign and keeps it from being deleted',
    inRollback(async (tx) => {
      const signs = new DrizzleCmsSignRepository(tx);
      await signs.create(sign);
      await insertStudyShowing(tx);

      const listed = (await signs.list()).find((item) => item.id === 'it-sign');
      expect(listed).toMatchObject({ exerciseCount: 0, studyCount: 1 });
      expect(await signs.delete('it-sign')).toBe('inUse');
    }),
  );

  it(
    'brings the copy of an edited sign up to date in the studies that show it',
    inRollback(async (tx) => {
      const signs = new DrizzleCmsSignRepository(tx);
      await signs.create(sign);
      await insertStudyShowing(tx);

      await signs.update({ ...sign, label: 'IT editado', description: 'Abre a mão.' });

      const [study] = await tx
        .select()
        .from(studies)
        .where(sql`id = 'it-study'`);
      expect(study?.pages[0]?.blocks).toEqual([
        { type: 'text', body: 'Oi.' },
        signBlock({ ...sign, label: 'IT editado', description: 'Abre a mão.' }),
      ]);
    }),
  );
});

describe('DrizzleCmsExerciseRepository', () => {
  const signA: CmsSign = {
    id: 'it-a',
    label: 'IT A',
    imageUrls: ['https://x.test/it-a.webp'],
    alt: 'Mão de teste',
    description: null,
  };
  const signB: CmsSign = {
    ...signA,
    id: 'it-b',
    label: 'IT B',
    imageUrls: ['https://x.test/it-b.webp'],
  };
  const signs = new Map([signA, signB].map((sign) => [sign.id, sign]));

  async function prepare(tx: DbExecutor) {
    await insertCmsOutline(tx);
    await insertCmsSign(tx, 'it-a', 'IT A');
    await insertCmsSign(tx, 'it-b', 'IT B');
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
      const exercises = new DrizzleCmsExerciseRepository(tx);

      expect(await exercises.create('it-lesson-1', recognize('it-ex-1'))).toBe(true);
      expect(await exercises.create('it-lesson-1', recognize('it-ex-2'))).toBe(true);
      expect(await exercises.create('it-missing', recognize('it-ex-3'))).toBe(false);

      const found = await exercises.listByLesson('it-lesson-1');
      expect(found?.lesson).toEqual({ id: 'it-lesson-1', title: 'Lição 1' });
      expect(found?.exercises.map((exercise) => exercise.id)).toEqual(['it-ex-1', 'it-ex-2']);
      expect(await exercises.listByLesson('it-missing')).toBeNull();

      const shown = await tx
        .select({ signId: exerciseSigns.signId })
        .from(exerciseSigns)
        .where(sql`${exerciseSigns.exerciseId} = 'it-ex-1'`);
      expect(shown.map(({ signId }) => signId).sort()).toEqual(['it-a', 'it-b']);
    }),
  );

  it(
    'replaces, reorders and deletes exercises',
    inRollback(async (tx) => {
      await prepare(tx);
      await insertCmsSign(tx, 'it-c', 'IT C');
      const exercises = new DrizzleCmsExerciseRepository(tx);
      await exercises.create('it-lesson-1', recognize('it-ex-1'));
      await exercises.create('it-lesson-1', recognize('it-ex-2'));

      const signC: CmsSign = { ...signA, id: 'it-c', label: 'IT C' };
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
      const signRepo = new DrizzleCmsSignRepository(tx);
      expect(await signRepo.delete('it-b')).toBe('deleted');
      expect(await signRepo.delete('it-c')).toBe('inUse');
    }),
  );

  it(
    'brings the copy of an edited sign up to date in the exercises that show it',
    inRollback(async (tx) => {
      await prepare(tx);
      const exercises = new DrizzleCmsExerciseRepository(tx);
      await exercises.create('it-lesson-1', recognize('it-ex-1'));

      await new DrizzleCmsSignRepository(tx).update({
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
