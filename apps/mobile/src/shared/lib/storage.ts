import { createMMKV } from 'react-native-mmkv';

// Non-sensitive data only; the session lives in the encrypted storage (secureStorage.ts).
export const storage = createMMKV({ id: 'libras-app' });
