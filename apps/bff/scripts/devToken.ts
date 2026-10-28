import { z } from 'zod';

// Development only: signs in a test user with email and password and prints the access token,
// for manual requests with curl:
//
//   TOKEN=$(pnpm --silent --filter bff dev:token)
//   curl -H "Authorization: Bearer $TOKEN" -H "X-Local-Date: 2026-10-28" localhost:3000/v1/home
//
// The credentials come from the environment (apps/bff/.env), never from the code. It is not
// part of the build and refuses to run with NODE_ENV=production.

const DevTokenEnv = z.object({
  NODE_ENV: z.enum(['development', 'test']).default('development'),
  SUPABASE_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
  // The same key the app uses: signing in is a public operation.
  SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_'),
  DEV_USER_EMAIL: z.email(),
  DEV_USER_PASSWORD: z.string().min(1),
});

const TokenResponse = z.object({ access_token: z.string().min(1) });

// Messages go to stderr: only the token goes to stdout, so it can be captured into a variable.
function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const parsed = DevTokenEnv.safeParse(process.env);
if (!parsed.success) {
  fail(`dev:token needs these variables in apps/bff/.env:\n${z.prettifyError(parsed.error)}`);
}
const env = parsed.data;

const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
  body: JSON.stringify({ email: env.DEV_USER_EMAIL, password: env.DEV_USER_PASSWORD }),
});
if (!response.ok) fail(`Sign-in failed (${response.status}): ${await response.text()}`);

process.stdout.write(`${TokenResponse.parse(await response.json()).access_token}\n`);
