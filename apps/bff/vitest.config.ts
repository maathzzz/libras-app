import { configDefaults, defineConfig } from 'vitest/config';

// Unit tests only: integration tests need the cloud database and run with
// `pnpm test:integration` (vitest.integration.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
