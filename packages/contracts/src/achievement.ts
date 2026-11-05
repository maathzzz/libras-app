import { z } from 'zod';

// What an achievement rewards. The app picks the badge's icon and color from it.
export const AchievementCategory = z.enum([
  'lessons',
  'perfect',
  'review',
  'xp',
  'streak',
  'modules',
]);
export type AchievementCategory = z.infer<typeof AchievementCategory>;

// The catalog lives in the BFF, which also decides when each one is unlocked.
export const Achievement = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: AchievementCategory,
});
export type Achievement = z.infer<typeof Achievement>;

// `current` stops at `target`, so the app can draw it as a fraction without clamping.
export const AchievementProgress = z
  .object({
    current: z.number().int().nonnegative(),
    target: z.number().int().positive(),
  })
  .refine((progress) => progress.current <= progress.target, {
    path: ['current'],
    message: 'current cannot be higher than target',
  });
export type AchievementProgress = z.infer<typeof AchievementProgress>;

export const AchievementStatus = Achievement.extend({
  progress: AchievementProgress,
  // Null while locked.
  unlockedAt: z.iso.datetime().nullable(),
});
export type AchievementStatus = z.infer<typeof AchievementStatus>;

// GET /v1/achievements — every achievement of the catalog, in display order.
export const AchievementsResponse = z.object({
  achievements: z.array(AchievementStatus),
});
export type AchievementsResponse = z.infer<typeof AchievementsResponse>;
