// PostToolUse hook: formats only the file Claude just wrote or edited.
// Runs the tools' JS entry points through `node` instead of the .cmd shims in
// node_modules/.bin, so it works on Windows without depending on a shell.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const FORMATTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.json']);
const LINTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js']);
const ESLINT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];

const projectDir = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

function readFilePath() {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  return input.tool_response?.filePath ?? input.tool_input?.file_path;
}

// path.relative already compares Windows drive letters and segments case-insensitively.
function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function shouldFormat(filePath) {
  if (!FORMATTED_EXTENSIONS.has(extname(filePath))) return false;
  if (!isInside(projectDir, filePath) || !existsSync(filePath)) return false;
  return !relative(projectDir, filePath).split(sep).includes('node_modules');
}

// ESLint 9 resolves the flat config from the cwd, so it must run from the file's own package.
function findEslintRoot(filePath) {
  for (let dir = dirname(filePath); isInside(projectDir, dir); dir = dirname(dir)) {
    if (ESLINT_CONFIGS.some((name) => existsSync(join(dir, name)))) return dir;
    if (relative(projectDir, dir) === '') break;
  }
  return undefined;
}

// Resolved via package.json because eslint does not export its bin path.
function resolveBin(packageName, fromDir) {
  const require = createRequire(join(fromDir, 'package.json'));
  const manifestPath = require.resolve(`${packageName}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const binPath = typeof bin === 'string' ? bin : bin[packageName];
  return join(dirname(manifestPath), binPath);
}

function run(label, args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  if (result.status === 0) return true;

  process.stderr.write(`[format-file] ${label} failed:\n${result.stderr || result.stdout}`);
  return false;
}

const rawPath = readFilePath();
if (!rawPath) process.exit(0);

const filePath = resolve(rawPath);
if (!shouldFormat(filePath)) process.exit(0);

let ok = run(
  'prettier',
  [resolveBin('prettier', projectDir), '--write', '--ignore-unknown', filePath],
  projectDir,
);

const eslintRoot = LINTED_EXTENSIONS.has(extname(filePath)) ? findEslintRoot(filePath) : undefined;
if (eslintRoot) {
  const eslintArgs = [resolveBin('eslint', eslintRoot), '--fix', '--no-warn-ignored', filePath];
  ok = run('eslint --fix', eslintArgs, eslintRoot) && ok;
}

// Exit 2 feeds stderr back to Claude so it can fix what --fix could not; formatting is already applied.
process.exit(ok ? 0 : 2);
