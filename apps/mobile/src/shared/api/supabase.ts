// supabase-js sets `URL.protocol`, which React Native's URL does not implement.
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { secureStorage } from '../lib/secureStorage';

let client: SupabaseClient | null = null;

// Used only for authentication: business data always comes from the BFF. Created on first
// use, so modules that just import the API client (and their tests) need no Supabase env.
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configuradas',
    );
  }

  const supabase = createClient(url, publishableKey, {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  // Supabase renews the token on a timer, which must stop while the app is in the background.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });

  client = supabase;
  return supabase;
}
