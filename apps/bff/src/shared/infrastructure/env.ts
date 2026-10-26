import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Cloud Run tells the container which port to listen on through PORT.
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  // Supabase pooler in transaction mode (port 6543).
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Base of the project's APIs. The JWKS, the token issuer and the Auth admin API are
  // built from it, so a trailing slash is dropped.
  SUPABASE_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
  // Server-only key for the Auth admin API. The prefix check stops the publishable key
  // from being used by mistake.
  SUPABASE_SECRET_KEY: z.string().startsWith('sb_secret_'),
});
export type Env = z.infer<typeof EnvSchema>;

// Called once at startup: a bad environment stops the server before it accepts requests.
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
