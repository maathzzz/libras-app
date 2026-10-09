import { z } from 'zod';

// Computed on read by the BFF: `at_risk` means the last lesson was yesterday.
export const StreakStatus = z.enum(['done_today', 'at_risk', 'broken']);
export type StreakStatus = z.infer<typeof StreakStatus>;

// `current` is the value to display, already 0 when the streak is broken.
export const StreakSummary = z.object({
  current: z.number().int().nonnegative(),
  status: StreakStatus,
});
export type StreakSummary = z.infer<typeof StreakSummary>;
