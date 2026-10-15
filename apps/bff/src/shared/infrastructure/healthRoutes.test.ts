import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app';
import { FixedClock } from '../application/FixedClock';

describe('GET /health', () => {
  it('answers ok with the server time', async () => {
    const clock = new FixedClock(new Date('2026-03-15T12:00:00Z'));
    const app = buildApp({ clock }, { logger: false });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', time: '2026-03-15T12:00:00.000Z' });
  });
});
