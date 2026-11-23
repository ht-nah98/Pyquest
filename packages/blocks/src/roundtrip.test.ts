import { KEYS, PyRunner } from '@pyquest/runtime';
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
    'y = a * (b % c)',
    'y = a * (b / c)',
    'y = a * b % c',
    'speed = -8',
    'print("chào")',
    'play_sound("flap")',
    'play_music("happy")\nstop_music()',
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
    'xs = [40, 160, 280]',
    'xs = []',
    'for x in xs:\n    draw_rect(x, 300, 60, 60, "green")',
    'xs.append(220)',
    'n = len(xs)',
    'h = hs[i] + 1',
    'for i in range(len(hs)):\n    draw_rect(i * 80 + 40, 550 - hs[i], 60, hs[i], "teal")',
    'pairs = [[1, 2], [3, 4]]',
    'for k in d.keys():\n    pass',
    'pipes[i] = pipes[i] - 2',
    'def f(x):\n    return x * 2\n    print("hi")',
    'y = (not a) + 1',
    'if (x > 5) == True:\n    pass',
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

  test('lists are blocks: [ ], for each, append, len, xs[i]', () => {
    const types = (src: string) => {
      const tree = py.parseBlocks(src);
      if (!tree.ok) throw new Error(tree.messageVi);
      return tree.statements;
    };
    expect(types('xs = [40, 160]')[0]?.inputs?.['VALUE']).toMatchObject({
      type: 'pq_list',
      extraState: { items: 2 },
    });
    expect(types('for x in xs:\n    pass')[0]).toMatchObject({
      type: 'pq_for_each',
      fields: { VAR: 'x' },
    });
    expect(types('xs.append(5)')[0]).toMatchObject({ type: 'pq_append', fields: { NAME: 'xs' } });
    expect(types('n = len(xs)')[0]?.inputs?.['VALUE']?.type).toBe('pq_len');
    expect(types('h = hs[i]')[0]?.inputs?.['VALUE']).toMatchObject({
      type: 'pq_index',
      fields: { NAME: 'hs' },
    });
  });

  test.each([
    'gravity = 0.5',
    'speed = -2.25',
    'pipe[0] = pipe[0] - 2',
    'pipe[1] = random_int(80, 300)',
    'def update():\n    if dead:\n        return\n    y += 1',
    'draw_text(str(score), 200, 60, 56)',
    'draw_text("Thua rồi!", 200, 250, 48)',
    'ok = a and b and c and d',
    'ok = a or b or c',
    'return px >= x and px <= x + w and py >= y and py <= y + h',
  ])('game-part code %j is real blocks (no code text) and survives the round trip', (source) => {
    const tree = py.parseBlocks(source);
    if (!tree.ok) throw new Error(tree.messageVi);
    expect(JSON.stringify(tree.statements)).not.toContain('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test.each(['x = 1.0', 'x = 0.50', 'x = 1e-7', 'x = 0.0000001', 'x = (a and b) and c'])(
    '%j stays code text, so it comes back exactly as typed',
    (source) => {
      const tree = py.parseBlocks(source);
      expect(tree.ok && JSON.stringify(tree.statements)).toContain('pq_raw');
      expect(roundTrip(source).trimEnd()).toBe(source);
    },
  );

  test('new game-part blocks have the right types', () => {
    const first = (src: string) => {
      const tree = py.parseBlocks(src);
      if (!tree.ok) throw new Error(tree.messageVi);
      return tree.statements[0];
    };
    expect(first('xs[i] = 5')).toMatchObject({ type: 'pq_index_set', fields: { NAME: 'xs' } });
    expect(first('draw_text("a", 1, 2, 30)')?.type).toBe('pq_draw_text_size');
    expect(first('t = str(n)')?.inputs?.['VALUE']?.type).toBe('pq_str');
    expect(first('g = 0.5')?.inputs?.['VALUE']).toEqual({
      type: 'pq_number',
      fields: { NUM: 0.5 },
    });
    expect(first('return')).toEqual({ type: 'pq_return' });
  });

  test('a def with only a bare return gives no value block', () => {
    const tree = py.parseBlocks('def update():\n    return');
    if (!tree.ok) throw new Error('parse');
    expect(callBlocksFor(tree.statements).map((b) => b.type)).toEqual(['pq_call']);
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

  test('I3: blocks built by hand keep the brackets their meaning needs', () => {
    const cmp = (a: object, op: string, b: object) => ({
      type: 'pq_compare',
      fields: { OP: op },
      inputs: { A: a, B: b },
    });
    const v = (n: string) => ({ type: 'pq_var_get', fields: { NAME: n } });
    const t = { type: 'pq_bool', fields: { BOOL: 'True' } };
    const logic = (op: string, a: object, b: object) => ({
      type: 'pq_logic',
      fields: { OP: op },
      inputs: { A: a, B: b },
    });
    const assign = (value: object) => [
      { type: 'pq_assign', fields: { NAME: 'r' }, inputs: { VALUE: value } },
    ];
    expect(toPython(treeToState(assign(cmp(cmp(v('x'), '>', v('y')), '==', t)) as never))).toBe(
      'r = (x > y) == True\n',
    );
    expect(
      toPython(treeToState(assign(logic('and', logic('or', v('a'), v('b')), v('c'))) as never)),
    ).toBe('r = (a or b) and c\n');
    const plus = {
      type: 'pq_arith',
      fields: { OP: '+' },
      inputs: {
        A: { type: 'pq_not', inputs: { A: v('a') } },
        B: { type: 'pq_number', fields: { NUM: 1 } },
      },
    };
    expect(toPython(treeToState(assign(plus) as never))).toBe('r = (not a) + 1\n');
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

describe('sound blocks', () => {
  test('play_sound / play_music / stop_music are real blocks with a list of names', () => {
    const tree = py.parseBlocks('play_music("calm")\nplay_sound("hit")\nstop_music()');
    if (!tree.ok) throw new Error(tree.messageVi);
    expect(tree.statements.map((b) => [b.type, b.fields])).toEqual([
      ['pq_play_music', { MUSIC: 'calm' }],
      ['pq_play_sound', { SOUND: 'hit' }],
      ['pq_stop_music', undefined],
    ]);
  });

  test('a name that is not on the list stays as typed (raw code), so Python can explain the mistake', () => {
    const tree = py.parseBlocks('play_sound("meo")');
    if (!tree.ok) throw new Error(tree.messageVi);
    expect(tree.statements[0]?.type).toBe('pq_raw');
  });
});

describe('coordinate drawing blocks (ADR 0009)', () => {
  const first = (src: string) => {
    const tree = py.parseBlocks(src);
    if (!tree.ok) throw new Error(tree.messageVi);
    return tree.statements[0];
  };

  test.each([
    ['draw_circle(300, 200, 50, "gold")', 'pq_draw_circle'],
    ['draw_circle(x + 10, y, r * 2, color)', 'pq_draw_circle'],
    ['draw_line(0, 0, 600, 600, "black")', 'pq_draw_line'],
    ['draw_line(0, 300, WIDTH, 300, "blue", 8)', 'pq_draw_line_width'],
    ['draw_triangle(150, 450, 300, 150, 450, 450, "purple")', 'pq_draw_triangle'],
    ['for i in range(5):\n    draw_circle(300, 300, 200 - i * 40, "red")', 'pq_for'],
  ])('%j is a real block (%s) and survives the round trip', (source, type) => {
    const tree = py.parseBlocks(source);
    if (!tree.ok) throw new Error(tree.messageVi);
    expect(tree.statements[0]?.type).toBe(type);
    expect(JSON.stringify(tree.statements)).not.toContain('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('the line block with a width keeps its six values in order', () => {
    expect(Object.keys(first('draw_line(1, 2, 3, 4, "red", 5)')?.inputs ?? {})).toEqual([
      'X1',
      'Y1',
      'X2',
      'Y2',
      'COLOR',
      'WIDTH',
    ]);
  });

  test.each([
    'draw_polygon([(0, 0), (100, 0), (50, 80)], "teal")',
    'draw_circle(300, 300, 50)',
    'draw_line(0, 0, 10, 10)',
    'draw_circle(300, 300, r=50, color="red")',
  ])('%j stays code text and comes back exactly as typed', (source) => {
    expect(first(source)?.type).toBe('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('the toolbox puts the new blocks under Vẽ, ready to run on a 600 × 600 stage', () => {
    const tb = toolboxFor([
      'pq_draw_circle',
      'pq_draw_line',
      'pq_draw_line_width',
      'pq_draw_triangle',
    ]);
    if (tb.kind !== 'categoryToolbox') throw new Error('categories');
    expect(tb.contents.map((c) => c.name)).toEqual(['Vẽ']);
    const blocks = tb.contents[0]?.contents ?? [];
    expect(blocks.map((b) => b.type)).toEqual([
      'pq_draw_circle',
      'pq_draw_line',
      'pq_draw_line_width',
      'pq_draw_triangle',
    ]);
    for (const b of blocks) {
      const state = { blocks: { languageVersion: 0, blocks: [{ ...b, x: 0, y: 0 }] } };
      expect(toPython(state)).toMatch(/^draw_\w+\(\d+, \d+, .*"\w+".*\)\n$/);
    }
    expect(
      toPython({ blocks: { languageVersion: 0, blocks: [{ ...blocks[0], x: 0, y: 0 }] } }),
    ).toBe('draw_circle(300, 300, 100, "orange")\n');
  });
});

describe('keys, mouse and click blocks (ADR 0010)', () => {
  const condition = (src: string) => {
    const tree = py.parseBlocks(`x = ${src}`);
    if (!tree.ok) throw new Error(tree.messageVi);
    return tree.statements[0]?.inputs?.['VALUE'];
  };

  test.each([...KEYS])('key_pressed("%s") is a block with that key', (k) => {
    const src = `key_pressed("${k}")`;
    expect(condition(src)).toEqual({ type: 'pq_key_held', fields: { KEY: k } });
    expect(roundTrip(`x = ${src}`).trimEnd()).toBe(`x = ${src}`);
  });

  test.each([
    ['key_pressed()', 'pq_key_pressed'],
    ['mouse_x()', 'pq_mouse_x'],
    ['mouse_y()', 'pq_mouse_y'],
    ['clicked()', 'pq_clicked'],
  ])('%s is its own block', (src, type) => {
    expect(condition(src)).toEqual({ type });
    expect(roundTrip(`x = ${src}`).trimEnd()).toBe(`x = ${src}`);
  });

  test.each([
    'if clicked() and mouse_y() > 300:\n    x = mouse_x() - 10',
    'if key_pressed("left") or key_pressed("1"):\n    x -= 4',
    'if not key_pressed("space"):\n    x = 0',
  ])('%j is made of real blocks', (source) => {
    const tree = py.parseBlocks(source);
    if (!tree.ok) throw new Error(tree.messageVi);
    expect(JSON.stringify(tree.statements)).not.toContain('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test.each([
    'key_pressed("meo")',
    "key_pressed('left')",
    'key_pressed(k)',
    'key_pressed(1)',
    'key_pressed(key="left")',
    'mouse_x(1)',
  ])('%s stays as typed', (src) => {
    expect(condition(src)?.type).toBe('pq_raw_expr');
    expect(roundTrip(`x = ${src}`).trimEnd()).toBe(`x = ${src}`);
  });

  test('a def of the child with one of these names stays a call of that def', () => {
    const source = 'def clicked():\n    return 1\n\n\nx = clicked()';
    expect(JSON.stringify(py.parseBlocks(source))).toContain('pq_call_expr');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('draw_image keeps its block, scale alone has its own (ADR 0011); mirror and the rest stay code text', () => {
    const types = ['', ', flip=True', ', scale=2', ', mirror=True', ', flip=True, scale=2'].map(
      (rest) => {
        const source = `draw_image("images/bird.png", 1, 2${rest})`;
        expect(roundTrip(source).trimEnd()).toBe(source);
        const tree = py.parseBlocks(source);
        return tree.ok && tree.statements[0]?.type;
      },
    );
    expect(types).toEqual([
      'pq_draw_image',
      'pq_draw_image',
      'pq_draw_image_scale',
      'pq_raw',
      'pq_raw',
    ]);
  });

  test('the toolbox puts them under Điều kiện', () => {
    const ids = ['pq_key_pressed', 'pq_key_held', 'pq_mouse_x', 'pq_mouse_y', 'pq_clicked'];
    const tb = toolboxFor(ids);
    if (tb.kind !== 'categoryToolbox') throw new Error('categories');
    expect(tb.contents.map((c) => [c.name, c.contents.map((b) => b.type)])).toEqual([
      ['Điều kiện', ids],
    ]);
    const fresh = { blocks: { languageVersion: 0, blocks: [{ type: 'pq_key_held', x: 0, y: 0 }] } };
    expect(toPython(fresh)).toContain('key_pressed("left")');
  });
});

describe('named boxes (dict), abs, remove and scaled pictures (ADR 0011)', () => {
  const statements = (src: string) => {
    const tree = py.parseBlocks(src);
    if (!tree.ok) throw new Error(tree.messageVi);
    return tree.statements;
  };
  const valueOf = (expr: string) => statements(`v = ${expr}`)[0]?.inputs?.['VALUE'];
  const fresh = (type: string) => {
    const tb = toolboxFor([type]);
    if (tb.kind !== 'categoryToolbox') throw new Error('categories');
    const block = tb.contents[0]?.contents[0];
    return { blocks: { languageVersion: 0, blocks: [{ ...block, x: 0, y: 0 }] } };
  };
  const num = (n: number) => ({ type: 'pq_number', fields: { NUM: n } });
  const text = (t: string) => ({ type: 'pq_text', fields: { TEXT: t } });

  test.each([
    'hero = {"x": 300, "hp": 5}',
    'hero = {}',
    'hero = {"tên": "Kiếm sĩ", "tốc độ": 2.5, "sống": True}',
    'hero = {"pos": {"x": 1, "y": 2}, "skills": [], "bag": ["ngọc", "tim"]}',
    'mobs = [{"x": 1, "hp": 2}, {"x": 5, "hp": 3}]',
    'mobs.append({"x": random_int(0, 600), "y": y + 10 * 2, "hp": 3})',
    'x = hero["x"]',
    'x = mob["x"] + mob["size"] / 2',
    'mob["x"] = 5',
    'mob["x"] = mob["x"] - 2',
    'mob["kind"] = "bat"',
    'mob["hp"] -= 1',
    'mob["x"] += mob["speed"] * 2',
    'xs[i] += 1',
    'xs[0] -= step',
    'for mob in mobs:\n    mob["hp"] -= 1\n    if mob["hp"] <= 0:\n        mobs.remove(mob)',
    'for s in hero["skills"]:\n    print(s)',
    'xs.remove(40)',
    'xs.remove({"x": 1})',
    'd = abs(a - b)',
    'if abs(a["x"] - b["x"]) < 40 and abs(a["y"] - b["y"]) < 40:\n    hit = True',
    'def near(a, b, d):\n    return abs(a["x"] - b["x"]) < d\nok = near(hero, mob, 30)',
    'draw_image("images/hero-knight.png", hero["x"], hero["y"], scale=3)',
    'draw_image(path, x, y, scale=size / 2)',
    'n = len(hero["bag"])',
    'return {"x": 1}',
    'print({"x": 1})',
  ])('%j is real blocks (no code text) and survives the round trip', (source) => {
    expect(JSON.stringify(statements(source))).not.toContain('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('the blocks are the ones the lessons name', () => {
    expect(valueOf('{"x": 1, "hp": 5}')).toEqual({
      type: 'pq_dict',
      extraState: { items: 2 },
      fields: { KEY0: 'x', KEY1: 'hp' },
      inputs: { ITEM0: num(1), ITEM1: num(5) },
    });
    expect(valueOf('mob["x"]')).toEqual({ type: 'pq_key_get', fields: { NAME: 'mob', KEY: 'x' } });
    expect(valueOf('xs[i]')?.type).toBe('pq_index');
    expect(statements('mob["x"] = 1')[0]).toEqual({
      type: 'pq_key_set',
      fields: { NAME: 'mob', KEY: 'x' },
      inputs: { VALUE: num(1) },
    });
    expect(statements('xs[0] = 1')[0]?.type).toBe('pq_index_set');
    expect(statements('mob["hp"] -= 1')[0]).toEqual({
      type: 'pq_key_aug',
      fields: { NAME: 'mob', OP: '-=' },
      inputs: { INDEX: text('hp'), VALUE: num(1) },
    });
    expect(statements('xs[i] += 1')[0]?.type).toBe('pq_key_aug');
    expect(valueOf('abs(a - b)')?.type).toBe('pq_abs');
    expect(statements('xs.remove(1)')[0]?.type).toBe('pq_remove');
    expect(statements('draw_image("a", 1, 2, scale=3)')[0]?.type).toBe('pq_draw_image_scale');
  });

  test.each([
    // the keys are not plain words
    'd = {1: "a", 2: "b"}',
    'd = {k: 1}',
    'd = {"a": 1, **more}',
    "d = {'x': 1}",
    'd = {"a \\"quoted\\" key": 1}',
    'd = {"đường\\n": 1}',
    // typed in another way than the blocks write it
    'd = {"x":1}',
    'd = { "x": 1 }',
    'd = {"x": 1,}',
    'd = {"x": (1)}',
    'd = {"x": a+b}',
    'n = abs(a-b)',
    'n = abs((a - b))',
    'n = abs(x for x in xs)',
    'n = abs(a, b)',
    'mob["hp"]-=1',
    'mob["hp"] -= (a + b)',
    'mob["hp"] *= 2',
    'xs.remove( 1 )',
    'xs.remove(1, 2)',
    'mobs[0].remove(1)',
    'draw_image("a", 1, 2, scale = 3)',
    'draw_image("a", 1, 2, 0, scale=3)',
    'draw_image("a", 1, y=2, scale=3)',
    'draw_image("a", 1, 2, scale=3, mirror=True)',
    'draw_image("a", 1, 2, scale=3)  # to gấp 3',
    'xs[1:2] += [3]',
    'mobs[0]["x"] -= 1',
    'mobs[0]["x"] = 1',
    'x = mobs[0]["x"]',
    'x = {"x": 1}["x"]',
    'x = hero["bag"][0]',
    'ok = 0 <= mob["x"] < 600',
  ])('%j keeps some code text and comes back exactly as typed', (source) => {
    expect(JSON.stringify(statements(source))).toContain('pq_raw');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test.each([
    'hero = {"a": "it\'s", "b": \'x\', "c": f"{n}", "d": "\\n"}',
    'if 0 <= mob["x"] < 600 and not mob["dead"]:\n    pass',
    'hero = {"ok": 0 <= x < 5, "far": abs(x) > 3 or y == 2}',
    'mob["x"] = a if b else c',
    'mob["x"] = -speed',
    'mob["x"] += -speed',
  ])('%j comes back exactly as typed, whatever blocks it makes', (source) => {
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test.each([
    'MOBS = {\n    "bat": {"hp": 5, "speed": 2.1},\n    "golem": {"hp": 32, "speed": 0.8},\n}',
    'WAVES = [\n    {"bat": 3},\n    {"bat": 5, "golem": 1},\n]',
    'def spawn():\n    mob = {\n        "x": 1,\n        "y": 2,\n    }\n    mobs.append({"x": 1,\n                 "y": 2})\n    return mob',
  ])('a table over several lines is code text, also inside a def: %j', (source) => {
    expect(JSON.stringify(statements(source))).toContain('pq_raw"');
    expect(JSON.stringify(statements(source))).not.toContain('pq_dict');
    expect(roundTrip(source).trimEnd()).toBe(source);
  });

  test('a string that is not a plain "…" key keeps the old list blocks, text unchanged', () => {
    expect(valueOf("xs['a']")).toMatchObject({ type: 'pq_index', fields: { NAME: 'xs' } });
    expect(statements("xs['a'] = 1")[0]?.type).toBe('pq_index_set');
    for (const src of ["v = xs['a']", "xs['a'] = 1"]) expect(roundTrip(src).trimEnd()).toBe(src);
    // Spaces inside the brackets were tidied by the list block before; they still are.
    expect(roundTrip('v = xs[ "a" ]').trimEnd()).toBe('v = xs["a"]');
  });

  test("the child's own def abs or draw_image is not taken over", () => {
    const own = 'def abs(n):\n    return n\n\n\nv = abs(3)';
    expect(JSON.stringify(statements(own))).toContain('pq_call_expr');
    expect(roundTrip(own).trimEnd()).toBe(own);
    const draw = 'def draw_image(a, b, c, scale):\n    pass\n\n\ndraw_image(1, 2, 3, scale=4)';
    expect(JSON.stringify(statements(draw))).not.toContain('pq_draw_image_scale');
    expect(roundTrip(draw).trimEnd()).toBe(draw);
  });

  test('a workspace saved before these blocks (list blocks with a word inside) still loads', () => {
    const saved = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'pq_index_set',
            x: 20,
            y: 20,
            fields: { NAME: 'xs' },
            inputs: {
              INDEX: { block: text('a') },
              VALUE: {
                block: {
                  type: 'pq_index',
                  fields: { NAME: 'xs' },
                  inputs: { INDEX: { block: text('b') } },
                },
              },
            },
            next: {
              block: {
                type: 'pq_assign',
                fields: { NAME: 'd' },
                inputs: {
                  VALUE: { block: { type: 'pq_raw_expr', fields: { CODE: '{"x": 1}' } } },
                },
                next: {
                  block: { type: 'pq_raw', extraState: { code: 'xs.remove(1)\nxs[0] += abs(d)' } },
                },
              },
            },
          },
        ],
      },
    };
    expect(toPython(saved)).toBe(
      'xs["a"] = xs["b"]\nd = {"x": 1}\nxs.remove(1)\nxs[0] += abs(d)\n',
    );
  });

  test('a saved workspace with the new blocks keeps names, values and the number of slots', () => {
    const tree = statements('hero = {"hp": 5}\nmob = {"a": 1, "b": 2, "c": 3, "d": 4}');
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(treeToState(tree), ws);
    const saved = JSON.parse(JSON.stringify(Blockly.serialization.workspaces.save(ws))) as object;
    ws.dispose();
    expect(toPython(saved)).toBe('hero = {"hp": 5}\nmob = {"a": 1, "b": 2, "c": 3, "d": 4}\n');
  });

  test('a key with a quote typed into a block is still valid Python', () => {
    const state = {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'pq_key_set', x: 0, y: 0, fields: { NAME: 'd', KEY: 'a"b' } }],
      },
    };
    expect(toPython(state)).toBe('d["a\\"b"] = None\n');
    expect(py.parseBlocks(toPython(state)).ok).toBe(true);
  });

  test.each([
    ['pq_dict', 'Hộp có tên', '{"x": 300, "y": 300, "hp": 5}\n'],
    ['pq_key_get', 'Hộp có tên', 'hero["x"]\n'],
    ['pq_key_set', 'Hộp có tên', 'hero["x"] = 0\n'],
    ['pq_key_aug', 'Hộp có tên', 'hero["x"] += 1\n'],
    ['pq_abs', 'Số và chữ', 'abs(-5)\n'],
    ['pq_remove', 'Danh sách', 'xs.remove(40)\n'],
    ['pq_draw_image_scale', 'Vẽ', 'draw_image("images/hero-knight.png", 300, 300, scale=3)\n'],
  ])('a fresh %s from the toolbox (%s) is ready to use', (type, category, code) => {
    const tb = toolboxFor([type]);
    expect(tb.kind === 'categoryToolbox' && tb.contents.map((c) => c.name)).toEqual([category]);
    expect(toPython(fresh(type))).toBe(code);
  });

  test('together the fresh blocks run', async () => {
    const body = ['pq_key_set', 'pq_key_aug'].map((t) => toPython(fresh(t))).join('');
    const r = await py.runScript(
      { 'main.py': `hero = ${toPython(fresh('pq_dict'))}${body}v = hero["x"] + abs(-5)\n` },
      'main.py',
      { seed: 1, maxEvents: 100 },
    );
    expect(r.error).toBeUndefined();
    expect(r.vars['v']).toBe(6);
  });
});
