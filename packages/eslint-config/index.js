import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Project rules only, without registering plugins. Meant to be layered on top of
 * configs that already register `@typescript-eslint` (e.g. eslint-config-expo),
 * since flat config refuses to register the same plugin twice.
 */
export const projectRules = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'no-console': 'warn',
  },
};

export const base = defineConfig([
  globalIgnores(['**/dist/', '**/node_modules/', '**/.expo/', '**/coverage/']),
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  projectRules,
]);

export default base;
