import { describe, expect, it } from 'vitest';

import { loadEnv } from './env';

const DATABASE_URL =
  'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
const SUPABASE_URL = 'https://ref.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_abc123';
const required: Record<string, string> = { DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY };

const without = (name: string) =>
  Object.fromEntries(Object.entries(required).filter(([key]) => key !== name));

describe('loadEnv', () => {
  it('applies defaults', () => {
    expect(loadEnv(required)).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      ...required,
    });
  });

  it('reads PORT as a number', () => {
    expect(loadEnv({ ...required, NODE_ENV: 'production', PORT: '8080' })).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      ...required,
    });
  });

  it('fails on an invalid value', () => {
    expect(() => loadEnv({ ...required, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadEnv({ ...required, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('requires a Postgres DATABASE_URL', () => {
    expect(() => loadEnv(without('DATABASE_URL'))).toThrow(/DATABASE_URL/);
    expect(() => loadEnv({ ...required, DATABASE_URL: 'https://example.com' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('requires an http(s) SUPABASE_URL and drops a trailing slash', () => {
    expect(() => loadEnv(without('SUPABASE_URL'))).toThrow(/SUPABASE_URL/);
    expect(() => loadEnv({ ...required, SUPABASE_URL: 'ref.supabase.co' })).toThrow(/SUPABASE_URL/);
    expect(loadEnv({ ...required, SUPABASE_URL: `${SUPABASE_URL}/` }).SUPABASE_URL).toBe(
      SUPABASE_URL,
    );
  });

  it('requires a secret key, not the publishable one', () => {
    expect(() => loadEnv(without('SUPABASE_SECRET_KEY'))).toThrow(/SUPABASE_SECRET_KEY/);
    expect(() => loadEnv({ ...required, SUPABASE_SECRET_KEY: 'sb_publishable_abc123' })).toThrow(
      /SUPABASE_SECRET_KEY/,
    );
  });
});
