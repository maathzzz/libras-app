import { useHomeStore } from './store/homeStore';

export { HomeScreen } from './components/HomeScreen';
export { daysLabel, formatXp } from './components/homeView';

// For other features: a finished lesson changes the streak and XP shown on the home.
export const reloadHome = () => useHomeStore.getState().load();

// Null until the home has loaded once.
export const useHomeTotalXp = () => useHomeStore((state) => state.home?.totalXp ?? null);
export const useHomeStreakDays = () =>
  useHomeStore((state) => state.home?.streak.current ?? null);
