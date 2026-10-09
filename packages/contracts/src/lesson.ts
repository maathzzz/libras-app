import { z } from 'zod';

import { Exercise } from './exercises';

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
