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

  test('M4: a class body is not a call; long words are cut short', async () => {
    const r = await run(
      'class Bird:\n    def hop(self, word):\n        pass\nBird().hop("a" * 100)',
    );
    expect(r.calls.map((c) => c.name)).toEqual(['hop']);
    expect(String(r.calls[0]?.args['word']).length).toBeLessThanOrEqual(30);
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

describe('sounds and music (play_sound, play_music, stop_music)', () => {
  test('play_sound records a sound event; play_music and stop_music record music events', async () => {
    const r = await run('play_music("happy")\nplay_sound("flap")\nstop_music()');
    expect(r.error).toBeUndefined();
    expect(r.events).toEqual([
      { t: 'music', name: 'happy' },
      { t: 'sound', name: 'flap' },
      { t: 'music', name: null },
    ]);
  });

  test('a mistyped sound name says which one was meant', async () => {
    const r = await run('play_sound("flapp")');
    expect(r.error?.messageVi).toContain('"flap"');
    const m = await run('play_music("vui")');
    expect(m.error?.messageVi).toContain('happy');
  });

  test('the sound names in Python are the ones the page can play', async () => {
    const { SOUNDS, MUSIC } = await import('./index');
    for (const s of SOUNDS) expect((await run(`play_sound("${s}")`)).error).toBeUndefined();
    for (const m of MUSIC) expect((await run(`play_music("${m}")`)).error).toBeUndefined();
  });
});

describe('coordinate drawing (draw_circle, draw_line, draw_triangle, draw_polygon)', () => {
  test('each command records its event, with defaults', async () => {
    const r = await run(
      'draw_circle(300, 200, 50)\ndraw_line(0, 0, 600, 600)\ndraw_line(1, 2, 3, 4, "red", 8)\n' +
        'draw_triangle(100, 400, 200, 250, 300, 400)\ndraw_polygon([(0, 0), [10, 0], (5, 8)], "teal")',
    );
    expect(r.error).toBeUndefined();
    expect(r.events).toEqual([
      { t: 'circle', x: 300, y: 200, r: 50, color: 'orange' },
      { t: 'line', x1: 0, y1: 0, x2: 600, y2: 600, color: 'black', width: 3 },
      { t: 'line', x1: 1, y1: 2, x2: 3, y2: 4, color: 'red', width: 8 },
      {
        t: 'polygon',
        points: [
          [100, 400],
          [200, 250],
          [300, 400],
        ],
        color: 'purple',
      },
      {
        t: 'polygon',
        points: [
          [0, 0],
          [10, 0],
          [5, 8],
        ],
        color: 'teal',
      },
    ]);
  });

  test.each([
    ['draw_circle(1, 2, -5)', 'Bán kính'],
    ['draw_circle(1, "a", 5)', 'y phải là một số'],
    ['draw_line(0, 0, 10, 10, "red", 0)', 'Độ dày'],
    ['draw_polygon([(0, 0), (1, 1)])', 'ít nhất 3 góc'],
    ['draw_polygon([(0, 0), (1, 1), 5])', 'cặp số'],
    ['draw_polygon([(0, 0), (1, 1), (2, "b")])', 'phải là một số'],
    ['draw_polygon(5)', 'danh sách'],
    ['draw_triangle(0, 0, 1, 1, 2, "z")', 'y3 phải là một số'],
  ])('%s is a short Vietnamese error', async (code, words) => {
    const r = await run(code);
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain(words);
  });

  test('draw_ellipse and draw_arc record their events, with defaults', async () => {
    const r = await run(
      'draw_ellipse(300, 200, 80, 40)\ndraw_ellipse(1, 2, 3, 4, "red")\ndraw_arc(300, 300, 15, 0, 180)\n' +
        'draw_arc(1, 2, 3, 90, 270, "blue", 6)',
    );
    expect(r.error).toBeUndefined();
    expect(r.events).toEqual([
      { t: 'ellipse', x: 300, y: 200, w: 80, h: 40, color: 'pink' },
      { t: 'ellipse', x: 1, y: 2, w: 3, h: 4, color: 'red' },
      { t: 'arc', x: 300, y: 300, r: 15, start: 0, end: 180, color: 'black', width: 3 },
      { t: 'arc', x: 1, y: 2, r: 3, start: 90, end: 270, color: 'blue', width: 6 },
    ]);
  });

  test('border= draws an outline, and color=None leaves the inside empty', async () => {
    const r = await run(
      'draw_circle(10, 10, 5, "red", border="black")\ndraw_rect(0, 0, 5, 5, None, border="navy")\n' +
        'draw_ellipse(1, 1, 2, 2, border="gold")\ndraw_triangle(0, 0, 1, 0, 0, 1, "teal", border="white")\n' +
        'draw_polygon([(0, 0), (1, 0), (0, 1)], None, border="red")\ndraw_circle(1, 1, 1)',
    );
    expect(r.error).toBeUndefined();
    expect(r.events).toEqual([
      { t: 'circle', x: 10, y: 10, r: 5, color: 'red', border: 'black' },
      { t: 'rect', x: 0, y: 0, w: 5, h: 5, color: 'none', border: 'navy' },
      { t: 'ellipse', x: 1, y: 1, w: 2, h: 2, color: 'pink', border: 'gold' },
      {
        t: 'polygon',
        points: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        color: 'teal',
        border: 'white',
      },
      {
        t: 'polygon',
        points: [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
        color: 'none',
        border: 'red',
      },
      { t: 'circle', x: 1, y: 1, r: 1, color: 'orange' },
    ]);
  });

  test.each([
    ['draw_ellipse(0, 0, -1, 5)', 'không được nhỏ hơn 0'],
    ['draw_ellipse(0, 0, 5, "a")', 'h phải là một số'],
    ['draw_circle(0, 0, 5, None)', 'cần border'],
    ['draw_arc(0, 0, 5, "a", 90)', 'start phải là một số'],
    ['draw_arc(0, 0, 5, 0, 90, width=0)', 'lớn hơn 0'],
    ['draw_arc(0, 0, -5, 0, 90)', 'Bán kính'],
  ])('%s is a short Vietnamese error too', async (code, words) => {
    const r = await run(code);
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain(words);
  });

  test("a shape drawn inside the child's function knows which call drew it", async () => {
    const r = await run(
      'def sun(x):\n    draw_circle(x, 80, 40, "gold")\n    draw_triangle(x, 0, x, 1, 0, 1)\nsun(300)',
    );
    expect(r.events.map((e) => e.t !== 'frame' && e.by)).toEqual([0, 0]);
  });
});

describe('stage size per run (ADR 0009)', () => {
  const SIZE = 'from pyquest import *\nprint(WIDTH, HEIGHT)\n';
  const said = (r: { events: { t: string; text?: string }[] }) =>
    r.events.filter((e) => e.t === 'say').map((e) => e.text);

  test('WIDTH and HEIGHT follow the run’s stage, and go back to 400 × 600 without one', async () => {
    const opts = { seed: 1, maxEvents: 100 };
    const square = { ...opts, stage: { width: 600, height: 600 } };
    expect(said(await py.runScript({ 'main.py': SIZE }, 'main.py', square))).toEqual(['600 600']);
    expect(said(await py.runScript({ 'main.py': SIZE }, 'main.py', opts))).toEqual(['400 600']);
    expect(said(await py.runScript({ 'main.py': SIZE }, 'main.py', square))).toEqual(['600 600']);
  });

  test("the child's second file and import pyquest see the same size", async () => {
    const files = {
      'main.py':
        'from pyquest import *\nimport pyquest\nimport size\nprint(size.W, pyquest.HEIGHT)\n',
      'size.py': 'from pyquest import *\nW = WIDTH\n',
    };
    const r = await py.runScript(files, 'main.py', {
      seed: 1,
      maxEvents: 100,
      stage: { width: 600, height: 500 },
    });
    expect(said(r)).toEqual(['600 500']);
  });

  test('a game sees its stage size in update() on every frame', async () => {
    const code =
      IMPORT + 'def update():\n    pass\ndef draw():\n    draw_circle(WIDTH / 2, HEIGHT / 2, 10)';
    await py.startGame({ 'main.py': code }, 'main.py', {
      seed: 1,
      stage: { width: 600, height: 600 },
    });
    expect(py.step({ keys: [], tapped: false }).events[0]).toMatchObject({ x: 300, y: 300 });
    await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    expect(py.step({ keys: [], tapped: false }).events[0]).toMatchObject({ x: 200, y: 300 });
  });
});

describe('pictures, scaled and mirrored (ADR 0010)', () => {
  test('scale and mirror are in the event only when they change the picture', async () => {
    const r = await run(
      'draw_image("images/bird.png", 1, 2)\n' +
        'draw_image("images/bird.png", 1, 2, 0, False, 1.0, False)\n' +
        'draw_image("images/bird.png", 1, 2, scale=2, mirror=True)\n' +
        'draw_image("images/bird.png", 1, 2, frame=1, flip=True, scale=0.5)',
    );
    expect(r.error).toBeUndefined();
    expect(r.events.map((e) => JSON.stringify(e))).toEqual([
      '{"t":"sprite","sprite":"bird","x":1,"y":2,"frame":0}',
      '{"t":"sprite","sprite":"bird","x":1,"y":2,"frame":0}',
      '{"t":"sprite","sprite":"bird","x":1,"y":2,"frame":0,"scale":2,"mirror":true}',
      '{"t":"sprite","sprite":"bird","x":1,"y":2,"frame":1,"flip":true,"scale":0.5}',
    ]);
  });

  test.each([
    ['scale=0', 'scale phải lớn hơn 0'],
    ['scale=-1', 'scale phải lớn hơn 0'],
    ['scale=float("inf")', 'scale không được là inf'],
    ['scale=float("nan")', 'scale không được là nan'],
    ['scale="to"', 'scale phải là một số'],
    ['scale=True', 'scale phải là một số'],
    ['mirror="left"', 'mirror phải là True hoặc False'],
  ])('%s is a short Vietnamese error', async (arg, words) => {
    const r = await run(`draw_image("images/bird.png", 0, 0, ${arg})`);
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toContain(words);
    expect(r.events).toEqual([]);
  });
});

describe('mouse, click and keys (ADR 0010)', () => {
  const SEE = `${IMPORT}seen = ""
def update():
    global seen
    held = [k for k in ["left", "right", "up", "down", "space", "1", "2", "3"] if key_pressed(k)]
    seen = str(mouse_x()) + "," + str(mouse_y()) + " " + str(clicked()) + " " + "+".join(held)
`;
  const see = (input: Parameters<PyRunner['step']>[0]) => py.step(input).vars['seen'];
  const start = () => py.startGame({ 'main.py': SEE }, 'main.py', { seed: 1 });

  test('a step without a pointer is the old input: 0, 0 and no click', async () => {
    await start();
    expect(see({ keys: [], tapped: false })).toBe('0,0 False ');
  });

  test('pointer, click and keys of one step, and gone in the next one that lacks them', async () => {
    await start();
    expect(
      see({ keys: ['left', '2'], tapped: false, pointer: { x: 120, y: 450 }, clicked: true }),
    ).toBe('120,450 True left+2');
    expect(see({ keys: ['3'], tapped: false, pointer: { x: 121, y: 450 }, clicked: false })).toBe(
      '121,450 False 3',
    );
    expect(see({ keys: ['1', 'up', 'down', 'right'], tapped: true })).toBe(
      '0,0 False right+up+down+space+1',
    );
  });

  test('a new run forgets the pointer, and the top of the file can ask', async () => {
    await start();
    see({ keys: ['left'], tapped: true, pointer: { x: 5, y: 6 }, clicked: true });
    const r = await run('print(mouse_x(), mouse_y(), clicked(), key_pressed())');
    expect(r.events).toEqual([{ t: 'say', text: '0 0 False False' }]);
  });

  test('a key that does not exist says which ones do', async () => {
    const near = await run('key_pressed("lef")');
    expect(near.error?.messageVi).toContain('key_pressed("left")');
    const far = await run('key_pressed("meo")');
    expect(far.error?.messageVi).toBe(
      'Dòng 2: Không có phím "meo". Có: left, right, up, down, space, 1, 2, 3.',
    );
  });

  test.each([
    ['w', 'up'],
    ['A', 'left'],
    ['s', 'down'],
    ['D', 'right'],
    [' ', 'space'],
    ['Space', 'space'],
    ['Left', 'left'],
    ['UP', 'up'],
  ])('key_pressed(%j) is another way to write %j', async (name, key) => {
    const code = `${IMPORT}on = False\ndef update():\n    global on\n    on = key_pressed("${name}")\n`;
    const r = await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    expect(r.error).toBeUndefined();
    expect(py.step({ keys: [key], tapped: false }).vars['on']).toBe(true);
    expect(py.step({ keys: [], tapped: false }).vars['on']).toBe(false);
    expect(py.step({ keys: [], tapped: true }).vars['on']).toBe(key === 'space');
  });

  test.each(['None', 'True', '[]', '5'])(
    'key_pressed(%s) lists the keys and suggests none of them',
    async (value) => {
      const r = await run(`key_pressed(${value})`);
      expect(r.error?.line).toBe(2);
      expect(r.error?.messageVi).toContain('Có: left, right');
      expect(r.error?.messageVi).not.toContain('Có phải em muốn');
    },
  );

  test('a child’s own variable or function with one of the new names still works and is reported', async () => {
    const r = await run('clicked = 3\nmouse_x = 7\ndef mouse_y():\n    return 9\ny = mouse_y()');
    expect(r.error).toBeUndefined();
    expect(r.vars).toEqual({ clicked: 3, mouse_x: 7, y: 9 });
  });
});

describe('numbers that JSON cannot carry never break a run', () => {
  test('inf, nan and very long whole numbers are shown as a word; the code works as in Python', async () => {
    const r = await run(
      'nearest = float("inf")\nfar = -float("inf")\nodd = float("nan")\nbig = 10 ** 5000\nbig2 = 10 ** 400\n' +
        'low = -(10 ** 5000)\nbest = nearest\nfor d in [40, 7, 90]:\n    if d < best:\n        best = d\n' +
        'n = 10 ** 15\nx = 1.5\nok = big > 10 ** 4999 and nearest > big',
    );
    expect(r.error).toBeUndefined();
    expect(r.vars).toEqual({
      nearest: 'inf',
      far: '-inf',
      odd: 'nan',
      big: 'số rất dài',
      big2: 'số rất dài',
      low: 'số rất dài',
      best: 7,
      d: 90,
      n: 10 ** 15,
      x: 1.5,
      ok: true,
    });
  });

  test('a game may keep nearest = float("inf") on every frame', async () => {
    const code = `${IMPORT}nearest = 0\ndef update():\n    global nearest\n    nearest = float("inf")\n`;
    await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    for (let i = 0; i < 2; i++) {
      const r = py.step({ keys: [], tapped: false });
      expect(r.error).toBeUndefined();
      expect(r.vars['nearest']).toBe('inf');
    }
  });

  test('the same in the arguments of the child’s own calls', async () => {
    const r = await run(
      'def f(a, b, c, d):\n    pass\nf(float("inf"), float("nan"), 10 ** 5000, [10 ** 5000])',
    );
    expect(r.error).toBeUndefined();
    expect(r.calls[0]?.args).toEqual({ a: 'inf', b: 'nan', c: 'số rất dài', d: 'list' });
  });

  test.each([
    ['draw_rect(float("inf"), 0, 1, 1)', 'x không được là inf'],
    ['draw_rect(0, 0, -float("inf"), 1)', 'w không được là -inf'],
    ['draw_text("a", 0, float("nan"))', 'y không được là nan'],
    ['draw_text("a", 0, 0, float("inf"))', 'size không được là inf'],
    ['draw_circle(0, 0, float("nan"))', 'r không được là nan'],
    ['draw_line(0, 0, 10 ** 5000, 1)', 'x2 không được là số quá lớn'],
    ['draw_line(0, 0, 1, 1, "red", float("inf"))', 'width không được là inf'],
    ['draw_triangle(0, 0, 1, 1, 1e300, 5)', 'x3 không được là số quá lớn'],
    ['draw_polygon([(0, 0), (1, float("nan")), (2, 2)])', 'y không được là nan'],
    ['draw_image("images/bird.png", -(10 ** 400), 0)', 'x không được là số quá lớn'],
    ['draw_image("images/bird.png", 0, 0, 10 ** 5000)', 'frame không được là số quá lớn'],
    ['draw_image("images/bird.png", 0, 0, float("inf"))', 'frame không được là inf'],
    ['draw_image("images/bird.png", 0, 0, scale=10 ** 400)', 'scale không được là số quá lớn'],
  ])('%s is a Vietnamese error with its line, and draws nothing', async (code, words) => {
    const r = await run(code);
    expect(r.error?.line).toBe(2);
    expect(r.error?.messageVi).toBe(`Dòng 2: ${words}.`);
    expect(r.events).toEqual([]);
  });

  test('frame= still takes what it took: a float, True, "2"', async () => {
    const r = await run(
      ['2.7', 'True', '"2"'].map((f) => `draw_image("images/bird.png", 0, 0, ${f})`).join('\n'),
    );
    expect(r.error).toBeUndefined();
    expect(r.events.map((e) => e.t === 'sprite' && e.frame)).toEqual([2, 1, 2]);
  });

  test('odd globals and an error that cannot say its name still give a result', async () => {
    const odd = await run('globals()[1] = 2\nx = 5');
    expect(odd.error).toBeUndefined();
    expect(odd.vars).toEqual({ x: 5 });
    const shy = await run(
      'class Shy(Exception):\n    def __str__(self):\n        raise ValueError()\nraise Shy()',
    );
    expect(shy.error?.messageVi).toContain('dòng 5');
    const bad = await run(
      'class Bad:\n    def __repr__(self):\n        return 1\ndef f(a):\n    pass\nf(Bad())\nx = 3',
    );
    expect(bad.error).toBeUndefined();
    expect(bad.calls[0]?.args).toEqual({ a: 'Bad' });
    expect(bad.vars).toEqual({ x: 3 });
  });

  test('a step without a game still carries a whole result', () => {
    return PyRunner.create().then((fresh) => {
      expect(fresh.step({ keys: [], tapped: false })).toMatchObject({ events: [], calls: [] });
    });
  });
});

describe('everyday mistakes are explained in Vietnamese', () => {
  test.each([
    ['hero = {"speed": 2}\nx = hero["sped"]', 3, 'hộp không có ngăn "sped".'],
    ['hero = {"tốc độ": 2}\nx = hero["it\'s"]', 3, 'hộp không có ngăn "it\'s".'],
    ['waves = {1: "a"}\nx = waves[2]', 3, 'hộp không có ngăn 2.'],
    ['raise KeyError()', 2, 'hộp không có ngăn đó.'],
    ['xs = [1]\nx = xs[3]', 3, 'danh sách không có ngăn số đó.'],
    ['xs = [1]\nxs[1] = 2', 3, 'danh sách không có ngăn số đó.'],
    ['x = "ab"[5]', 2, 'chữ không có vị trí đó.'],
    ['xs = []\nxs.pop()', 3, 'danh sách đang trống.'],
    ['score = 0\ndef update():\n    score += 1\nupdate()', 4, 'thiếu global cho biến score.'],
    [
      'def f(a):\n    if a:\n        n = 1\n    return n\nf(False)',
      5,
      'chưa có lệnh hay biến tên n.',
    ],
    ['def f():\n    WIDTH += 1\nf()', 3, 'thiếu global cho biến WIDTH.'],
    ['x = "ab".add(1)', 2, 'chữ không có lệnh add.'],
    ['xs = []\nxs.add(1)', 3, 'danh sách không có lệnh add.'],
    ['hero = {}\nx = hero.hp', 3, 'hộp không có lệnh hp.'],
    ['x = 5\nx.append(1)', 3, 'số không có lệnh append.'],
    ['x = None\nx.go()', 3, 'giá trị này không có lệnh go.'],
    ['x = "Điểm: " + 5', 2, 'không cộng được chữ với số, dùng str(...).'],
    ['x = 5 + " điểm"', 2, 'không cộng được chữ với số, dùng str(...).'],
    ['x = 1.5\nx += "a"', 3, 'không cộng được chữ với số, dùng str(...).'],
    ['x = [1] + 2', 2, 'hai giá trị này không tính với nhau được.'],
    ['x = None + 1', 2, 'hai giá trị này không tính với nhau được.'],
    ['x = "a" - 1', 2, 'hai giá trị này không tính với nhau được.'],
    ['x = 1 / 0', 2, 'không chia cho 0 được.'],
    ['x = 1 % 0', 2, 'không chia cho 0 được.'],
    ['mobs = [{"x": 1}]\nmobs.remove({"x": 2})', 3, 'danh sách không có thứ cần bỏ.'],
    ['def f(n):\n    return f(n + 1)\nf(0)', 2, 'lệnh tự gọi chính nó mãi không dừng.'],
  ])('%j', async (code, line, words) => {
    const r = await run(code);
    expect(r.error?.line).toBe(line);
    expect(r.error?.messageVi).toBe(`Dòng ${String(line)}: ${words}`);
    expect(words.split(' ').length).toBeLessThanOrEqual(12);
  });

  test('the line is the one inside the function that failed, also in a game', async () => {
    const code = `${IMPORT}hero = {"speed": 2}


def move(h):
    h["x"] = h["sped"]


def update():
    move(hero)
`;
    await py.startGame({ 'main.py': code }, 'main.py', { seed: 1 });
    const r = py.step({ keys: [], tapped: false });
    expect(r.error?.messageVi).toBe('Dòng 6: hộp không có ngăn "sped".');
  });

  test('a very long key is cut short', async () => {
    const r = await run(`d = {}\nd["${'a'.repeat(100)}"]`);
    expect(r.error?.messageVi).toBe(`Dòng 3: hộp không có ngăn "${'a'.repeat(19)}…".`);
  });
});
