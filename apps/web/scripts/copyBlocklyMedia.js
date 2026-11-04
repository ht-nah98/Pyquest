// Self-host Blockly's media so the app never requests static.blockly.com
// (docs/architecture/security-privacy.md). Runs on postinstall.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(appDir, 'public', 'blockly-media');

// npm workspaces may hoist blockly to the repo root, so search upwards.
let dir = appDir;
let source;
for (;;) {
  const candidate = join(dir, 'node_modules', 'blockly', 'media');
  if (existsSync(candidate)) {
    source = candidate;
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}

if (!source) {
  console.error('copyBlocklyMedia: node_modules/blockly/media not found');
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
