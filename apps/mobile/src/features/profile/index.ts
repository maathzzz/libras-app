import type { UpdateProfileRequest } from '@libras/contracts';

import { useProfileStore } from './store/profileStore';

export { DailyGoalOptions } from './components/DailyGoalOptions';
export { DailyGoalScreen } from './components/DailyGoalScreen';
export { ProfileScreen } from './components/ProfileScreen';
export { dailyGoalLabel } from './content/dailyGoals';

// Null until loaded once.
export const useProfile = () => useProfileStore((state) => state.profile);
export const loadProfile = () => useProfileStore.getState().load();
export const updateProfile = (update: UpdateProfileRequest) =>
  useProfileStore.getState().update(update);
// A signed-out device must not keep showing the previous learner.
export const clearProfile = () => useProfileStore.getState().clear();
