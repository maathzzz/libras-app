import { z } from 'zod';

import { DailyGoal } from './profile';
import { StreakSummary } from './streak';

// Unlocking is decided by the BFF; the app only renders the status it receives.
export const LessonStatus = z.enum(['locked', 'available', 'completed']);
export type LessonStatus = z.infer<typeof LessonStatus>;

export const TrailLesson = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: LessonStatus,
});
export type TrailLesson = z.infer<typeof TrailLesson>;

export const TrailUnit = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(TrailLesson).min(1),
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

// Lessons finished today (in the learner's timezone) against the daily goal.
export const TodayProgress = z.object({
  completedLessons: z.number().int().nonnegative(),
  dailyGoal: DailyGoal,
});
export type TodayProgress = z.infer<typeof TodayProgress>;

// GET /v1/home
export const HomeResponse = z.object({
  trail: Trail,
  streak: StreakSummary,
  totalXp: z.number().int().nonnegative(),
  today: TodayProgress,
});
export type HomeResponse = z.infer<typeof HomeResponse>;
