import { z } from 'zod';

import { SignImageSequence } from './signImage';

interface WithOptions {
  options: { id: string }[];
  correctOptionId: string;
}

function ensureCorrectOptionExists(exercise: WithOptions, ctx: z.RefinementCtx): void {
  if (exercise.options.some((option) => option.id === exercise.correctOptionId)) return;

  ctx.addIssue({
    code: 'custom',
    path: ['correctOptionId'],
    message: 'correctOptionId must match one of the options',
  });
}

// correctOptionId is sent to the app for instant local feedback; the BFF always re-grades.
export const SignToWordExercise = z
  .object({
    id: z.string().min(1),
    type: z.literal('sign_to_word'),
    images: SignImageSequence,
    options: z
      .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
      .min(2),
    correctOptionId: z.string().min(1),
  })
  .superRefine(ensureCorrectOptionExists);
export type SignToWordExercise = z.infer<typeof SignToWordExercise>;

export const WordToSignExercise = z
  .object({
    id: z.string().min(1),
    type: z.literal('word_to_sign'),
    word: z.string().min(1),
    options: z
      .array(z.object({ id: z.string().min(1), images: SignImageSequence }))
      .min(2),
    correctOptionId: z.string().min(1),
  })
  .superRefine(ensureCorrectOptionExists);
export type WordToSignExercise = z.infer<typeof WordToSignExercise>;

export const Exercise = z.discriminatedUnion('type', [SignToWordExercise, WordToSignExercise]);
export type Exercise = z.infer<typeof Exercise>;

export type ExerciseType = Exercise['type'];
