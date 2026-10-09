import { z } from 'zod';

import { Exercise, ExerciseAnswer } from './exercises';
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

// POST /v1/lessons/:lessonId/completion. On the wire, lessonId goes in the path and
// idempotencyKey in the Idempotency-Key header; both stay here because the app's offline
// queue stores the whole request to send it again later.
export const CompleteLessonRequest = z
  .object({
    lessonId: z.string().min(1),
    idempotencyKey: z.uuid(),
    answers: z.array(LessonAnswer).min(1),
  })
  .superRefine((request, ctx) => {
    const seen = new Set<string>();
    request.answers.forEach((answer, index) => {
      if (seen.has(answer.exerciseId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['answers', index, 'exerciseId'],
          message: 'each exercise can be answered only once',
        });
      }
      seen.add(answer.exerciseId);
    });
  });
export type CompleteLessonRequest = z.infer<typeof CompleteLessonRequest>;

// XP and streak are computed by the BFF after re-grading the answers.
export const CompleteLessonResponse = z.object({
  xpEarned: z.number().int().nonnegative(),
  streak: StreakSummary,
  streakIncreased: z.boolean(),
});
export type CompleteLessonResponse = z.infer<typeof CompleteLessonResponse>;
