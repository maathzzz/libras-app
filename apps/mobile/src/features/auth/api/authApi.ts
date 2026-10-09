import * as Crypto from 'expo-crypto';

export type Credentials = {
  email: string;
  password: string;
};

const mockLatencyMs = 600;
const wait = () => new Promise((resolve) => setTimeout(resolve, mockLatencyMs));

// Mocked until the Supabase project is configured. Then these become
// `supabase.auth.signInWithPassword(credentials)` and `supabase.auth.signUp(credentials)`,
// resolving to `data.session.access_token` (and throwing on `error`).
export async function signInWithPassword(_credentials: Credentials): Promise<string> {
  await wait();
  return Crypto.randomUUID();
}

export async function signUpWithPassword(_credentials: Credentials): Promise<string> {
  await wait();
  return Crypto.randomUUID();
}
