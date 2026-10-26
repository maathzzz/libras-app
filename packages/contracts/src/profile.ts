import { z } from 'zod';

// Lessons per day the learner aims for. Only a personal target shown in the day's
// progress: the streak still grows with a single lesson per day.
export const DailyGoal = z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(8)]);
export type DailyGoal = z.infer<typeof DailyGoal>;

// Chosen in the onboarding; the BFF uses it to decide where the trail starts.
export const StartLevel = z.enum(['beginner', 'basic', 'conversational']);
export type StartLevel = z.infer<typeof StartLevel>;

// GET /v1/me — the profile is created on the first access.
export const ProfileResponse = z.object({
  name: z.string().trim().min(1).max(60),
  dailyGoal: DailyGoal,
  startLevel: StartLevel,
});
export type ProfileResponse = z.infer<typeof ProfileResponse>;

// PATCH /v1/me — answers with the updated ProfileResponse.
export const UpdateProfileRequest = ProfileResponse.partial().refine(
  (update) => Object.keys(update).length > 0,
  { message: 'at least one field must be updated' },
);
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

// DELETE /v1/me — deletes the account and all of its data. Answers 204 with no body and is
// idempotent: deleting an account that is already gone also answers 204.
