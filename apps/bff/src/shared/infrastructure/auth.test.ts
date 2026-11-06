import { ErrorResponse } from '@libras/contracts';
import Fastify from 'fastify';
import {
  createLocalJWKSet,
  errors,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
  type JWTVerifyGetKey,
} from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { FixedClock } from '../application/FixedClock';
import { authenticatedUser, authPlugin, createAccessTokenVerifier } from './auth';
import { errorHandler } from './errorHandler';

const issuer = 'https://ref.supabase.co/auth/v1';
const audience = 'authenticated';
const userId = '7d6f1c2a-1b2d-4c5e-8f90-1a2b3c4d5e01';
const now = new Date('2026-03-15T12:00:00Z');
const nowSeconds = Math.floor(now.getTime() / 1000);
const kid = 'test-key';

let signingKey: CryptoKey;
let otherKey: CryptoKey;
let jwks: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair('ES256', { extractable: true });
  signingKey = pair.privateKey;
  otherKey = (await generateKeyPair('ES256')).privateKey;
  jwks = createLocalJWKSet({
    keys: [{ ...(await exportJWK(pair.publicKey)), kid, alg: 'ES256' }],
  });
});

interface TokenOptions {
  key?: CryptoKey;
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  expiresAt?: number;
  appMetadata?: Record<string, unknown>;
}

// Shaped like a Supabase access token.
function sign({
  key = signingKey,
  iss = issuer,
  aud = audience,
  sub = userId,
  email = 'ana@example.com',
  expiresAt = nowSeconds + 3600,
  appMetadata = { provider: 'email', providers: ['email'] },
}: TokenOptions = {}): Promise<string> {
  return new SignJWT({ email, role: 'authenticated', app_metadata: appMetadata })
    .setProtectedHeader({ alg: 'ES256', kid, typ: 'JWT' })
    .setSubject(sub)
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt(nowSeconds - 60)
    .setExpirationTime(expiresAt)
    .sign(key);
}

function buildTestApp(keys: JWTVerifyGetKey = jwks) {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const verify = createAccessTokenVerifier({
    jwks: keys,
    issuer,
    audience,
    clock: new FixedClock(now),
  });

  app.register(async (scope) => {
    await scope.register(authPlugin(verify));
    scope.get('/whoami', async (request) => authenticatedUser(request));
  });
  // Registered outside the plugin's scope.
  app.get('/public', async () => ({ ok: true }));

  return app;
}

const whoami = (authorization?: string, keys?: JWTVerifyGetKey) =>
  buildTestApp(keys).inject({
    method: 'GET',
    url: '/whoami',
    headers: authorization === undefined ? {} : { authorization },
  });

async function expectUnauthorized(authorization?: string) {
  const response = await whoami(authorization);
  expect(response.statusCode).toBe(401);
  expect(ErrorResponse.parse(response.json()).error.code).toBe('UNAUTHORIZED');
  return response;
}

describe('authPlugin', () => {
  it('lets a valid token through with the user from its claims', async () => {
    const response = await whoami(`Bearer ${await sign()}`);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId, email: 'ana@example.com', operator: false });
  });

  it('accepts a token without email', async () => {
    const response = await whoami(`Bearer ${await sign({ email: '' })}`);

    expect(response.json()).toEqual({ userId, email: null, operator: false });
  });

  it('marks an operator account by the role in app_metadata', async () => {
    const response = await whoami(`Bearer ${await sign({ appMetadata: { role: 'admin' } })}`);

    expect(response.json()).toMatchObject({ userId, operator: true });
  });

  // `role` at the top level is Supabase's database role, the same for every signed-in user.
  it('ignores the top-level role claim', async () => {
    const response = await whoami(`Bearer ${await sign({ appMetadata: {} })}`);

    expect(response.json()).toMatchObject({ operator: false });
  });

  it('answers 401 when the header is missing', async () => {
    const response = await expectUnauthorized();

    expect(response.json()).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
    });
  });

  it('answers 401 for a scheme other than Bearer', async () => {
    await expectUnauthorized(`Basic ${await sign()}`);
  });

  it('answers 401 for an expired token', async () => {
    const response = await expectUnauthorized(
      `Bearer ${await sign({ expiresAt: nowSeconds - 1 })}`,
    );

    expect(response.json()).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid access token' },
    });
  });

  it('answers 401 for a token signed with another key', async () => {
    await expectUnauthorized(`Bearer ${await sign({ key: otherKey })}`);
  });

  it('answers 401 for a token from another issuer', async () => {
    await expectUnauthorized(`Bearer ${await sign({ iss: 'https://other.supabase.co/auth/v1' })}`);
  });

  it('answers 401 for a token for another audience', async () => {
    await expectUnauthorized(`Bearer ${await sign({ aud: 'anon' })}`);
  });

  it('answers 401 for a token whose subject is not a user id', async () => {
    await expectUnauthorized(`Bearer ${await sign({ sub: 'service' })}`);
  });

  it('answers 401 for a token signed with a shared secret (HS256)', async () => {
    const token = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(issuer)
      .setAudience(audience)
      .setExpirationTime(nowSeconds + 3600)
      .sign(new TextEncoder().encode('legacy-jwt-secret-with-at-least-32-chars'));

    await expectUnauthorized(`Bearer ${token}`);
  });

  it('answers 401 for a value that is not a JWT', async () => {
    await expectUnauthorized('Bearer not-a-jwt');
  });

  it('answers 500, not 401, when the keys cannot be fetched', async () => {
    const unreachable: JWTVerifyGetKey = async () => {
      throw new errors.JWKSTimeout();
    };

    const response = await whoami(`Bearer ${await sign()}`, unreachable);

    expect(response.statusCode).toBe(500);
    expect(ErrorResponse.parse(response.json()).error.code).toBe('INTERNAL_ERROR');
  });

  it('leaves routes outside its scope public', async () => {
    const response = await buildTestApp().inject({ method: 'GET', url: '/public' });

    expect(response.statusCode).toBe(200);
  });
});
