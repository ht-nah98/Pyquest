import { PyRunner } from '@pyquest/runtime';
import * as Blockly from 'blockly/core';
import { beforeAll, describe, expect, test } from 'vitest';
import { callBlocksFor, lineMap, registerBlocks, toPython, toolboxFor, treeToState } from './index';

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
    'draw_rect(100, 200, 10, 10, "red")',
    'from pyquest import *\n\ndraw_rect(100, 300, 10, 10, "red")',
    'x = 100\ny = 200\ndraw_rect(x, y, 10, 10, "red")',
    'y = y + 2',
    'y = (y + 2) * 3',
    'speed = -8',
    'print("chào")',
    'clear("skyblue")\ndraw_rect(0, 550, 400, 50, "green")',
    'import math',
    '[i for i in range(3)]',
    'for i in range(3):\n    draw_rect(i * 50, 100, 10, 10, "red")',
    'x = random_int(1, 5)',
    '# vẽ chim\ndraw_rect(1, 2, 10, 10, "red")',
    'x = (a if c else b) + 1',
    'x = random_int(1, 5) * 2',
    'score = 0\nscore += 1; print(score)',
    'x = 1; y = 2  # hai biến',
    'x = 1.0',
    'x = 0x10',
    '@decorate\ndef f():\n    pass',
    'x = 1\n\ny = 2',
    "print('hi')",
    'for i in range(3):\n    draw_rect(i * 50, 100, 10, 10, "red")\n    print(i)',
    'for i in range(1, 4):\n    print(i)',
    'if x > 3:\n    print("lớn")',
    'if y >= 520:\n    y = 520\nelse:\n    y = y + 2',
    'def update():\n    global y\n    y += 2',
    'def draw():\n    clear("skyblue")\n    draw_rect(100, y, 10, 10, "red")',
    'y = 100\n\n\ndef update():\n    global y\n    y = y + 3\n\n\ndef draw():\n    draw_rect(100, y, 10, 10, "red")',
    'if key_pressed():\n    speed = -8',
    'x = random_int(1, 5)\nx += 1',
    'draw_image("images/pipe.png", 200, 300)\ndraw_text("0", 200, 60)',
    'draw_image("images/pipe.png", 200, 0, flip=True)',
    'x = 100\ny = 200\ndraw_image("images/bird-cu.png", x, y)',
    'def draw_bird(x, y):\n    draw_rect(x, y + 10, 30, 20, "red")\n    draw_rect(x + 30, y + 14, 8, 8, "orange")\n\n\ndraw_bird(100, 300)\ndraw_bird(200, 100)',
    'def overlap(ax, bx):\n    return ax < bx',
    'def draw_bird(x, y):\n    pass\ndef flock():\n    for i in range(3):\n        draw_bird(i * 50, 0)',
    'draw_bird(1, 2)',
    'if pipe_x + 52 < 100 and not scored:\n    score = score + 1',
    'if x < 3 or (a if b else c):\n    pass',
    'for i in range(2):\n    for j in range(2):\n        draw_rect(i * 50, j * 50, 10, 10, "red")',
    'for i in range(3):\n    # mỗi vòng một chim\n    draw_rect(i, 0, 10, 10, "red")',
    'x = 7 % 2',
    'if i % 2 == 0:\n    c = "red"',
    'while x < 400:\n    x = x + 50',
    'ok = True\nnight = False',
    'if not done:\n    pass',
    'if a and not b:\n    pass',
    'x = not (a or b)',
    'if y < 200:\n    c = "blue"\nelif y < 400:\n    c = "green"\nelse:\n    c = "brown"',
    'if a:\n    pass\nelif b:\n    pass\nelif c:\n    pass',
    'def inside(px, x):\n    return px > x\n\n\nif inside(3, 1):\n    print("trong")',
  ])('%j survives the round trip', (source) => {
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('a statement with a trailing comment stays exactly as typed', () => {
    const source = 'draw_rect(1, 2, 10, 10, "red")  # góc trên';
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('the pyquest import is its own block', () => {
    const tree = py.parseBlocks('from pyquest import *\ndraw_rect(1, 2, 10, 10, "red")');
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_import', 'pq_draw_rect']);
  });

  test('loops, conditions and functions become real blocks, not raw code', () => {
    const tree = py.parseBlocks(
      'for i in range(3):\n    print(i)\nif i > 1:\n    print(i)\ndef update():\n    pass',
    );
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_for', 'pq_if', 'pq_def']);
  });

  test('unsupported statements become one raw block each', () => {
    const tree = py.parseBlocks('import math\ndraw_rect(1, 2, 10, 10, "red")');
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_raw', 'pq_draw_rect']);
  });

  test('a call of a function defined in the file is a call block with one input per parameter', () => {
    const tree = py.parseBlocks('def draw_bird(x, y):\n    pass\ndraw_bird(100, 300)\nhop(1)');
    if (!tree.ok) throw new Error('parse');
    expect(tree.statements.map((s) => s.type)).toEqual(['pq_def', 'pq_call', 'pq_raw']);
    expect(tree.statements[0]?.fields).toEqual({ NAME: 'draw_bird', PARAMS: 'x, y' });
    expect(tree.statements[1]?.extraState).toEqual({ name: 'draw_bird', params: ['x', 'y'] });
    expect(Object.keys(tree.statements[1]?.inputs ?? {})).toEqual(['ARG0', 'ARG1']);
  });

  test('a def typed without spaces becomes a block and comes back in Python style (same meaning)', () => {
    expect(roundTrip('def f(a,b):\n    pass').trimEnd()).toBe('def f(a, b):\n    pass');
  });

  test('a call with the wrong number of values stays code text', () => {
    const tree = py.parseBlocks('def draw_bird(x, y):\n    pass\ndraw_bird(100)');
    expect(tree.ok && tree.statements.map((s) => s.type)).toEqual(['pq_def', 'pq_raw']);
  });

  test('draw_image is a block; flip=True ticks its box', () => {
    const tree = py.parseBlocks('draw_image("images/pipe.png", 1, 2, flip=True)');
    expect(tree.ok && tree.statements[0]).toMatchObject({
      type: 'pq_draw_image',
      fields: { FLIP: 'TRUE' },
    });
  });

  test('new blocks: while, not, True/False, if/elif/else chains and calls that give a value', () => {
    const types = (src: string) => {
      const tree = py.parseBlocks(src);
      if (!tree.ok) throw new Error(tree.messageVi);
      return tree.statements;
    };
    expect(types('while x < 3:\n    x = x + 1')[0]?.type).toBe('pq_while');
    const chain = types(
      'if a:\n    pass\nelif b:\n    pass\nelif c:\n    pass\nelse:\n    pass',
    )[0];
    expect(chain?.type).toBe('pq_if_chain');
    expect(chain?.extraState).toEqual({ elifs: 2, else: true });
    expect(types('ok = not True')[0]?.inputs?.['VALUE']).toEqual({
      type: 'pq_not',
      inputs: { A: { type: 'pq_bool', fields: { BOOL: 'True' } } },
    });
    const call = types('def inside(px, x):\n    return px > x\nok = inside(3, 1)')[1]?.inputs?.[
      'VALUE'
    ];
    expect(call?.type).toBe('pq_call_expr');
    expect(call?.extraState).toEqual({ name: 'inside', params: ['px', 'x'] });
  });

  test('a def that returns a value also gives a value block in the toolbox', () => {
    const tree = py.parseBlocks('def inside(px, x):\n    return px > x');
    if (!tree.ok) throw new Error('parse');
    expect(callBlocksFor(tree.statements).map((b) => b.type)).toEqual(['pq_call', 'pq_call_expr']);
  });

  test('if/elif/else blocks sit on the right lines (each elif and else is a line)', () => {
    const tree = py.parseBlocks('if a:\n    x = 1\nelif b:\n    x = 2\nelse:\n    x = 3\ny = 4');
    if (!tree.ok) throw new Error('parse');
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(treeToState(tree.statements), ws);
    expect([...lineMap(ws).values()].sort((a, b) => a - b)).toEqual([1, 2, 4, 6, 7]);
    ws.dispose();
  });

  test('a syntax error comes back with its line and blocks are not produced', () => {
    const tree = py.parseBlocks('draw_rect(1,');
    expect(tree.ok).toBe(false);
    if (!tree.ok) expect(tree.line).toBe(1);
  });
});

describe('lineMap and toolbox', () => {
  test('blocks sit on their lines, nested ones too (for on 2, its body on 3, next on 4)', () => {
    const tree = py.parseBlocks(
      'x = 1\nfor i in range(2):\n    pass\ndraw_rect(x, 2, 10, 10, "red")',
    );
    if (!tree.ok) throw new Error('parse');
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(treeToState(tree.statements), ws);
    const lines = [...lineMap(ws).values()].sort((a, b) => a - b);
    expect(lines).toEqual([1, 2, 3, 4]);
    ws.dispose();
  });

  test('toolboxFor lists only the allowed blocks, by family, even for a short list', () => {
    // A wide block like draw_rect would make an always-open flyout cover the whole workspace.
    const tb = toolboxFor(['pq_draw_rect', 'pq_number']);
    expect(tb.kind).toBe('categoryToolbox');
    if (tb.kind === 'categoryToolbox')
      expect(tb.contents.map((c) => [c.name, c.contents.map((b) => b.type)])).toEqual([
        ['Vẽ', ['pq_draw_rect']],
        ['Số và chữ', ['pq_number']],
      ]);
  });

  test('blocks are grouped by family in a fixed order', () => {
    const tb = toolboxFor([
      'pq_draw_rect',
      'pq_if',
      'pq_assign',
      'pq_for',
      'pq_def',
      'pq_number',
      'pq_compare',
    ]);
    expect(tb.kind).toBe('categoryToolbox');
    if (tb.kind !== 'categoryToolbox') return;
    expect(tb.contents.map((c) => c.name)).toEqual([
      'Vẽ',
      'Biến',
      'Lặp',
      'Điều kiện',
      'Lệnh tự đặt',
      'Số và chữ',
    ]);
    expect(tb.contents.find((c) => c.name === 'Điều kiện')?.contents.map((b) => b.type)).toEqual([
      'pq_if',
      'pq_compare',
    ]);
  });

  test('every def in the code gives a call block in the toolbox, under Lệnh tự đặt', () => {
    const tree = py.parseBlocks('def draw_bird(x, y):\n    pass\ndef update():\n    pass');
    if (!tree.ok) throw new Error('parse');
    const calls = callBlocksFor(tree.statements);
    expect(calls).toEqual([
      {
        kind: 'block',
        type: 'pq_call',
        extraState: { name: 'draw_bird', params: ['x', 'y'] },
        inputs: {
          ARG0: { shadow: { type: 'pq_number', fields: { NUM: 0 } } },
          ARG1: { shadow: { type: 'pq_number', fields: { NUM: 0 } } },
        },
      },
      { kind: 'block', type: 'pq_call', extraState: { name: 'update', params: [] } },
    ]);
    const tb = toolboxFor(
      ['pq_def', 'pq_draw_rect', 'pq_number', 'pq_assign', 'pq_var_get', 'pq_arith', 'pq_text'],
      calls,
    );
    if (tb.kind !== 'categoryToolbox') throw new Error('categories');
    expect(tb.contents.find((c) => c.name === 'Lệnh tự đặt')?.contents.map((b) => b.type)).toEqual([
      'pq_def',
      'pq_call',
      'pq_call',
    ]);
    const short = toolboxFor(['pq_def'], calls);
    expect(
      short.kind === 'categoryToolbox' && short.contents[0]?.contents.map((b) => b.type),
    ).toEqual(['pq_def', 'pq_call', 'pq_call']);
  });

  test('a call block written back to code keeps its values in order', () => {
    const tree = py.parseBlocks('def hop(a, b, c):\n    pass\nhop(1, x, "z")');
    if (!tree.ok) throw new Error('parse');
    expect(toPython(treeToState(tree.statements))).toContain('hop(1, x, "z")');
  });

  test('toolboxFor rejects an unknown block id', () => {
    expect(() => toolboxFor(['pq_nope'])).toThrow(/pq_nope/);
  });
});
