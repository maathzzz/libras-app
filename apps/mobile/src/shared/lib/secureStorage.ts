import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createMMKV, type MMKV } from 'react-native-mmkv';

// The Supabase session (tokens and user) can pass the size the secure store accepts per value,
// so it lives in an encrypted MMKV and only the encryption key goes to the secure store.
const encryptionKeyName = 'secureStorage.encryptionKey';
const storageId = 'libras-app.secure';

let opening: Promise<MMKV> | null = null;

// 16 random bytes in hex: 32 ASCII characters, the key size of AES-256.
function createEncryptionKey(): string {
  return Array.from(Crypto.getRandomBytes(16), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

async function open(): Promise<MMKV> {
  const savedKey = await SecureStore.getItemAsync(encryptionKeyName);
  const encryptionKey = savedKey ?? createEncryptionKey();
  const storage = createMMKV({ id: storageId, encryptionKey, encryptionType: 'AES-256' });

  if (!savedKey) {
    // A file left behind by a lost key (e.g. restored from a backup without the keychain)
    // cannot be read with the new one.
    storage.clearAll();
    await SecureStore.setItemAsync(encryptionKeyName, encryptionKey);
  }
  return storage;
}

// Opened on first use: reading the key from the secure store is asynchronous.
function openSecureStorage(): Promise<MMKV> {
  opening ??= open().catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}

// The async key-value shape Supabase Auth expects for its `storage` option.
export const secureStorage = {
  getItem: async (key: string): Promise<string | null> =>
    (await openSecureStorage()).getString(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    (await openSecureStorage()).set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    (await openSecureStorage()).remove(key);
  },
};
