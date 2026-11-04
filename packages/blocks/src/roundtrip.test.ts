import { PyRunner } from '@pyquest/runtime';
import * as Blockly from 'blockly/core';
import { beforeAll, describe, expect, test } from 'vitest';
import { lineMap, registerBlocks, toPython, toolboxFor, treeToState } from './index';

let py: PyRunner;
beforeAll(async () => {
  registerBlocks();
  py = await PyRunner.create();
});

function roundTrip(source: string): string {
  const tree = py.parseBlocks(source);
  if (!tree.ok) throw new Error(tree.messageVi);
  return toPython(treeToState(tree.statements));
}

describe('Python → blocks → Python', () => {
  test.each([
    'draw_bird(100, 200)',
    'x = 100\ny = 200\ndraw_bird(x, y)',
    'y = y + 2',
    'y = (y + 2) * 3',
    'speed = -8',
    'print("chào")',
    'clear("skyblue")\ndraw_rect(0, 550, 400, 50, "green")',
    'import math',
    '[i for i in range(3)]',
    'for i in range(3):\n    draw_bird(i * 50, 100)',
    'x = random_int(1, 5)',
    '# vẽ chim\ndraw_bird(1, 2)',
    'x = (a if c else b) + 1',
    'x = random_int(1, 5) * 2',
    'score = 0\nscore += 1; print(score)',
    'x = 1; y = 2  # hai biến',
    'x = 1.0',
    'x = 0x10',
    '@decorate\ndef f():\n    pass',
    'x = 1\n\ny = 2',
    "print('hi')",
  ])('%j survives the round trip', (source) => {
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('a statement with a trailing comment stays exactly as typed', () => {
    const source = 'draw_bird(1, 2)  # góc trên';
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('unsupported statements become one raw block each', () => {
    const tree = py.parseBlocks('import math\ndraw_bird(1, 2)');
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_raw', 'pq_draw_bird']);
  });

  test('a syntax error comes back with its line and blocks are not produced', () => {
    const tree = py.parseBlocks('draw_bird(1,');
    expect(tree.ok).toBe(false);
    if (!tree.ok) expect(tree.line).toBe(1);
  });
});

describe('lineMap and toolbox', () => {
  test('three chained blocks sit on lines 1, 2 and 3; a two-line raw block pushes the next', () => {
    const tree = py.parseBlocks('x = 1\nfor i in range(2):\n    pass\ndraw_bird(x, 2)');
    if (!tree.ok) throw new Error('parse');
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(treeToState(tree.statements), ws);
    const lines = [...lineMap(ws).values()].sort((a, b) => a - b);
    expect(lines).toEqual([1, 2, 4]);
    ws.dispose();
  });

  test('toolboxFor lists only the allowed blocks, in order', () => {
    const tb = toolboxFor(['pq_draw_bird', 'pq_number']);
    expect(tb.contents.map((c) => c.type)).toEqual(['pq_draw_bird', 'pq_number']);
  });

  test('toolboxFor rejects an unknown block id', () => {
    expect(() => toolboxFor(['pq_nope'])).toThrow(/pq_nope/);
  });
});
