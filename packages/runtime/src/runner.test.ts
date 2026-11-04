import { beforeAll, describe, expect, test } from 'vitest';
import { PyRunner } from './index';

let py: PyRunner;
beforeAll(async () => {
  py = await PyRunner.create();
  py.setAssets(['bird', 'bird-cu', 'bird-rong', 'pipe']);
});

const IMPORT = 'from pyquest import *\n';
/** Lesson code always starts with the import, like real Python. */
const run = (code: string, maxEvents = 5000) =>
  py.runScript({ 'main.py': IMPORT + code }, 'main.py', { seed: 1, maxEvents });

describe('script mode', () => {
  test('draw_rect records a rect event', async () => {
    const r = await run('draw_rect(10, 20, 30, 40, "red")');
    expect(r.error).toBeUndefined();
    expect(r.events).toContainEqual({ t: 'rect', x: 10, y: 20, w: 30, h: 40, color: 'red' });
  });

  test('draw_image draws a library picture by its path', async () => {
    const r = await run('draw_image("images/bird.png", 100, 200)');
    expect(r.error).toBeUndefined();
    expect(r.events).toContainEqual({ t: 'sprite', sprite: 'bird', x: 100, y: 200, frame: 0 });
  });

  test("the library holds only the smallest pieces: draw_bird is the child's own job", async () => {
    const r = await run('draw_bird(1, 2)');
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain('draw_bird');
    expect(r.error?.messageVi).not.toContain('from pyquest');
    for (const gone of ['draw_sprite', 'use_sprite']) {
      expect((await run(`${gone}("bird", 1, 2)`)).error?.messageVi).toContain(gone);
    }
  });

  test('without the import, a library command is unknown and the message says what to add', async () => {
    const r = await py.runScript({ 'main.py': 'draw_rect(1, 2, 3, 4)' }, 'main.py', {
      seed: 1,
      maxEvents: 100,
    });
    expect(r.error?.line).toBe(1);
    expect(r.error?.messageVi).toContain('from pyquest import *');
  });

  test('plain print works without the import and still becomes a bubble', async () => {
    const r = await py.runScript({ 'main.py': 'print("chào", 3)' }, 'main.py', {
      seed: 1,
      maxEvents: 100,
    });
    expect(r.error).toBeUndefined();
    expect(r.events).toContainEqual({ t: 'say', text: 'chào 3' });
  });

  test('draw_image can flip a picture upside down', async () => {
    const r = await run('draw_image("images/pipe.png", 10, 20, flip=True)');
    expect(r.events).toContainEqual({
      t: 'sprite',
      sprite: 'pipe',
      x: 10,
      y: 20,
      frame: 0,
      flip: true,
    });
  });

  test('print becomes a speech bubble', async () => {
    const r = await run('print("xin chào")');
    expect(r.events).toContainEqual({ t: 'say', text: 'xin chào' });
  });

  test('print joins several values with spaces', async () => {
    const r = await run('print("x =", 5)');
    expect(r.events).toContainEqual({ t: 'say', text: 'x = 5' });
  });

  test('module-level variables are reported, private names and functions are not', async () => {
    const r = await run('x = 5\nname = "Lửa"\n_hidden = 1\ndef f():\n    pass\nimport math');
    expect(r.vars).toEqual({ x: 5, name: 'Lửa' });
  });

  test('a missing bracket is a Vietnamese syntax error on line 1', async () => {
    const r = await run('draw_rect(1, 2');
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain('thiếu dấu ngoặc');
    expect(r.events).toEqual([]);
  });

  test('an unknown command names itself', async () => {
    const r = await run('x = 1\ndrw_rect(1, 2)');
    expect(r.error?.line).toBe(3);
    expect(r.error?.messageVi).toContain('drw_rect');
  });

  test('an endless drawing loop stops at the event limit', async () => {
    const r = await run('while True:\n    draw_rect(0, 0, 1, 1)', 5000);
    expect(r.stoppedByLimit).toBe(true);
    expect(r.error).toBeUndefined();
  });

  test('an endless empty loop stops at the line limit', async () => {
    const r = await py.runScript({ 'main.py': IMPORT + 'while True:\n    pass' }, 'main.py', {
      seed: 1,
      maxEvents: 5000,
      maxLines: 20_000,
    });
    expect(r.stoppedByLimit).toBe(true);
  });

  test('random_int is the same for the same seed', async () => {
    const code = 'a = random_int(1, 100)\nb = random_int(1, 100)';
    const one = await run(code);
    const two = await run(code);
    expect(one.vars).toEqual(two.vars);
  });

  test('files from a previous run do not leak into the next', async () => {
    await py.runScript({ 'main.py': 'import helper', 'helper.py': 'v = 1' }, 'main.py', {
      seed: 1,
      maxEvents: 100,
    });
    const r = await run('import helper');
    expect(r.error?.messageVi).toBeDefined();
  });

  test('the program can import its own second file', async () => {
    const r = await py.runScript(
      {
        'main.py': 'from tools import twice\nx = twice(4)',
        'tools.py': 'def twice(n):\n    return n * 2',
      },
      'main.py',
      { seed: 1, maxEvents: 100 },
    );
    expect(r.vars['x']).toBe(8);
  });
});

describe('pictures from the library by path', () => {
  test('a wrong path is a Vietnamese error naming the file', async () => {
    const r = await run('draw_image("images/bird-meo.png", 0, 0)');
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain('images/bird-meo.png');
  });

  test('a near-miss path suggests the real file', async () => {
    const r = await run('draw_image("images/rong.png", 0, 0)');
    expect(r.error?.messageVi).toContain('images/bird-rong.png');
    const typo = await run('draw_image("images/Bird-Rong.png", 0, 0)');
    expect(typo.error?.messageVi).toContain('images/bird-rong.png');
  });

  test('a path outside images/ is refused', async () => {
    const r = await run('draw_image("bird-cu.png", 0, 0)');
    expect(r.error?.messageVi).toContain('images/');
  });
});

const BIRD =
  'def draw_bird(x, y):\n' +
  '    draw_rect(x, y + 10, 30, 20, "red")\n' +
  '    draw_rect(x + 30, y + 14, 8, 8, "orange")\n' +
  '    draw_rect(x + 8, y, 14, 10, "red")\n';

describe("calls: what the child's own functions did", () => {
  test("each call of a child's function is recorded with its arguments and line", async () => {
    const r = await run(BIRD + 'draw_bird(100, 300)\ndraw_bird(200, 100)');
    expect(r.error).toBeUndefined();
    expect(r.calls).toEqual([
      { id: 0, parent: null, name: 'draw_bird', args: { x: 100, y: 300 }, line: 6 },
      { id: 1, parent: null, name: 'draw_bird', args: { x: 200, y: 100 }, line: 7 },
    ]);
  });

  test('every drawing knows which call made it', async () => {
    const r = await run(BIRD + 'draw_bird(100, 300)\ndraw_rect(0, 0, 5, 5)');
    const rects = r.events.filter((e) => e.t === 'rect');
    expect(rects.map((e) => e.by)).toEqual([0, 0, 0, undefined]);
    expect(rects[1]).toMatchObject({ x: 130, y: 314, w: 8, h: 8, color: 'orange' });
  });

  test('a call inside a call points at its parent', async () => {
    const r = await run(BIRD + 'def flock():\n    draw_bird(1, 2)\nflock()');
    expect(r.calls.map((c) => [c.id, c.parent, c.name])).toEqual([
      [0, null, 'flock'],
      [1, 0, 'draw_bird'],
    ]);
    expect(r.events.find((e) => e.t === 'rect')?.by).toBe(1);
  });

  test('arguments that are not numbers, words or True/False are shown short', async () => {
    const r = await run('def f(a, b):\n    pass\nf([1, 2, 3], None)');
    expect(r.calls[0]?.args).toEqual({ a: '[1, 2, 3]', b: 'None' });
  });

  test('a big loop records at most 300 calls but still draws everything', async () => {
    const r = await run(BIRD + 'for i in range(400):\n    draw_bird(i, 0)', 5000);
    expect(r.calls).toHaveLength(300);
    expect(r.callsTruncated).toBe(true);
    expect(r.events.filter((e) => e.t === 'rect')).toHaveLength(1200);
  });
});

describe('game mode', () => {
  test('step calls update then draw each frame', async () => {
    const code =
      IMPORT +
      'y = 0\ndef update():\n    global y\n    y += 10\ndef draw():\n    draw_image("images/bird.png", 0, y)';
    const start = await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    expect(start.error).toBeUndefined();
    const ys = [1, 2, 3].map(() => {
      const r = py.step({ keys: [], tapped: false });
      const sprite = r.events.find((e) => e.t === 'sprite');
      return sprite?.t === 'sprite' ? sprite.y : null;
    });
    expect(ys).toEqual([10, 20, 30]);
  });

  test('key_pressed sees space and taps', async () => {
    const code =
      IMPORT + 'hits = 0\ndef update():\n    global hits\n    if key_pressed():\n        hits += 1';
    await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    py.step({ keys: ['space'], tapped: false });
    py.step({ keys: [], tapped: true });
    const r = py.step({ keys: [], tapped: false });
    expect(r.vars['hits']).toBe(2);
  });

  test('a frame records the calls made during that frame only', async () => {
    const code = IMPORT + 'def update():\n    pass\ndef draw():\n    clear()';
    await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    py.step({ keys: [], tapped: false });
    const r = py.step({ keys: [], tapped: false });
    expect(r.calls.map((c) => c.name)).toEqual(['update', 'draw']);
    expect(r.events.find((e) => e.t === 'clear')?.by).toBe(1);
  });

  test('a game without update() explains what is missing', async () => {
    const r = await py.startGame({ 'main.py': 'x = 1' }, 'main.py', { seed: 1 });
    expect(r.error?.messageVi).toContain('update()');
  });
});
