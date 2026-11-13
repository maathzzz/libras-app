import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from 'jose';

import { OPERATOR_ROLE } from '../shared/infrastructure/auth';
import { testIssuer } from './inMemoryContainer';

export interface TestTokens {
  // Pass to createInMemoryContainer so the app accepts the signed tokens.
  jwks: JWTVerifyGetKey;
  // A Supabase-like access token for the user, valid for an hour from `now`. `operator`
  // signs it as a CMS operator account.
  sign(userId: string, options: { now: Date; email?: string; operator?: boolean }): Promise<string>;
}

// For tests of the HTTP layer: a key pair made for the test run stands in for the project's
// JWKS, so tokens go through the real verification.
export async function createTestTokens(): Promise<TestTokens> {
  const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
  const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256' }] });

  return {
    jwks,
    sign: (userId, { now, email, operator = false }) =>
      new SignJWT({
        ...(email === undefined ? {} : { email }),
        ...(operator ? { app_metadata: { role: OPERATOR_ROLE } } : {}),
      })
        .setProtectedHeader({ alg: 'ES256' })
        .setSubject(userId)
        .setIssuer(testIssuer)
        .setAudience('authenticated')
        .setExpirationTime(Math.floor(now.getTime() / 1000) + 3600)
        .sign(privateKey),
  };
}
