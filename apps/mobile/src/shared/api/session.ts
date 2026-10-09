import * as SecureStore from 'expo-secure-store';

// The access token is sensitive, so it lives in the secure store and never in MMKV.
// It is cached in memory to avoid a keychain read on every request.
const tokenKey = 'auth.accessToken';
let cachedToken: string | null = null;

export async function loadAccessToken(): Promise<string | null> {
  cachedToken = await SecureStore.getItemAsync(tokenKey);
  return cachedToken;
}

export function getAccessToken(): string | null {
  return cachedToken;
}

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(tokenKey, token);
  cachedToken = token;
}

export async function clearAccessToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(tokenKey);
}
