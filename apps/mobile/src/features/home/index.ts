import { useHomeStore } from './store/homeStore';

export { HomeScreen } from './components/HomeScreen';

// For other features: a finished lesson changes the streak and XP shown on the home.
export const reloadHome = () => useHomeStore.getState().load();
