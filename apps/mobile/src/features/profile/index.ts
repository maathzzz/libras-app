import type { UpdateProfileRequest } from '@libras/contracts';

import { useProfileStore } from './store/profileStore';

export { DailyGoalOptions } from './components/DailyGoalOptions';
export { DailyGoalScreen } from './components/DailyGoalScreen';
export { DeleteAccountLink } from './components/DeleteAccountLink';
export { ProfileGreeting } from './components/ProfileGreeting';
export { ProfileScreen } from './components/ProfileScreen';
export { dailyGoalLabel } from './content/dailyGoals';
export { useProfileSession } from './hooks/useProfileSession';

// Null until loaded once.
export const useProfile = () => useProfileStore((state) => state.profile);
export const loadProfile = () => useProfileStore.getState().load();
export const updateProfile = (update: UpdateProfileRequest) =>
  useProfileStore.getState().update(update);
