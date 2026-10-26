import { existsSync } from 'node:fs';

import { defineConfig } from 'vitest/config';

// In CI the variables come from the environment; locally, from .env like `pnpm dev`.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    // The database is shared and reached over the network: one file at a time keeps
    // the number of pooler connections low, and the timeout allows for round trips.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
