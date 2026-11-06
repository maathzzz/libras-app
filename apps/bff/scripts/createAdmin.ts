import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { DrizzleAdminRepository } from '../src/modules/admin/infrastructure/DrizzleAdminRepository';
import { createDatabase } from '../src/shared/infrastructure/db/client';

// Makes an account a CMS operator, for the first operator (the others are added from the
// CMS). An account that already exists in Supabase Auth keeps its password; otherwise one is
// created with a random password that is printed once and must be changed on first use.
//
//   pnpm --filter bff admin:create --email ana@example.com --name "Ana"

const ScriptEnv = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  SUPABASE_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
  SUPABASE_SECRET_KEY: z.string().startsWith('sb_secret_'),
});

const Args = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(60),
});

const CreatedUser = z.object({ id: z.uuid() });

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const env = ScriptEnv.safeParse(process.env);
if (!env.success) fail(`admin:create needs apps/bff/.env:\n${z.prettifyError(env.error)}`);

const { values } = parseArgs({
  options: { email: { type: 'string' }, name: { type: 'string' } },
});
const args = Args.safeParse(values);
if (!args.success)
  fail(`Usage: admin:create --email <email> --name <name>\n${z.prettifyError(args.error)}`);

const { DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY } = env.data;
const { email, name } = args.data;
const database = createDatabase(DATABASE_URL);

async function findAuthUserId(): Promise<string | null> {
  const rows = await database.db.execute<{ id: string }>(
    sql`select id from auth.users where lower(email) = lower(${email}) limit 1`,
  );
  return rows[0]?.id ?? null;
}

async function createAuthUser(password: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'content-type': 'application/json',
    },
    // Confirmed right away: the operator was chosen by someone with access to the server.
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!response.ok) fail(`Supabase Auth refused to create ${email}: HTTP ${response.status}`);
  return CreatedUser.parse(await response.json()).id;
}

try {
  let userId = await findAuthUserId();
  let password: string | null = null;
  if (!userId) {
    password = randomBytes(12).toString('base64url');
    userId = await createAuthUser(password);
  }

  await new DrizzleAdminRepository(database.db).save({ userId, email, name, active: true });

  process.stdout.write(`${name} <${email}> is now a CMS operator.\n`);
  if (password) process.stdout.write(`Temporary password (shown only once): ${password}\n`);
} finally {
  await database.close();
}
