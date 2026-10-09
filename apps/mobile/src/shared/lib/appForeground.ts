import { AppState } from 'react-native';

// Calls the listener whenever the app comes back to the foreground. Returns the unsubscribe.
export function onAppForeground(listener: () => void): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') listener();
  });
  return () => subscription.remove();
}
