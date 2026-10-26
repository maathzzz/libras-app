import { TransactionRollbackError } from 'drizzle-orm';
import { afterAll, beforeAll } from 'vitest';

import { loadEnv } from '../../env';
import { createDatabase, type Database, type DbExecutor } from '../client';

type DatabaseTest = (tx: DbExecutor) => Promise<void>;

// The development database is shared and lives in the cloud, so every integration test
// runs inside a transaction that is always rolled back: nothing it writes is ever seen
// by anyone else. Repositories that open their own transaction get a savepoint inside it.
export async function withRollback(db: Database, test: DatabaseTest): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await test(tx);
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
}

// Opens one connection per test file and returns a wrapper that runs a test body inside
// withRollback: `it('...', inRollback(async (tx) => { ... }))`.
export function useTestDatabase(): (test: DatabaseTest) => () => Promise<void> {
  let database: ReturnType<typeof createDatabase> | undefined;

  beforeAll(() => {
    database = createDatabase(loadEnv().DATABASE_URL);
  });
  afterAll(async () => {
    await database?.close();
  });

  return (test) => () => {
    if (!database) throw new Error('The test database is not open');
    return withRollback(database.db, test);
  };
}

// Drizzle wraps driver errors, so the Postgres SQLSTATE is on the cause.
export function postgresErrorCode(error: unknown): string | undefined {
  const cause = error instanceof Error ? error.cause : undefined;
  if (typeof cause !== 'object' || cause === null || !('code' in cause)) return undefined;
  return typeof cause.code === 'string' ? cause.code : undefined;
}
