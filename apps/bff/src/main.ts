import { buildApp } from './app';
import { createContainer } from './container';
import { createDatabase } from './shared/infrastructure/db/client';
import { loadEnv } from './shared/infrastructure/env';

const env = loadEnv();
// No connection is opened until the first query. The Drizzle repositories will receive
// `database.db` through createContainer.
const database = createDatabase(env.DATABASE_URL);
const app = buildApp(createContainer(), {
  logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
});
app.addHook('onClose', () => database.close());

// Cloud Run sends SIGTERM before stopping an instance; closing lets in-flight requests finish.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void app.close());
}

try {
  // 0.0.0.0, not localhost: the container must accept connections from outside itself.
  await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
