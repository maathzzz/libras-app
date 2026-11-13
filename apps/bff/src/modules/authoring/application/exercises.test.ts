import type { AdminSign } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { SequentialIdGenerator } from '../../../shared/application/SequentialIdGenerator';
import { buildExercise, withSign } from '../domain/CmsExercise';
import type { CmsSign } from '../domain/CmsSignRepository';
import { InMemoryCmsExercises } from '../testing/InMemoryCmsExercises';
import { InMemoryCmsSigns } from '../testing/InMemoryCmsSigns';
import { CreateExercise } from './CreateExercise';
import { DeleteExercise } from './DeleteExercise';
import { GetLessonExercises } from './GetLessonExercises';
import { ReorderExercises } from './ReorderExercises';
import { UpdateExercise } from './UpdateExercise';

const sign = (id: string, label: string, frames = 1): AdminSign => ({
  id,
  label,
  imageUrls: Array.from({ length: frames }, (_, index) => `https://x.test/${id}-${index + 1}.webp`),
  alt: `Mão do ${label}`,
  description: null,
  exerciseCount: 0,
  studyCount: 0,
});

const cmsSigns = [sign('a', 'A'), sign('b', 'B'), sign('oi', 'Oi', 2), sign('a2', 'a')];
const byId = new Map<string, CmsSign>(cmsSigns.map((item) => [item.id, item]));

let exercises: InMemoryCmsExercises;
let signs: InMemoryCmsSigns;

beforeEach(() => {
  signs = new InMemoryCmsSigns(cmsSigns);
  exercises = new InMemoryCmsExercises([
    {
      lesson: { id: 'vogais', title: 'Vogais' },
      exercises: [
        buildExercise(
          'ex-1',
          { type: 'sign_to_word', signIds: ['a', 'b'], correctSignId: 'a' },
          byId,
        ),
        buildExercise(
          'ex-2',
          { type: 'word_to_sign', signIds: ['b', 'a'], correctSignId: 'b' },
          byId,
        ),
      ],
    },
  ]);
});

const listed = async () => {
  const result = await new GetLessonExercises(exercises).execute({ lessonId: 'vogais' });
  if (!result.ok) throw new Error(result.error.code);
  return result.value.exercises;
};

describe('buildExercise', () => {
  it('copies the label and the frames of each sign into the payload', () => {
    const recognize = buildExercise(
      'x',
      { type: 'sign_to_word', signIds: ['a', 'oi'], correctSignId: 'oi' },
      byId,
    );
    expect(recognize).toMatchObject({
      images: [
        { url: 'https://x.test/oi-1.webp', alt: 'Mão do Oi (imagem 1 de 2)' },
        { url: 'https://x.test/oi-2.webp', alt: 'Mão do Oi (imagem 2 de 2)' },
      ],
      options: [
        { id: 'a', label: 'A' },
        { id: 'oi', label: 'Oi' },
      ],
      correctOptionId: 'oi',
    });

    const produce = buildExercise(
      'y',
      { type: 'word_to_sign', signIds: ['oi', 'a'], correctSignId: 'a' },
      byId,
    );
    expect(produce).toMatchObject({ word: 'A', correctOptionId: 'a' });
    expect(produce.type === 'word_to_sign' && produce.options[1]?.images).toEqual([
      { url: 'https://x.test/a-1.webp', alt: 'Mão do A' },
    ]);
  });
});

describe('withSign', () => {
  it('updates the copy of an edited sign where the exercise shows it', () => {
    const edited: CmsSign = { ...sign('a', 'Á'), imageUrls: ['https://x.test/a-v2.webp'] };
    const [recognize, produce] = [
      buildExercise('x', { type: 'sign_to_word', signIds: ['a', 'b'], correctSignId: 'a' }, byId),
      buildExercise('y', { type: 'word_to_sign', signIds: ['b', 'a'], correctSignId: 'b' }, byId),
    ];

    expect(withSign(recognize, edited)).toMatchObject({
      images: [{ url: 'https://x.test/a-v2.webp' }],
      options: [{ id: 'a', label: 'Á' }, { label: 'B' }],
    });
    const updated = withSign(produce, edited);
    expect(updated).toMatchObject({ word: 'B' });
    expect(updated.type === 'word_to_sign' && updated.options[1]?.images[0]?.url).toBe(
      'https://x.test/a-v2.webp',
    );
  });
});

describe('exercise use cases', () => {
  it('lists the exercises of a lesson as the CMS edits them', async () => {
    expect(await listed()).toEqual([
      { id: 'ex-1', type: 'sign_to_word', signIds: ['a', 'b'], correctSignId: 'a' },
      { id: 'ex-2', type: 'word_to_sign', signIds: ['b', 'a'], correctSignId: 'b' },
    ]);
  });

  it('creates an exercise at the end of the lesson', async () => {
    const create = new CreateExercise(exercises, signs, new SequentialIdGenerator());
    const result = await create.execute({
      lessonId: 'vogais',
      type: 'word_to_sign',
      signIds: ['oi', 'a', 'b'],
      correctSignId: 'oi',
    });

    expect(result).toEqual({ ok: true, value: { id: 'exercise-1' } });
    expect((await listed()).map((exercise) => exercise.id)).toEqual(['ex-1', 'ex-2', 'exercise-1']);
  });

  it('refuses unknown signs, options with the same label and a missing lesson', async () => {
    const create = new CreateExercise(exercises, signs, new SequentialIdGenerator());
    const fields = { type: 'sign_to_word', correctSignId: 'a' } as const;

    const unknown = await create.execute({ lessonId: 'vogais', ...fields, signIds: ['a', 'zz'] });
    const ambiguous = await create.execute({ lessonId: 'vogais', ...fields, signIds: ['a', 'a2'] });
    const noLesson = await create.execute({ lessonId: 'nope', ...fields, signIds: ['a', 'b'] });

    expect(unknown.ok || unknown.error.code).toBe('UNKNOWN_SIGN');
    expect(ambiguous.ok || ambiguous.error.code).toBe('AMBIGUOUS_OPTIONS');
    expect(noLesson.ok || noLesson.error.code).toBe('LESSON_NOT_FOUND');
    expect(await listed()).toHaveLength(2);
  });

  it('replaces an exercise, also its type', async () => {
    const result = await new UpdateExercise(exercises, signs).execute({
      id: 'ex-1',
      type: 'word_to_sign',
      signIds: ['b', 'oi'],
      correctSignId: 'oi',
    });
    const missing = await new UpdateExercise(exercises, signs).execute({
      id: 'nope',
      type: 'word_to_sign',
      signIds: ['b', 'oi'],
      correctSignId: 'oi',
    });

    expect(result.ok).toBe(true);
    expect(missing.ok || missing.error.code).toBe('EXERCISE_NOT_FOUND');
    expect((await listed())[0]).toEqual({
      id: 'ex-1',
      type: 'word_to_sign',
      signIds: ['b', 'oi'],
      correctSignId: 'oi',
    });
  });

  it('deletes and reorders exercises', async () => {
    const reorder = new ReorderExercises(exercises);
    expect((await reorder.execute({ lessonId: 'vogais', ids: ['ex-2', 'ex-1'] })).ok).toBe(true);
    expect((await listed()).map((exercise) => exercise.id)).toEqual(['ex-2', 'ex-1']);

    const stale = await reorder.execute({ lessonId: 'vogais', ids: ['ex-1'] });
    expect(stale.ok || stale.error.code).toBe('INVALID_ORDER');

    expect((await new DeleteExercise(exercises).execute({ id: 'ex-2' })).ok).toBe(true);
    const missing = await new DeleteExercise(exercises).execute({ id: 'ex-2' });
    expect(missing.ok || missing.error.code).toBe('EXERCISE_NOT_FOUND');
    expect((await listed()).map((exercise) => exercise.id)).toEqual(['ex-1']);
  });
});
