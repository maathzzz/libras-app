import { ErrorResponse } from '@libras/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app';
import { createInMemoryContainer } from '../../testing/inMemoryContainer';
import { FixedClock } from '../application/FixedClock';
import { readLocalDate } from './localDateHeader';

function buildTestApp() {
  const app = buildApp(createInMemoryContainer(new FixedClock(new Date('2026-03-15T12:00:00Z'))), {
    logger: false,
  });
  app.get('/today', async (request) => ({ today: readLocalDate(request).toString() }));
  return app;
}

describe('readLocalDate', () => {
  let app: ReturnType<typeof buildTestApp>;

  beforeEach(() => {
    app = buildTestApp();
  });

  const getToday = (headers: Record<string, string> = {}) =>
    app.inject({ method: 'GET', url: '/today', headers });

  it('reads a valid date', async () => {
    const response = await getToday({ 'x-local-date': '2026-03-15' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ today: '2026-03-15' });
  });

  it('answers 400 INVALID_LOCAL_DATE when the header is missing', async () => {
    const response = await getToday();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_LOCAL_DATE', message: 'Missing X-Local-Date header' },
    });
  });

  it.each(['15/03/2026', '2026-3-15', '2026-02-30', ''])(
    'answers 400 INVALID_LOCAL_DATE for the malformed date %j',
    async (value) => {
      const response = await getToday({ 'x-local-date': value });

      expect(response.statusCode).toBe(400);
      expect(ErrorResponse.parse(response.json()).error.code).toBe('INVALID_LOCAL_DATE');
    },
  );
});
