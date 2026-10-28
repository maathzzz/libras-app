import { randomUUID } from 'node:crypto';

import type { Exercise } from '@libras/contracts';
import { sql } from 'drizzle-orm';

import type { DbExecutor } from '../client';
import { courses, exercises, lessons, profiles, units } from '../schema';

// Rows for integration tests. They are written inside withRollback, and ids start with
// `it-` so a leftover would be easy to spot next to the seed content.

// Only the Supabase Auth user, without a profile.
export async function insertAuthUser(tx: DbExecutor): Promise<string> {
  const id = randomUUID();
  // profiles references auth.users, which Drizzle does not manage here.
  await tx.execute(sql`insert into auth.users (id) values (${id})`);
  return id;
}

export async function insertUser(tx: DbExecutor): Promise<string> {
  const id = await insertAuthUser(tx);
  await tx.insert(profiles).values({ id, name: 'Teste de integração' });
  return id;
}

export async function insertCourse(tx: DbExecutor, id: string, position = 1000): Promise<void> {
  await tx.insert(courses).values({ id, title: `Trilha ${id}`, position });
}

// The shared database already has the seed trails. Inside the rolled-back transaction they
// move far behind, so a fixture at position 1 becomes the first trail.
export async function moveExistingTrailsBack(tx: DbExecutor): Promise<void> {
  await tx.update(courses).set({ position: sql`${courses.position} + 1000000` });
}

export async function insertUnit(
  tx: DbExecutor,
  { id, courseId, position }: { id: string; courseId: string; position: number },
): Promise<void> {
  await tx.insert(units).values({ id, courseId, title: `Módulo ${id}`, position });
}

export async function insertLesson(
  tx: DbExecutor,
  { id, unitId, position }: { id: string; unitId: string; position: number },
): Promise<void> {
  await tx.insert(lessons).values({ id, unitId, title: `Lição ${id}`, position });
}

export async function insertExercise(
  tx: DbExecutor,
  { lessonId, position, payload }: { lessonId: string; position: number; payload: Exercise },
): Promise<void> {
  await tx
    .insert(exercises)
    .values({ id: payload.id, lessonId, type: payload.type, position, payload });
}

// A course with one unit and one lesson, for tests that only need a lesson to exist.
export async function insertLessonFixture(tx: DbExecutor, prefix: string): Promise<string> {
  const courseId = `it-${prefix}-course`;
  const unitId = `it-${prefix}-unit`;
  const lessonId = `it-${prefix}-lesson`;
  await insertCourse(tx, courseId);
  await insertUnit(tx, { id: unitId, courseId, position: 1 });
  await insertLesson(tx, { id: lessonId, unitId, position: 1 });
  return lessonId;
}

export function signToWordExercise(id: string): Exercise {
  return {
    id,
    type: 'sign_to_word',
    images: [{ url: `https://placeholder.invalid/${id}.png`, alt: 'Mão formando um sinal' }],
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctOptionId: 'a',
  };
}
