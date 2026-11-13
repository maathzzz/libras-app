import { base } from '@libras/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['.next/', 'next-env.d.ts']),
  nextVitals,
  base,
]);
