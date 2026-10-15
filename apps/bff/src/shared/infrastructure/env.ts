import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Cloud Run tells the container which port to listen on through PORT.
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
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
