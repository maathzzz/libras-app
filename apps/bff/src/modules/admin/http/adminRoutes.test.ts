import {
  AdminMeResponse,
  AdminOperatorsResponse,
  ErrorResponse,
  TemporaryPasswordResponse,
} from '@libras/contracts';
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
// Listed in app.admins, but a learner account: it was never created as an operator.
const listedLearnerId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e04';

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
      { userId: listedLearnerId, email: 'caio@example.com', name: 'Caio', active: true },
    ]);
    app = buildApp(createInMemoryContainer(new FixedClock(now), { jwks: tokens.jwks, admins }), {
      logger: false,
    });
  });

  const operators = new Set([operatorId, formerOperatorId]);

  // Operator accounts carry the operator role in their token; learner accounts do not.
  const getAs = async (userId: string, url: string) =>
    app.inject({
      method: 'GET',
      url,
      headers: {
        authorization: `Bearer ${await tokens.sign(userId, { now, operator: operators.has(userId) })}`,
      },
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

    it('answers 403 NOT_ADMIN to a learner account even when it is listed as an operator', async () => {
      expectError(await getAs(listedLearnerId, '/v1/admin/me'), 403, 'NOT_ADMIN');
    });

    it('answers 401 without a token', async () => {
      expectError(await app.inject({ method: 'GET', url: '/v1/admin/me' }), 401, 'UNAUTHORIZED');
    });
  });

  describe('separate accounts', () => {
    // The operator check is scoped to /v1/admin: learners keep using their own routes.
    it('lets learner accounts use the learner routes', async () => {
      const response = await getAs(learnerId, '/v1/studies');

      expect(response.statusCode).toBe(200);
    });

    it.each(['/v1/me', '/v1/studies'])(
      'answers 403 OPERATOR_ACCOUNT to an operator account on %s',
      async (url) => {
        expectError(await getAs(operatorId, url), 403, 'OPERATOR_ACCOUNT');
      },
    );
  });

  describe('operators', () => {
    const send = async (method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
      app.inject({
        method,
        url,
        headers: {
          authorization: `Bearer ${await tokens.sign(operatorId, { now, operator: true })}`,
        },
        ...(payload ? { payload } : {}),
      });
    const list = async () =>
      AdminOperatorsResponse.parse((await send('GET', '/v1/admin/operators')).json()).operators;

    it('lists the operators, deactivated ones too', async () => {
      expect((await list()).map(({ name, active }) => [name, active])).toEqual([
        ['Ana', true],
        ['Bia', false],
        ['Caio', true],
      ]);
    });

    it('creates an operator and answers its temporary password once, never cached', async () => {
      const response = await send('POST', '/v1/admin/operators', {
        email: 'Dani+CMS@example.com',
        name: 'Dani',
      });

      expect(response.statusCode).toBe(201);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(TemporaryPasswordResponse.parse(response.json()).temporaryPassword).toBe(
        'temporary-password-1',
      );
      expect((await list()).find((operator) => operator.name === 'Dani')?.email).toBe(
        'dani+cms@example.com',
      );
    });

    it('deactivates another operator, who loses access at once', async () => {
      const response = await send('PATCH', `/v1/admin/operators/${formerOperatorId}`, {
        name: 'Bia',
        active: true,
      });
      expect(response.statusCode).toBe(204);
      expect((await getAs(formerOperatorId, '/v1/admin/me')).statusCode).toBe(200);

      await send('PATCH', `/v1/admin/operators/${formerOperatorId}`, {
        name: 'Bia',
        active: false,
      });
      expectError(await getAs(formerOperatorId, '/v1/admin/me'), 403, 'NOT_ADMIN');
    });

    it('refuses to deactivate yourself and reports an unknown operator', async () => {
      expectError(
        await send('PATCH', `/v1/admin/operators/${operatorId}`, { name: 'Ana', active: false }),
        422,
        'CANNOT_DEACTIVATE_SELF',
      );
      expectError(
        await send('POST', '/v1/admin/operators/7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e99/password'),
        404,
        'OPERATOR_NOT_FOUND',
      );
    });

    it('gives an operator a new temporary password', async () => {
      const response = await send('POST', `/v1/admin/operators/${formerOperatorId}/password`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(TemporaryPasswordResponse.parse(response.json()).userId).toBe(formerOperatorId);
    });

    it('keeps learners out', async () => {
      expectError(await getAs(learnerId, '/v1/admin/operators'), 403, 'NOT_ADMIN');
    });
  });
});
