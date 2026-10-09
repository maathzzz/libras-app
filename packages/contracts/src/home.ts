import { z } from 'zod';

import { StreakSummary } from './streak';

// Unlocking is decided by the BFF; the app only renders the status it receives.
export const UnitStatus = z.enum(['done', 'current', 'locked']);
export type UnitStatus = z.infer<typeof UnitStatus>;

export const TrailUnit = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    status: UnitStatus,
    totalLessons: z.number().int().positive(),
    completedLessons: z.number().int().nonnegative(),
  })
  .refine((unit) => unit.completedLessons <= unit.totalLessons, {
    path: ['completedLessons'],
    message: 'completedLessons cannot exceed totalLessons',
  });
export type TrailUnit = z.infer<typeof TrailUnit>;

export const Trail = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  position: z.number().int().positive(),
  totalTrails: z.number().int().positive(),
  units: z.array(TrailUnit).min(1),
});
export type Trail = z.infer<typeof Trail>;

export const NextLesson = z.object({
  lessonId: z.string().min(1),
  unitTitle: z.string().min(1),
  lessonNumber: z.number().int().positive(),
  newSignsCount: z.number().int().nonnegative(),
  xpReward: z.number().int().nonnegative(),
});
export type NextLesson = z.infer<typeof NextLesson>;

// Lessons that count towards today's goal. The streak only needs one lesson per day.
export const DailyGoal = z.object({
  target: z.number().int().positive(),
  completedToday: z.number().int().nonnegative(),
});
export type DailyGoal = z.infer<typeof DailyGoal>;

// GET /v1/home
export const HomeResponse = z.object({
  streak: StreakSummary,
  totalXp: z.number().int().nonnegative(),
  dailyGoal: DailyGoal,
  trail: Trail,
  // null once every lesson of the trail is completed.
  nextLesson: NextLesson.nullable(),
});
export type HomeResponse = z.infer<typeof HomeResponse>;
