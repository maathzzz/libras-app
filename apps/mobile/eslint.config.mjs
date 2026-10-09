import { projectRules } from '@libras/eslint-config';
import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig, globalIgnores } from 'eslint/config';

// eslint-config-expo already registers @typescript-eslint, so only the shared rules are layered on.
export default defineConfig([globalIgnores(['dist/*', '.expo/*']), expoConfig, projectRules]);
