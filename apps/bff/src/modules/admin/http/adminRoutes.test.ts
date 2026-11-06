import { AdminMeResponse, ErrorResponse } from '@libras/contracts';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { createInMemoryContainer } from '../../../testing/inMemoryContainer';
import { createTestTokens, type TestTokens } from '../../../testing/testTokens';
import { InMemoryAdminRepository } from '../testing/InMemoryAdminRepository';

const now = new Date('2026-03-15T12:00:00Z');
const operatorId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const formerOperatorId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e02';
const learnerId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e03';

let tokens: TestTokens;

beforeAll(async () => {
  tokens = await createTestTokens();
});

describe('admin routes', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    const admins = new InMemoryAdminRepository([
      { userId: operatorId, email: 'ana@example.com', name: 'Ana', active: true },
      { userId: formerOperatorId, email: 'bia@example.com', name: 'Bia', active: false },
    ]);
    app = buildApp(createInMemoryContainer(new FixedClock(now), { jwks: tokens.jwks, admins }), {
      logger: false,
    });
  });

  const getAs = async (userId: string, url: string) =>
    app.inject({
      method: 'GET',
      url,
      headers: { authorization: `Bearer ${await tokens.sign(userId, { now })}` },
    });

  const expectError = (
    response: Awaited<ReturnType<typeof getAs>>,
    status: number,
    code: string,
  ) => {
    expect(response.statusCode).toBe(status);
    expect(ErrorResponse.parse(response.json()).error.code).toBe(code);
  };

  describe('GET /v1/admin/me', () => {
    it('answers the signed-in operator', async () => {
      const response = await getAs(operatorId, '/v1/admin/me');

      expect(response.statusCode).toBe(200);
      expect(AdminMeResponse.parse(response.json())).toEqual({
        name: 'Ana',
        email: 'ana@example.com',
      });
    });

    it('answers 403 NOT_ADMIN to a learner', async () => {
      expectError(await getAs(learnerId, '/v1/admin/me'), 403, 'NOT_ADMIN');
    });

    it('answers 403 NOT_ADMIN to a deactivated operator', async () => {
      expectError(await getAs(formerOperatorId, '/v1/admin/me'), 403, 'NOT_ADMIN');
    });

    it('answers 401 without a token', async () => {
      expectError(await app.inject({ method: 'GET', url: '/v1/admin/me' }), 401, 'UNAUTHORIZED');
    });
  });

  // The operator check is scoped to /v1/admin: learners keep using their own routes.
  it('does not apply to the learner routes', async () => {
    const response = await getAs(learnerId, '/v1/studies');

    expect(response.statusCode).toBe(200);
  });
});
