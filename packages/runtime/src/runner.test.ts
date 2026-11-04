import { beforeAll, describe, expect, test } from 'vitest';
import { PyRunner } from './index';

let py: PyRunner;
beforeAll(async () => {
  py = await PyRunner.create();
});

const IMPORT = 'from pyquest import *\n';
/** Lesson code always starts with the import, like real Python. */
const run = (code: string, maxEvents = 5000) =>
  py.runScript({ 'main.py': IMPORT + code }, 'main.py', { seed: 1, maxEvents });

describe('script mode', () => {
  test('draw_bird records a sprite event', async () => {
    const r = await run('draw_bird(100, 200)');
    expect(r.error).toBeUndefined();
    expect(r.events).toContainEqual({ t: 'sprite', sprite: 'bird', x: 100, y: 200, frame: 0 });
  });

  test('without the import, draw_bird is unknown and the message says what to add', async () => {
    const r = await py.runScript({ 'main.py': 'draw_bird(1, 2)' }, 'main.py', {
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

  test('draw_sprite can flip a picture upside down', async () => {
    const r = await run('draw_sprite("pipe", 10, 20, flip=True)');
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
    const r = await run('draw_bird(1, 2');
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain('thiếu dấu ngoặc');
    expect(r.events).toEqual([]);
  });

  test('an unknown command names itself', async () => {
    const r = await run('x = 1\ndrw_bird(1, 2)');
    expect(r.error?.line).toBe(3);
    expect(r.error?.messageVi).toContain('drw_bird');
  });

  test('an endless drawing loop stops at the event limit', async () => {
    const r = await run('while True:\n    draw_bird(0, 0)', 5000);
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
  test('use_sprite swaps the bird for a library picture by its path', async () => {
    py.setAssets(['bird', 'bird-cu', 'pipe']);
    const r = await run('use_sprite("bird", "images/bird-cu.png")\ndraw_bird(10, 20)');
    expect(r.error).toBeUndefined();
    expect(r.events).toContainEqual({
      t: 'sprite',
      sprite: 'bird',
      asset: 'bird-cu',
      x: 10,
      y: 20,
      frame: 0,
    });
  });

  test('a wrong path is a Vietnamese error naming the file', async () => {
    py.setAssets(['bird', 'bird-cu']);
    const r = await run('use_sprite("bird", "images/bird-meo.png")');
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain('images/bird-meo.png');
  });

  test('a near-miss path suggests the real file', async () => {
    py.setAssets(['bird', 'bird-cu', 'bird-rong']);
    const r = await run('use_sprite("bird", "images/rong.png")');
    expect(r.error?.messageVi).toContain('images/bird-rong.png');
    const typo = await run('use_sprite("bird", "images/Bird-Rong.png")');
    expect(typo.error?.messageVi).toContain('images/bird-rong.png');
  });

  test('a path outside images/ is refused', async () => {
    py.setAssets(['bird-cu']);
    const r = await run('use_sprite("bird", "bird-cu.png")');
    expect(r.error?.messageVi).toContain('images/');
  });
});

describe('game mode', () => {
  test('step calls update then draw each frame', async () => {
    const code =
      IMPORT + 'y = 0\ndef update():\n    global y\n    y += 10\ndef draw():\n    draw_bird(0, y)';
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

  test('a game without update() explains what is missing', async () => {
    const r = await py.startGame({ 'main.py': 'x = 1' }, 'main.py', { seed: 1 });
    expect(r.error?.messageVi).toContain('update()');
  });
});
