import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>['db'];

// The connection goes through the Supabase pooler in transaction mode, which hands each
// transaction to any server connection: a statement prepared on one would be missing on
// the next, so prepared statements stay off.
export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false });

  return {
    db: drizzle(client, { schema }),
    close: () => client.end(),
  };
}
