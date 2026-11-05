import { useAchievementsStore } from './store/achievementsStore';

export { AchievementsSection } from './components/AchievementsSection';
export { UnlockedAchievementsCard } from './components/UnlockedAchievementsCard';

// For other features: a finished lesson may unlock achievements or move their progress.
export const reloadAchievements = () => useAchievementsStore.getState().load();
// On sign out, so the next account never sees the previous one's achievements.
export const clearAchievements = () => useAchievementsStore.getState().clear();
