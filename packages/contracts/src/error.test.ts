import { describe, expect, it } from 'vitest';

import { ErrorResponse } from './error';

describe('ErrorResponse', () => {
  it('accepts the standard error body', () => {
    const body = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    expect(ErrorResponse.parse(body)).toEqual(body);
  });

  it('rejects an error without a code', () => {
    expect(ErrorResponse.safeParse({ error: { code: '', message: 'x' } }).success).toBe(false);
  });
});
