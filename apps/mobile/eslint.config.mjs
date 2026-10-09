import { projectRules } from '@libras/eslint-config';
import boundaries from 'eslint-plugin-boundaries';
import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig, globalIgnores } from 'eslint/config';

const featureBoundaries = {
  files: ['src/**/*.{ts,tsx}'],
  plugins: { boundaries },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
    'boundaries/elements': [
      { type: 'route', pattern: 'src/app' },
      { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
      { type: 'shared', pattern: 'src/shared/*', capture: ['sharedName'] },
    ],
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        policies: [
          { allow: { dependency: { relationship: { to: 'internal' } } } },
          { allow: { to: { module: { origin: ['external', 'core'] } } } },
          {
            from: { element: { types: ['route', 'feature', 'shared'] } },
            allow: { to: { element: { type: 'shared' } } },
          },
          // Routes and other features only reach a feature through its public index.ts.
          {
            from: { element: { types: ['route', 'feature'] } },
            allow: { to: { element: { type: 'feature', fileInternalPath: 'index.ts' } } },
          },
        ],
      },
    ],
  },
};

// eslint-config-expo already registers @typescript-eslint, so only the shared rules are layered on.
export default defineConfig([
  globalIgnores(['dist/*', '.expo/*']),
  expoConfig,
  projectRules,
  featureBoundaries,
]);
