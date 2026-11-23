import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const WEB = fileURLToPath(new URL('../../../apps/web', import.meta.url));
const cli = createRequire(`${WEB}/package.json`).resolve('@playwright/test/cli');

/** Only lists the tests: no server is started. */
const list = (port: string) =>
  spawnSync(process.execPath, [cli, 'test', '--list', 'blockly-ui'], {
    cwd: WEB,
    env: { ...process.env, PQ_E2E_PORT: port },
    encoding: 'utf8',
  });

// 5173 is the coach's server; 5174 would put the cloud project's server on it (AGENTS.md §9.9).
test.each(['5173', '5174'])('e2e refuses port %s', (port) => {
  const r = list(port);
  expect(r.status).not.toBe(0);
  expect(r.stdout + r.stderr).toContain('PQ_E2E_PORT');
});

test('e2e takes another port', () => {
  expect(list('5397').status).toBe(0);
});
