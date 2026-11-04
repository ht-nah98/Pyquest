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
    'from pyquest import *\n\ndraw_bird(100, 300)',
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
    'for i in range(3):\n    draw_bird(i * 50, 100)\n    print(i)',
    'for i in range(1, 4):\n    print(i)',
    'if x > 3:\n    print("lớn")',
    'if y >= 520:\n    y = 520\nelse:\n    y = y + 2',
    'def update():\n    global y\n    y += 2',
    'def draw():\n    clear("skyblue")\n    draw_bird(100, y)',
    'y = 100\n\n\ndef update():\n    global y\n    y = y + 3\n\n\ndef draw():\n    draw_bird(100, y)',
    'if key_pressed():\n    speed = -8',
    'x = random_int(1, 5)\nx += 1',
    'draw_sprite("pipe", 200, 300)\ndraw_text("0", 200, 60)',
    'use_sprite("bird", "images/bird-cu.png")\ndraw_bird(100, 300)',
    'if pipe_x + 52 < 100 and not scored:\n    score = score + 1',
    'if x < 3 or (a if b else c):\n    pass',
    'for i in range(2):\n    for j in range(2):\n        draw_bird(i * 50, j * 50)',
    'for i in range(3):\n    # mỗi vòng một chim\n    draw_bird(i, 0)',
  ])('%j survives the round trip', (source) => {
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('a statement with a trailing comment stays exactly as typed', () => {
    const source = 'draw_bird(1, 2)  # góc trên';
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('the pyquest import is its own block', () => {
    const tree = py.parseBlocks('from pyquest import *\ndraw_bird(1, 2)');
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_import', 'pq_draw_bird']);
  });

  test('loops, conditions and functions become real blocks, not raw code', () => {
    const tree = py.parseBlocks(
      'for i in range(3):\n    print(i)\nif i > 1:\n    print(i)\ndef update():\n    pass',
    );
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_for', 'pq_if', 'pq_def']);
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
  test('blocks sit on their lines, nested ones too (for on 2, its body on 3, next on 4)', () => {
    const tree = py.parseBlocks('x = 1\nfor i in range(2):\n    pass\ndraw_bird(x, 2)');
    if (!tree.ok) throw new Error('parse');
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(treeToState(tree.statements), ws);
    const lines = [...lineMap(ws).values()].sort((a, b) => a - b);
    expect(lines).toEqual([1, 2, 3, 4]);
    ws.dispose();
  });

  test('toolboxFor lists only the allowed blocks, in order', () => {
    const tb = toolboxFor(['pq_draw_bird', 'pq_number']);
    expect(tb.kind).toBe('flyoutToolbox');
    if (tb.kind === 'flyoutToolbox') expect(tb.contents.map((c) => c.type)).toEqual(['pq_draw_bird', 'pq_number']);
  });

  test('more than 6 blocks become a category toolbox, grouped by family in a fixed order', () => {
    const tb = toolboxFor(['pq_draw_bird', 'pq_if', 'pq_assign', 'pq_for', 'pq_def', 'pq_number', 'pq_compare']);
    expect(tb.kind).toBe('categoryToolbox');
    if (tb.kind !== 'categoryToolbox') return;
    expect(tb.contents.map((c) => c.name)).toEqual(['Vẽ', 'Biến', 'Lặp', 'Điều kiện', 'Lệnh tự đặt', 'Số và chữ']);
    expect(tb.contents.find((c) => c.name === 'Điều kiện')?.contents.map((b) => b.type)).toEqual(['pq_if', 'pq_compare']);
  });

  test('toolboxFor rejects an unknown block id', () => {
    expect(() => toolboxFor(['pq_nope'])).toThrow(/pq_nope/);
  });
});
