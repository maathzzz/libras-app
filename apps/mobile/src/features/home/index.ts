import { useHomeStore } from './store/homeStore';

export { HomeScreen } from './components/HomeScreen';
export { daysLabel, formatXp, trailLessonCounts, unitsLegend } from './components/homeView';
export { ModuleScreen } from './components/ModuleScreen';
export { TrailSegments } from './components/TrailSegments';

// For other features: a finished lesson changes the streak and XP shown on the home.
export const reloadHome = () => useHomeStore.getState().load();

// Null until the home has loaded once.
export const useHome = () => useHomeStore((state) => state.home);
export const useHomeTotalXp = () => useHomeStore((state) => state.home?.totalXp ?? null);
export const useHomeStreakDays = () => useHomeStore((state) => state.home?.streak.current ?? null);
