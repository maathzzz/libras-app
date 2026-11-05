import { z } from 'zod';

import { Achievement } from './achievement';
import { Exercise, ExerciseAnswer } from './exercises';
import { IdempotencyKey } from './idempotencyKey';
import { StreakSummary } from './streak';

// GET /v1/lessons/:lessonId
export const LessonBundle = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    exercises: z.array(Exercise).min(1),
  })
  .superRefine((lesson, ctx) => {
    // Answers are keyed by exercise id, so a repeated id would overwrite another answer.
    const seen = new Set<string>();
    lesson.exercises.forEach((exercise, index) => {
      if (seen.has(exercise.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['exercises', index, 'id'],
          message: 'exercise ids must be unique within a lesson',
        });
      }
      seen.add(exercise.id);
    });
  });
export type LessonBundle = z.infer<typeof LessonBundle>;

export const LessonAnswer = z.object({
  exerciseId: z.string().min(1),
  answer: ExerciseAnswer,
});
export type LessonAnswer = z.infer<typeof LessonAnswer>;

const completionFields = {
  answers: z.array(LessonAnswer).min(1),
  // The device's local date (YYYY-MM-DD) when the lesson ended: the streak's "day".
  // Taken once and kept in the offline queue, so a late retry still counts that day.
  localDate: z.iso.date(),
};

function rejectRepeatedAnswers({ answers }: { answers: LessonAnswer[] }, ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  answers.forEach((answer, index) => {
    if (seen.has(answer.exerciseId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['answers', index, 'exerciseId'],
        message: 'each exercise can be answered only once',
      });
    }
    seen.add(answer.exerciseId);
  });
}

// Body of POST /v1/lessons/:lessonId/sessions, sent with the Idempotency-Key header.
export const CompleteLessonBody = z.object(completionFields).superRefine(rejectRepeatedAnswers);
export type CompleteLessonBody = z.infer<typeof CompleteLessonBody>;

// The whole completion as the app keeps it. On the wire, lessonId goes in the path and
// idempotencyKey in the Idempotency-Key header; both stay here because the app's offline
// queue stores the whole request to send it again later.
export const CompleteLessonRequest = z
  .object({
    lessonId: z.string().min(1),
    idempotencyKey: IdempotencyKey,
    ...completionFields,
  })
  .superRefine(rejectRepeatedAnswers);
export type CompleteLessonRequest = z.infer<typeof CompleteLessonRequest>;

// XP, streak and achievements are computed by the BFF after re-grading the answers.
export const CompleteLessonResponse = z.object({
  xpEarned: z.number().int().nonnegative(),
  streak: StreakSummary,
  streakIncreased: z.boolean(),
  // Achievements this lesson unlocked; empty most of the time. Defaults to empty because
  // sessions saved before achievements existed are replayed without it.
  achievementsUnlocked: z.array(Achievement).default([]),
});
export type CompleteLessonResponse = z.infer<typeof CompleteLessonResponse>;
