import base from '@libras/eslint-config';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([base, reactHooks.configs.flat.recommended]);
