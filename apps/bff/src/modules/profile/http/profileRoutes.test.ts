import { ErrorResponse, ProfileResponse } from '@libras/contracts';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../../app';
import { FixedClock } from '../../../shared/application/FixedClock';
import { createInMemoryContainer, testIssuer } from '../../../testing/inMemoryContainer';
import { InMemoryAuthAdmin } from '../testing/InMemoryAuthAdmin';
import { InMemoryProfileRepository } from '../testing/InMemoryProfileRepository';

const now = new Date('2026-03-15T12:00:00Z');
const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;
let token: string;

beforeAll(async () => {
  const pair = await generateKeyPair('ES256', { extractable: true });
  privateKey = pair.privateKey;
  jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), alg: 'ES256' }] });
  token = await new SignJWT({ email: 'ana@example.com' })
    .setProtectedHeader({ alg: 'ES256' })
    .setSubject(userId)
    .setIssuer(testIssuer)
    .setAudience('authenticated')
    .setExpirationTime(Math.floor(now.getTime() / 1000) + 3600)
    .sign(privateKey);
});

describe('profile routes', () => {
  let profiles: InMemoryProfileRepository;
  let authAdmin: InMemoryAuthAdmin;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    profiles = new InMemoryProfileRepository();
    authAdmin = new InMemoryAuthAdmin();
    app = buildApp(createInMemoryContainer(new FixedClock(now), { jwks, profiles, authAdmin }), {
      logger: false,
    });
  });

  const request = (method: 'GET' | 'PATCH' | 'DELETE', payload?: object) =>
    app.inject({
      method,
      url: '/v1/me',
      headers: { authorization: `Bearer ${token}` },
      ...(payload ? { payload } : {}),
    });

  it('answers 401 without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/me' });

    expect(response.statusCode).toBe(401);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('UNAUTHORIZED');
  });

  it('GET creates the profile on the first access', async () => {
    const response = await request('GET');

    expect(response.statusCode).toBe(200);
    expect(ProfileResponse.parse(response.json())).toEqual({
      name: 'ana',
      dailyGoal: 1,
      startLevel: 'beginner',
    });
  });

  it('GET answers 404 ACCOUNT_NOT_FOUND for a deleted account', async () => {
    profiles.removeAuthUser(userId);

    const response = await request('GET');

    expect(response.statusCode).toBe(404);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('PATCH updates the profile', async () => {
    const response = await request('PATCH', { name: '  Ana Souza  ', dailyGoal: 5 });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ name: 'Ana Souza', dailyGoal: 5, startLevel: 'beginner' });
  });

  it('PATCH answers 400 for an empty update', async () => {
    const response = await request('PATCH', {});

    expect(response.statusCode).toBe(400);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it('DELETE answers 204 and stays 204 when repeated', async () => {
    await request('GET');

    const first = await request('DELETE');
    const second = await request('DELETE');

    expect(first.statusCode).toBe(204);
    expect(first.body).toBe('');
    expect(second.statusCode).toBe(204);
    expect(profiles.profiles).toHaveLength(0);
    expect(authAdmin.deletedUserIds).toEqual([userId, userId]);
  });
});
