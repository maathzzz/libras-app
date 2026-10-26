import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

import type { Clock } from '../application/Clock';
import { HttpError } from './HttpError';

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
}

// Null when the token is not acceptable. Throws only when the keys cannot be fetched, so an
// outage of the JWKS endpoint shows up as a 500 instead of logging every learner out.
export type AccessTokenVerifier = (token: string) => Promise<AuthenticatedUser | null>;

declare module 'fastify' {
  interface FastifyRequest {
    // Set by authPlugin before any handler of its scope runs.
    auth: AuthenticatedUser | null;
  }
}

const TokenClaims = z.object({
  sub: z.uuid(),
  // Empty for anonymous and phone-only users.
  email: z.string().optional(),
});

// Failures of the key source, not of the token.
const keySourceFailures = new Set([errors.JWKSTimeout.code, errors.JWKSInvalid.code]);

interface VerifierOptions {
  jwks: JWTVerifyGetKey;
  issuer: string;
  audience: string;
  clock: Clock;
}

export function createAccessTokenVerifier({
  jwks,
  issuer,
  audience,
  clock,
}: VerifierOptions): AccessTokenVerifier {
  return async (token) => {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience,
        // Asymmetric only: a token signed with the legacy shared secret (HS256) is refused.
        algorithms: ['ES256', 'RS256'],
        currentDate: clock.now(),
      });
      const claims = TokenClaims.safeParse(payload);
      if (!claims.success) return null;
      return { userId: claims.data.sub, email: claims.data.email || null };
    } catch (error) {
      if (error instanceof errors.JOSEError && !keySourceFailures.has(error.code)) return null;
      throw error;
    }
  };
}

// jose keeps the fetched keys in memory and fetches again when a token comes with an unknown
// `kid`, which covers key rotation without a restart.
export function supabaseJwks(supabaseUrl: string): JWTVerifyGetKey {
  return createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
}

const bearerPattern = /^Bearer\s+(\S+)$/i;

// fp() lifts the hook and the decorator to the scope that registers the plugin, so every
// route registered next to it is protected.
export function authPlugin(verify: AccessTokenVerifier): FastifyPluginAsync {
  return fp(async (app) => {
    app.decorateRequest('auth', null);

    app.addHook('onRequest', async (request) => {
      const token = bearerPattern.exec(request.headers.authorization ?? '')?.[1];
      if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token');

      const user = await verify(token);
      if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid access token');

      request.auth = user;
    });
  });
}

// For handlers behind authPlugin, where `auth` is always set.
export function authenticatedUser(request: FastifyRequest): AuthenticatedUser {
  if (!request.auth) throw new Error('Route is not behind authPlugin');
  return request.auth;
}
