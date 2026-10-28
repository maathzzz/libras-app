import type { LessonBundle } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CatalogTrail } from '../domain/TrailCatalog';
import { InMemoryLessonCatalog } from '../testing/InMemoryLessonCatalog';
import { InMemoryProgressStore } from '../testing/InMemoryProgressStore';
import { InMemoryTrailCatalog } from '../testing/InMemoryTrailCatalog';
import { GetLesson } from './GetLesson';

const userId = 'user-1';

const lesson = (id: string): LessonBundle => ({
  id,
  title: `Lição ${id}`,
  exercises: [
    {
      id: `${id}-ex`,
      type: 'sign_to_word',
      images: [{ url: `https://example.com/${id}.png`, alt: 'Mão formando um sinal' }],
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      correctOptionId: 'a',
    },
  ],
});

const trail: CatalogTrail = {
  id: 'trail',
  title: 'Trilha',
  position: 1,
  units: [
    { id: 'u1', title: 'Módulo 1', lessons: [{ id: 'l1', title: 'Lição l1' }] },
    { id: 'u2', title: 'Módulo 2', lessons: [{ id: 'l2', title: 'Lição l2' }] },
  ],
};

describe('GetLesson', () => {
  let store: InMemoryProgressStore;
  let getLesson: GetLesson;

  beforeEach(() => {
    store = new InMemoryProgressStore();
    getLesson = new GetLesson(
      new InMemoryLessonCatalog([lesson('l1'), lesson('l2')]),
      new InMemoryTrailCatalog([trail]),
      store,
    );
  });

  it('returns the first lesson to a new learner', async () => {
    expect(await getLesson.execute({ userId, lessonId: 'l1' })).toEqual({
      ok: true,
      value: lesson('l1'),
    });
  });

  it('refuses a locked lesson with LESSON_LOCKED', async () => {
    const result = await getLesson.execute({ userId, lessonId: 'l2' });

    expect(result.ok ? null : result.error.code).toBe('LESSON_LOCKED');
  });

  it('returns a lesson unlocked by the last one of the previous unit', async () => {
    store.seedCompletedLessons(userId, ['l1']);

    expect((await getLesson.execute({ userId, lessonId: 'l2' })).ok).toBe(true);
  });

  it('returns a completed lesson so it can be redone', async () => {
    store.seedCompletedLessons(userId, ['l1', 'l2']);

    expect((await getLesson.execute({ userId, lessonId: 'l1' })).ok).toBe(true);
  });

  it('answers LESSON_NOT_FOUND for an unknown lesson', async () => {
    const result = await getLesson.execute({ userId, lessonId: 'missing' });

    expect(result.ok ? null : result.error.code).toBe('LESSON_NOT_FOUND');
  });
});
