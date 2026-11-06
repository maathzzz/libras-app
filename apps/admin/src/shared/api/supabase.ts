import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Used only to sign in: every piece of content comes from the BFF. Created on first use, so
// modules that only import the API client (and their tests) need no Supabase setup.
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não configuradas');
  }

  client = createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
