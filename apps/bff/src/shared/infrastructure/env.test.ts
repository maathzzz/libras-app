import { describe, expect, it } from 'vitest';

import { loadEnv } from './env';

const DATABASE_URL =
  'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

describe('loadEnv', () => {
  it('applies defaults', () => {
    expect(loadEnv({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL,
    });
  });

  it('reads PORT as a number', () => {
    expect(loadEnv({ NODE_ENV: 'production', PORT: '8080', DATABASE_URL })).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      DATABASE_URL,
    });
  });

  it('fails on an invalid value', () => {
    expect(() => loadEnv({ PORT: 'abc', DATABASE_URL })).toThrow(/PORT/);
    expect(() => loadEnv({ NODE_ENV: 'staging', DATABASE_URL })).toThrow(/NODE_ENV/);
  });

  it('requires a Postgres DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
    expect(() => loadEnv({ DATABASE_URL: 'https://example.com' })).toThrow(/DATABASE_URL/);
  });
});
