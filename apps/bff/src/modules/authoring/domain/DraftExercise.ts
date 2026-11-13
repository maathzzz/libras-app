import {
  Exercise,
  type AdminExercise,
  type AdminExerciseType,
  type SaveExerciseRequest,
  type SignImageSequence,
} from '@libras/contracts';

import { DomainError } from '../../../shared/domain/DomainError';
import type { DraftSign } from './DraftSignRepository';

// Fails to compile if the CMS edits a type the app does not know.
type KnownTypes = AdminExerciseType extends Exercise['type'] ? true : never;
export const cmsTypesAreKnown: KnownTypes = true;

// The images of a sign as an exercise carries them. A sign with movement says which frame
// each picture is, for screen readers.
export function imagesOf(sign: DraftSign): SignImageSequence {
  const frames = sign.imageUrls.length;
  return sign.imageUrls.map((url, index) => ({
    url,
    alt: frames > 1 ? `${sign.alt} (imagem ${index + 1} de ${frames})` : sign.alt,
  }));
}

// Option ids are the ids of the signs they show (as in the seed), so the payload alone
// says which signs an exercise uses.
export function exerciseFields(exercise: Exercise): AdminExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    signIds: exercise.options.map((option) => option.id),
    correctSignId: exercise.correctOptionId,
  };
}

// The exercise the app receives, with its own copy of the label and the images of each
// sign. `signs` has every sign of `fields.signIds`.
export function buildExercise(
  id: string,
  fields: SaveExerciseRequest,
  signs: ReadonlyMap<string, DraftSign>,
): Exercise {
  const signOf = (signId: string): DraftSign => {
    const sign = signs.get(signId);
    if (!sign) throw new Error(`Sign ${signId} missing while building exercise ${id}`);
    return sign;
  };
  const correct = signOf(fields.correctSignId);

  if (fields.type === 'sign_to_word') {
    return Exercise.parse({
      id,
      type: 'sign_to_word',
      images: imagesOf(correct),
      options: fields.signIds.map((signId) => ({ id: signId, label: signOf(signId).label })),
      correctOptionId: correct.id,
    });
  }
  return Exercise.parse({
    id,
    type: 'word_to_sign',
    word: correct.label,
    options: fields.signIds.map((signId) => ({ id: signId, images: imagesOf(signOf(signId)) })),
    correctOptionId: correct.id,
  });
}

// The exercise with its copy of `sign` brought up to date, after the sign was edited.
export function withSign(exercise: Exercise, sign: DraftSign): Exercise {
  const isCorrect = exercise.correctOptionId === sign.id;

  if (exercise.type === 'sign_to_word') {
    return Exercise.parse({
      ...exercise,
      images: isCorrect ? imagesOf(sign) : exercise.images,
      options: exercise.options.map((option) =>
        option.id === sign.id ? { ...option, label: sign.label } : option,
      ),
    });
  }
  return Exercise.parse({
    ...exercise,
    word: isCorrect ? sign.label : exercise.word,
    options: exercise.options.map((option) =>
      option.id === sign.id ? { ...option, images: imagesOf(sign) } : option,
    ),
  });
}

// Two options with the same label cannot be told apart: in sign_to_word the learner reads
// two equal answers, in word_to_sign the word would fit two signs.
export function ambiguousOptions(signs: readonly DraftSign[]): DomainError | null {
  const labels = signs.map((sign) => sign.label.toLocaleLowerCase('pt-BR'));
  if (new Set(labels).size === labels.length) return null;
  return new DomainError('AMBIGUOUS_OPTIONS', 'Two options have the same label');
}

export const exerciseNotFound = (id: string) =>
  new DomainError('EXERCISE_NOT_FOUND', `Draft exercise ${id} not found`);

export const lessonNotFound = (id: string) =>
  new DomainError('LESSON_NOT_FOUND', `Draft lesson ${id} not found`);

export interface DraftLessonExercises {
  lesson: { id: string; title: string };
  exercises: Exercise[];
}

export interface DraftExerciseRepository {
  // The lesson and its exercises in order. Null when the lesson does not exist.
  listByLesson(lessonId: string): Promise<DraftLessonExercises | null>;
  // Adds the exercise at the end of the lesson, with the signs it shows. False when the
  // lesson does not exist.
  create(lessonId: string, exercise: Exercise): Promise<boolean>;
  // Replaces the payload (and type) and the signs it shows. False when it does not exist.
  update(exercise: Exercise): Promise<boolean>;
  // False when it does not exist.
  delete(id: string): Promise<boolean>;
  // Positions 1..n in the order of `ids`, which are exactly the exercises of the lesson.
  reorder(lessonId: string, ids: readonly string[]): Promise<void>;
}
