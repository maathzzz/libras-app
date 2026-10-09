import { createMMKV } from 'react-native-mmkv';

// Non-sensitive data only; session tokens live in expo-secure-store.
export const storage = createMMKV({ id: 'libras-app' });
