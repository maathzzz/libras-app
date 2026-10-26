import { ErrorResponse } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildApp } from '../../app';
import { createInMemoryContainer } from '../../testing/inMemoryContainer';
import { FixedClock } from '../application/FixedClock';
import { HttpError } from './HttpError';

function buildTestApp() {
  const clock = new FixedClock(new Date('2026-03-15T12:00:00Z'));
  const app = buildApp(createInMemoryContainer(clock), { logger: false });

  app.post(
    '/echo',
    { schema: { body: z.object({ name: z.string().min(1) }) } },
    async (request) => request.body,
  );
  app.get('/teapot', async () => {
    throw new HttpError(418, 'TEAPOT', 'I am a teapot');
  });
  app.get('/boom', async () => {
    throw new Error('connection to db.internal:5432 refused');
  });
  // A handler whose data breaks its own response schema.
  app.get(
    '/wrong-shape',
    { schema: { response: { 200: z.object({ id: z.uuid() }) } } },
    async () => ({ id: 'not-a-uuid' }),
  );

  return app;
}

describe('error handler', () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeEach(() => {
    app = buildTestApp();
  });

  it('answers 400 VALIDATION_ERROR when the body fails the Zod schema', async () => {
    const response = await app.inject({ method: 'POST', url: '/echo', payload: { name: '' } });

    expect(response.statusCode).toBe(400);
    const body = ErrorResponse.parse(response.json());
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('name');
  });

  it('answers 400 BAD_REQUEST for malformed JSON', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"name":',
    });

    expect(response.statusCode).toBe(400);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('BAD_REQUEST');
  });

  it('answers an HttpError with its own status and code', async () => {
    const response = await app.inject({ method: 'GET', url: '/teapot' });

    expect(response.statusCode).toBe(418);
    expect(response.json()).toEqual({ error: { code: 'TEAPOT', message: 'I am a teapot' } });
  });

  it('answers 404 NOT_FOUND for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /nope not found' },
    });
  });

  it('answers 500 INTERNAL_ERROR without leaking the original message', async () => {
    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  it('answers 500 INTERNAL_ERROR when a response breaks its schema', async () => {
    const response = await app.inject({ method: 'GET', url: '/wrong-shape' });

    expect(response.statusCode).toBe(500);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('INTERNAL_ERROR');
  });
});
