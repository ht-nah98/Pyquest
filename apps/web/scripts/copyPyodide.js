// Serve Pyodide from this app (ADR 0002): the class runs over LAN without Internet. Runs on postinstall.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(appDir, 'public', 'pyodide');
const FILES = [
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'pyodide.mjs',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

let dir = appDir;
let source;
for (;;) {
  const candidate = join(dir, 'node_modules', 'pyodide');
  if (existsSync(candidate)) {
    source = candidate;
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
if (!source) {
  console.error('copyPyodide: node_modules/pyodide not found');
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const f of FILES) cpSync(join(source, f), join(target, f));
