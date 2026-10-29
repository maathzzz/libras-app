import { ErrorResponse } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app';
import { createInMemoryContainer } from '../../testing/inMemoryContainer';
import { FixedClock } from '../application/FixedClock';
import { readIdempotencyKey } from './idempotencyKeyHeader';

function buildTestApp() {
  const app = buildApp(createInMemoryContainer(new FixedClock(new Date('2026-03-15T12:00:00Z'))), {
    logger: false,
  });
  app.post('/write', async (request) => ({ key: readIdempotencyKey(request) }));
  return app;
}

describe('readIdempotencyKey', () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeEach(() => {
    app = buildTestApp();
  });

  const write = (headers: Record<string, string> = {}) =>
    app.inject({ method: 'POST', url: '/write', headers });

  it('reads a UUID key', async () => {
    const key = '9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d';

    const response = await write({ 'idempotency-key': key });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ key });
  });

  it('answers 400 INVALID_IDEMPOTENCY_KEY when the header is missing', async () => {
    const response = await write();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'Missing Idempotency-Key header' },
    });
  });

  it.each(['key-1', '9b2f6c1e3d4a4f5b8c6d7e8f9a0b1c2d', ''])(
    'answers 400 INVALID_IDEMPOTENCY_KEY for the malformed key %j',
    async (value) => {
      const response = await write({ 'idempotency-key': value });

      expect(response.statusCode).toBe(400);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('INVALID_IDEMPOTENCY_KEY');
    },
  );
});
