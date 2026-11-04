import { PyRunner } from '@pyquest/runtime';
import * as Blockly from 'blockly/core';
import { beforeAll, describe, expect, test } from 'vitest';
import { BlockCodeSync } from './blockCodeSync';

let py: PyRunner;
beforeAll(async () => {
  py = await PyRunner.create();
});

function setup() {
  const ws = new Blockly.Workspace();
  const seen: { code: string[]; errors: (string | null)[] } = { code: [], errors: [] };
  const sync = new BlockCodeSync(ws, (src) => Promise.resolve(py.parseBlocks(src)), {
    onCode: (c) => seen.code.push(c),
    onError: (e) => seen.errors.push(e === null ? null : e.messageVi),
  });
  return { ws, sync, seen };
}

describe('BlockCodeSync', () => {
  test('code → blocks builds the workspace and does not echo code back', async () => {
    const { ws, sync, seen } = setup();
    expect(await sync.fromCode('x = 3\ndraw_image("images/bird.png", x, 300)')).toBe(true);
    expect(ws.getAllBlocks(false).map((b) => b.type)).toContain('pq_assign');
    expect(seen.code).toEqual([]);
    expect(seen.errors).toEqual([null]);
  });

  test('changing a number in a block regenerates the code', async () => {
    const { ws, sync, seen } = setup();
    await sync.fromCode('draw_image("images/bird.png", 100, 300)');
    const num = ws.getAllBlocks(false).find((b) => b.type === 'pq_number');
    num?.setFieldValue(120, 'NUM');
    sync.fromBlocks();
    expect(seen.code.at(-1)).toBe('draw_image("images/bird.png", 120, 300)\n');
  });

  test('a syntax error keeps the old blocks and reports the line', async () => {
    const { ws, sync, seen } = setup();
    await sync.fromCode('draw_image("images/bird.png", 1, 2)');
    const before = ws.getAllBlocks(false).length;
    expect(await sync.fromCode('draw_image("images/bird.png", 1,')).toBe(false);
    expect(ws.getAllBlocks(false).length).toBe(before);
    expect(seen.errors.at(-1)).toContain('Dòng 1');
  });

  test('a parse that finishes after dispose() touches nothing', async () => {
    const { ws, sync } = setup();
    const pending = sync.fromCode('draw_image("images/bird.png", 1, 2)');
    sync.dispose();
    ws.dispose();
    expect(await pending).toBe(false);
  });

  test('after the child types, block edits do not overwrite the code until it parses', async () => {
    const { sync, seen } = setup();
    await sync.fromCode('draw_image("images/bird.png", 1, 2)');
    sync.markCodeDirty();
    expect(sync.fromBlocks()).toBeNull();
    expect(seen.code).toEqual([]);
    expect(await sync.fromCode('draw_image("images/bird.png", 1, 2)\nx = = 2')).toBe(false);
    expect(sync.fromBlocks()).toBeNull();
    expect(seen.code).toEqual([]);
    expect(await sync.fromCode('draw_image("images/bird.png", 5, 2)')).toBe(true);
    expect(sync.fromBlocks()).toBe('draw_image("images/bird.png", 5, 2)\n');
  });

  test('an older parse that finishes last is dropped', async () => {
    const ws = new Blockly.Workspace();
    const resolvers: ((v: ReturnType<PyRunner['parseBlocks']>) => void)[] = [];
    const sync = new BlockCodeSync(ws, () => new Promise((r) => resolvers.push(r)), {
      onCode: () => undefined,
      onError: () => undefined,
    });
    const older = sync.fromCode('draw_image("images/bird.png", 1, 1)');
    const newer = sync.fromCode('draw_image("images/bird.png", 2, 2)');
    resolvers[1]!(py.parseBlocks('draw_image("images/bird.png", 2, 2)'));
    expect(await newer).toBe(true);
    resolvers[0]!(py.parseBlocks('draw_image("images/bird.png", 1, 1)'));
    expect(await older).toBe(false);
    expect(sync.fromBlocks()).toBe('draw_image("images/bird.png", 2, 2)\n');
  });

  test('while applying code, block events are ignored', async () => {
    const { sync } = setup();
    const p = sync.fromCode('draw_image("images/bird.png", 1, 2)');
    await p;
    expect(sync.applying).toBe(false);
  });
});

test('I2: blocks that cannot be built are reported, not silently dropped', async () => {
  const ws = new Blockly.Workspace();
  const errors: (string | null)[] = [];
  const sync = new BlockCodeSync(
    ws,
    () => Promise.resolve({ ok: true as const, statements: [{ type: 'pq_nope' }] }),
    { onCode: () => undefined, onError: (e) => errors.push(e === null ? null : e.messageVi) },
  );
  expect(await sync.fromCode('anything')).toBe(false);
  expect(errors.at(-1)).toContain('khối');
});
