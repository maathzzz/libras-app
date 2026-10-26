import type { DailyGoal, StartLevel } from '@libras/contracts';

export interface Profile {
  // Same id as the Supabase Auth user.
  userId: string;
  name: string;
  dailyGoal: DailyGoal;
  startLevel: StartLevel;
}

// A field left undefined keeps its value.
export type ProfileChanges = {
  [Field in Exclude<keyof Profile, 'userId'>]?: Profile[Field] | undefined;
};

const maxNameLength = 60;
const fallbackName = 'Aprendiz';

// The profile created on the first access. Sign-up does not send the name to Supabase Auth
// (the onboarding sets it right after), so the start of the email stands in for it.
export function defaultProfileFor(userId: string, email: string | null): Profile {
  const emailName = email?.split('@')[0]?.trim().slice(0, maxNameLength).trim();
  return {
    userId,
    name: emailName || fallbackName,
    // The same defaults as the app.profiles columns.
    dailyGoal: 1,
    startLevel: 'beginner',
  };
}
