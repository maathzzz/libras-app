import { build } from 'esbuild';

import pkg from '../package.json' with { type: 'json' };

// Workspace packages (@libras/*) ship TypeScript source that Node can't run, so they are
// bundled in. npm dependencies stay external and are installed next to dist/ on deploy.
const external = Object.keys(pkg.dependencies).filter((name) => !name.startsWith('@libras/'));

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/main.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  external,
});
