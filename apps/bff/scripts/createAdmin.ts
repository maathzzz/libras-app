import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { DrizzleAdminRepository } from '../src/modules/admin/infrastructure/DrizzleAdminRepository';
import { OPERATOR_ROLE } from '../src/shared/infrastructure/auth';
import { createDatabase } from '../src/shared/infrastructure/db/client';

// Creates a CMS operator account, for the first operator (the others will be added from the
// CMS). Operator accounts are separate from the learners' accounts: this always creates a new
// Supabase Auth user, marked with the operator role, and refuses an e-mail that already has
// any account. The random password is printed once and must be changed on first use.
//
//   pnpm --filter bff admin:create --email ana+cms@example.com --name "Ana"

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
if (!args.success) {
  fail(`Usage: admin:create --email <email> --name <name>\n${z.prettifyError(args.error)}`);
}

const { DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY } = env.data;
const { email, name } = args.data;
const database = createDatabase(DATABASE_URL);

async function emailHasAccount(): Promise<boolean> {
  const rows = await database.db.execute<{ id: string }>(
    sql`select id from auth.users where lower(email) = lower(${email}) limit 1`,
  );
  return rows.length > 0;
}

async function createOperatorAccount(password: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'content-type': 'application/json',
    },
    // Confirmed right away: the operator was chosen by someone with access to the server.
    // `app_metadata` can only be written with the secret key, so the role cannot be faked.
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: OPERATOR_ROLE },
    }),
  });
  if (!response.ok) fail(`Supabase Auth refused to create ${email}: HTTP ${response.status}`);
  return CreatedUser.parse(await response.json()).id;
}

try {
  if (await emailHasAccount()) {
    fail(
      `${email} already has an account. Operator accounts are separate from the app's: use another e-mail (an alias such as name+cms@gmail.com works).`,
    );
  }

  const password = randomBytes(12).toString('base64url');
  const userId = await createOperatorAccount(password);
  await new DrizzleAdminRepository(database.db).save({ userId, email, name, active: true });

  process.stdout.write(`${name} <${email}> is now a CMS operator.\n`);
  process.stdout.write(`Temporary password (shown only once): ${password}\n`);
} finally {
  await database.close();
}
