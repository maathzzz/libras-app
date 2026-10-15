import { describe, expect, it } from 'vitest';

import { loadEnv } from './env';

describe('loadEnv', () => {
  it('applies defaults', () => {
    expect(loadEnv({})).toEqual({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('reads PORT as a number', () => {
    expect(loadEnv({ NODE_ENV: 'production', PORT: '8080' })).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
    });
  });

  it('fails on an invalid value', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
