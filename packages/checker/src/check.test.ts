import type { Goal } from '@pyquest/content-schema';
import type { DrawEvent, GameInput, RunResult } from '@pyquest/runtime';
import { describe, expect, test } from 'vitest';
import {
  checkGoals,
  MATCH_PASS,
  matchScore,
  needsExpected,
  runGameTest,
  shiftSource,
  testInput,
} from './index';

const ok: RunResult = {
  events: [
    { t: 'say', text: '  Mình sẽ làm game!  ' },
    { t: 'sprite', sprite: 'bird', x: 100, y: 200, frame: 0 },
  ],
  vars: { x: 100, name: 'Lửa' },
  stoppedByLimit: false,
  calls: [],
};
const broken: RunResult = { ...ok, error: { line: 1, messageVi: 'lỗi', raw: 'X' } };

const one = (goal: Goal, r: RunResult) => checkGoals([goal], r)[0]?.ok;

describe('checkGoals', () => {
  test('noError', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'noError' };
    expect(one(g, ok)).toBe(true);
    expect(one(g, broken)).toBe(false);
    expect(one(g, { ...ok, stoppedByLimit: true })).toBe(false);
  });

  test('printed matches after trimming', () => {
    expect(one({ id: 'g', label: 'l', kind: 'printed', text: 'Mình sẽ làm game!' }, ok)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'printed', text: 'Mình sẽ làm game' }, ok)).toBe(false);
  });

  test('drew at an exact point, then with tolerance', () => {
    const at = (x: number, tolerance?: number): Goal => ({
      id: 'g',
      label: 'l',
      kind: 'drew',
      sprite: 'bird',
      at: [x, 200],
      ...(tolerance === undefined ? {} : { tolerance }),
    });
    expect(one(at(100), ok)).toBe(true);
    expect(one(at(101), ok)).toBe(false);
    expect(one(at(104, 5), ok)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'drew', sprite: 'pipe' }, ok)).toBe(false);
    expect(one({ id: 'g', label: 'l', kind: 'drew', sprite: 'bird' }, ok)).toBe(true);
  });

  test('a picture matches its group: "bird" is also "bird-rong"', () => {
    const rong: RunResult = {
      ...ok,
      events: [{ t: 'sprite', sprite: 'bird-rong', x: 100, y: 200, frame: 0 }],
    };
    expect(one({ id: 'g', label: 'l', kind: 'drew', sprite: 'bird' }, rong)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'drew', sprite: 'bir' }, rong)).toBe(false);
  });

  test("drew with customImage needs a picture other than the group's first one", () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'drew', sprite: 'bird', customImage: true };
    expect(one(g, ok)).toBe(false);
    const swapped: RunResult = {
      ...ok,
      events: [{ t: 'sprite', sprite: 'bird-cu', x: 1, y: 2, frame: 0 }],
    };
    expect(one(g, swapped)).toBe(true);
  });

  test('varEquals for numbers and text', () => {
    expect(one({ id: 'g', label: 'l', kind: 'varEquals', name: 'x', value: 100 }, ok)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'varEquals', name: 'name', value: 'Lửa' }, ok)).toBe(
      true,
    );
    expect(one({ id: 'g', label: 'l', kind: 'varEquals', name: 'x', value: '100' }, ok)).toBe(
      false,
    );
  });

  test('every goal is reported in order', () => {
    const goals: Goal[] = [
      { id: 'a', label: 'l', kind: 'noError' },
      { id: 'b', label: 'l', kind: 'printed', text: 'không có' },
    ];
    expect(checkGoals(goals, ok)).toEqual([
      { id: 'a', ok: true },
      { id: 'b', ok: false },
    ]);
  });
});

describe('game-mode goals over frames', () => {
  const frame = (y: number, extra: RunResult['events'] = []): RunResult['events'] => [
    { t: 'sprite', sprite: 'bird', x: 80, y, frame: 0 },
    ...extra,
    { t: 'frame' },
  ];
  const run = (ys: number[]): RunResult => ({
    events: ys.flatMap((y) => frame(y)),
    vars: {},
    stoppedByLimit: false,
    calls: [],
  });

  test('moves: the sprite ends lower (down) than it started', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'moves', sprite: 'bird', axis: 'y', dir: 1 };
    expect(one(g, run([100, 110, 130]))).toBe(true);
    expect(one(g, run([100, 100, 100]))).toBe(false);
    expect(one(g, run([100, 90, 80]))).toBe(false);
  });

  test('staysWithin: never below the ground line', () => {
    const g: Goal = {
      id: 'g',
      label: 'l',
      kind: 'staysWithin',
      sprite: 'bird',
      axis: 'y',
      max: 480,
    };
    expect(one(g, run([400, 470, 480, 480]))).toBe(true);
    expect(one(g, run([400, 470, 490]))).toBe(false);
    expect(one(g, run([]))).toBe(false);
  });

  test('risesAfterTap: after a tap frame the sprite goes up', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'risesAfterTap', sprite: 'bird', taps: [2] };
    expect(one(g, run([100, 110, 120, 110, 100]))).toBe(true);
    expect(one(g, run([100, 110, 120, 130, 140]))).toBe(false);
  });

  test('speedsUp: steps get bigger (falling faster and faster)', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'speedsUp', sprite: 'bird', axis: 'y' };
    expect(one(g, run([100, 101, 103, 106, 110, 115]))).toBe(true);
    expect(one(g, run([100, 102, 104, 106, 108, 110]))).toBe(false);
    expect(one(g, run([100]))).toBe(false);
  });

  test('drewCount: enough copies of a sprite in one frame', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'drewCount', sprite: 'bird', min: 3 };
    const three: RunResult = {
      events: [80, 130, 180].map(
        (x) => ({ t: 'sprite', sprite: 'bird', x, y: 0, frame: 0 }) as const,
      ),
      vars: {},
      stoppedByLimit: false,
      calls: [],
    };
    expect(one(g, three)).toBe(true);
    expect(one({ ...g, min: 4 }, three)).toBe(false);
  });
});

describe('runGameTest', () => {
  test('starts, steps the scheduled frames with taps, and joins the events', async () => {
    const inputs: boolean[] = [];
    let y = 0;
    const r = await runGameTest(
      {
        start: () => Promise.resolve({ events: [], vars: {}, stoppedByLimit: false, calls: [] }),
        step: (input) => {
          inputs.push(input.tapped);
          y += input.tapped ? -5 : 2;
          return {
            events: [{ t: 'sprite', sprite: 'bird', x: 0, y, frame: 0 }, { t: 'frame' }],
            vars: { y },
            stoppedByLimit: false,
            calls: [],
          };
        },
      },
      { frames: 4, taps: [2] },
    );
    expect(inputs).toEqual([false, false, true, false]);
    expect(r.events.filter((e) => e.t === 'frame')).toHaveLength(4);
    expect(r.vars['y']).toBe(1);
  });

  test('stops at the first error', async () => {
    const r = await runGameTest(
      {
        start: () => Promise.resolve({ events: [], vars: {}, stoppedByLimit: false, calls: [] }),
        step: () => ({
          events: [],
          vars: {},
          stoppedByLimit: false,
          calls: [],
          error: { line: 3, messageVi: 'x', raw: 'E' },
        }),
      },
      { frames: 10, taps: [] },
    );
    expect(r.error?.line).toBe(3);
  });
});

describe('more goals for lessons 12–16', () => {
  const pipes = (ys: number[][]): RunResult => ({
    events: ys.flatMap((frameYs) => [
      ...frameYs.map((y) => ({ t: 'sprite', sprite: 'pipe', x: 0, y, frame: 0 }) as const),
      { t: 'frame' } as const,
    ]),
    vars: {},
    stoppedByLimit: false,
    calls: [],
  });

  test('distinctCount: how many different values a sprite took', () => {
    const g: Goal = {
      id: 'g',
      label: 'l',
      kind: 'distinctCount',
      sprite: 'pipe',
      axis: 'y',
      min: 5,
    };
    expect(
      one(
        g,
        pipes([
          [1, 2],
          [1, 2],
          [1, 2],
        ]),
      ),
    ).toBe(false);
    expect(
      one(
        g,
        pipes([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      ),
    ).toBe(true);
  });

  test('drewText: some text event shows exactly this text', () => {
    const r: RunResult = {
      events: [{ t: 'text', text: '1', x: 0, y: 0, size: 24, color: 'white' }],
      vars: {},
      stoppedByLimit: false,
      calls: [],
    };
    expect(one({ id: 'g', label: 'l', kind: 'drewText', text: '1' }, r)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'drewText', text: '2' }, r)).toBe(false);
  });

  test('staysWithin can look at a window of frames only', () => {
    const r: RunResult = {
      events: [300, 300, 300, 200, 100].flatMap((y) => [
        { t: 'sprite', sprite: 'bird', x: 0, y, frame: 0 } as const,
        { t: 'frame' } as const,
      ]),
      vars: {},
      stoppedByLimit: false,
      calls: [],
    };
    const g: Goal = {
      id: 'g',
      label: 'l',
      kind: 'staysWithin',
      sprite: 'bird',
      axis: 'y',
      min: 290,
      max: 310,
      frames: [0, 2],
    };
    expect(one(g, r)).toBe(true);
    expect(one({ ...g, frames: [0, 4] }, r)).toBe(false);
  });

  test('varEquals works for True/False', () => {
    const r: RunResult = {
      events: [],
      vars: { game_over: true },
      stoppedByLimit: false,
      calls: [],
    };
    expect(one({ id: 'g', label: 'l', kind: 'varEquals', name: 'game_over', value: true }, r)).toBe(
      true,
    );
    expect(
      one({ id: 'g', label: 'l', kind: 'varEquals', name: 'game_over', value: false }, r),
    ).toBe(false);
  });
});

const rect = (x: number, y: number, by?: number) =>
  ({ t: 'rect', x, y, w: 10, h: 10, color: 'red', ...(by === undefined ? {} : { by }) }) as const;
const bird = (x: number, y: number, by?: number) => [rect(x, y + 10, by), rect(x + 30, y + 14, by)];
const result = (events: RunResult['events'], calls: RunResult['calls'] = []): RunResult => ({
  events,
  vars: {},
  stoppedByLimit: false,
  calls,
});
const call = (id: number, x: number, y: number, parent: number | null = null) => ({
  id,
  parent,
  name: 'draw_bird',
  args: { x, y },
  line: 3,
});

describe('goals for drawing from the smallest pieces', () => {
  test('drewRects: enough boxes in one picture, a full-stage background does not count', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'drewRects', min: 2 };
    expect(one(g, result(bird(0, 0)))).toBe(true);
    expect(one(g, result([rect(0, 0)]))).toBe(false);
    const sky = { t: 'rect', x: 0, y: 0, w: 400, h: 600, color: 'blue' } as const;
    expect(one(g, result([sky, rect(0, 0)]))).toBe(false);
  });

  test("called: the child's function ran enough times, with different numbers when asked", () => {
    const g: Goal = {
      id: 'g',
      label: 'l',
      kind: 'called',
      name: 'draw_bird',
      min: 2,
      distinct: true,
    };
    expect(one(g, result([], [call(0, 1, 2), call(1, 5, 2)]))).toBe(true);
    expect(one(g, result([], [call(0, 1, 2), call(1, 1, 2)]))).toBe(false);
    expect(one(g, result([], [call(0, 1, 2)]))).toBe(false);
    expect(
      one({ id: 'g', label: 'l', kind: 'called', name: 'draw_bird' }, result([], [call(0, 1, 2)])),
    ).toBe(true);
  });

  test('sameShape: every call draws the same picture, only moved', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'sameShape', name: 'draw_bird' };
    const two = result([...bird(0, 0, 0), ...bird(100, 50, 1)], [call(0, 0, 0), call(1, 100, 50)]);
    expect(one(g, two)).toBe(true);
    // The beak typed as a fixed number stays behind on the second bird.
    const stuck = result(
      [...bird(0, 0, 0), rect(100, 60, 1), rect(30, 14, 1)],
      [call(0, 0, 0), call(1, 100, 50)],
    );
    expect(one(g, stuck)).toBe(false);
    expect(one(g, result(bird(0, 0, 0), [call(0, 0, 0)]))).toBe(false);
  });

  test('sameShape counts drawings made by calls inside the call', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'sameShape', name: 'draw_bird' };
    const calls = [
      call(0, 0, 0),
      { ...call(1, 0, 0, 0), name: 'wing' },
      call(2, 50, 0),
      { ...call(3, 50, 0, 2), name: 'wing' },
    ];
    const nested = result([rect(0, 0, 0), rect(5, 5, 1), rect(50, 0, 2), rect(55, 5, 3)], calls);
    expect(one(g, nested)).toBe(true);
  });

  test('shifts: changing the variable moves the picture by the same amount', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'shifts', var: 'x', by: 50, axis: 'x' };
    const before = result([{ t: 'clear', color: 'sky' }, ...bird(100, 300)]);
    expect(
      checkGoals([g], before, {
        shifted: result([{ t: 'clear', color: 'sky' }, ...bird(150, 300)]),
      })[0]?.ok,
    ).toBe(true);
    // Fixed numbers: nothing moves.
    expect(checkGoals([g], before, { shifted: before })[0]?.ok).toBe(false);
    // The beak typed as a fixed number stays behind while the body moves: wrong.
    const beakStuck = result([{ t: 'clear', color: 'sky' }, rect(150, 310), rect(130, 314)]);
    expect(checkGoals([g], before, { shifted: beakStuck })[0]?.ok).toBe(false);
    // One piece moves twice as far: wrong.
    const odd = result([{ t: 'clear', color: 'sky' }, rect(150, 310), rect(230, 314)]);
    expect(checkGoals([g], before, { shifted: odd })[0]?.ok).toBe(false);
    // No second run (the variable line was not found): not met.
    expect(checkGoals([g], before)[0]?.ok).toBe(false);
  });
});

describe('shiftSource', () => {
  test('adds to the one line that sets the variable', () => {
    expect(shiftSource('from pyquest import *\nx = 100\ny = 3\n', 'x', 50)).toBe(
      'from pyquest import *\nx = 150\ny = 3\n',
    );
  });

  test('gives nothing when the line is missing or set twice', () => {
    expect(shiftSource('y = 1\n', 'x', 5)).toBeUndefined();
    expect(shiftSource('x = 1\nx = 2\n', 'x', 5)).toBeUndefined();
    expect(shiftSource('x = y + 1\n', 'x', 5)).toBeUndefined();
  });
});

describe('runGameTest and calls', () => {
  test('calls of every frame get their own ids; lastFrameFrom marks where the last frame starts', async () => {
    const frame = (x: number): RunResult => ({
      events: [{ t: 'rect', x, y: 0, w: 1, h: 1, color: 'red', by: 1 }, { t: 'frame' }],
      vars: {},
      stoppedByLimit: false,
      calls: [
        { id: 0, parent: null, name: 'draw', args: {}, line: null },
        { id: 1, parent: 0, name: 'draw_bird', args: { x }, line: 4 },
      ],
    });
    let n = 0;
    const r = await runGameTest(
      {
        start: () => Promise.resolve({ events: [], vars: {}, stoppedByLimit: false, calls: [] }),
        step: () => frame(++n * 10),
      },
      { frames: 2, taps: [] },
    );
    expect(r.calls.map((c) => [c.id, c.parent, c.name])).toEqual([
      [0, null, 'draw'],
      [1, 0, 'draw_bird'],
      [2, null, 'draw'],
      [3, 2, 'draw_bird'],
    ]);
    expect(r.events.filter((e) => e.t === 'rect').map((e) => e.by)).toEqual([1, 3]);
    expect(r.lastFrameFrom).toBe(2);
  });
});

test('drewRects with at: one of the boxes has its corner at that point', () => {
  const g: Goal = { id: 'g', label: 'l', kind: 'drewRects', min: 1, at: [100, 300] };
  const box = (x: number) => ({
    events: [{ t: 'rect', x, y: 300, w: 40, h: 40, color: 'gold' }] as RunResult['events'],
    vars: {},
    stoppedByLimit: false,
    calls: [],
  });
  expect(checkGoals([g], box(100))[0]?.ok).toBe(true);
  expect(checkGoals([g], box(101))[0]?.ok).toBe(false);
});

describe('matches: the picture looks like the solution, ≥ MATCH_PASS % (spec 2026-11-26 lesson-likeness)', () => {
  const g: Goal = { id: 'g', label: 'l', kind: 'matches' };
  // Bài 5 · Đàn chim: draw_bird is three boxes; the solution draws 5 birds at x = 20 + i * 75, y = 200.
  const drawBird = (x: number, y: number): DrawEvent[] => [
    { t: 'rect', x, y: y + 10, w: 30, h: 20, color: 'red' },
    { t: 'rect', x: x + 30, y: y + 14, w: 8, h: 8, color: 'orange' },
    { t: 'rect', x: x + 8, y, w: 14, h: 10, color: 'red' },
  ];
  const flock = (n: number, y = 200, dx = 0, sky: DrawEvent[] = []) =>
    result([...sky, ...Array.from({ length: n }, (_, i) => drawBird(20 + i * 75 + dx, y)).flat()]);
  const want = flock(5);
  const score = (r: RunResult) => matchScore(r, want);
  const passes = (r: RunResult) => checkGoals([g], r, { expected: want })[0]?.ok;

  test('the solution itself is 100% and passes', () => {
    expect(score(flock(5))).toBe(100);
    expect(passes(flock(5))).toBe(true);
    expect(MATCH_PASS).toBe(90);
  });

  test('the same birds 5 px off still pass', () => {
    expect(passes(flock(5, 205, 5))).toBe(true);
  });

  test('one bird missing does not pass', () => {
    expect(score(flock(4))).toBeLessThan(MATCH_PASS);
    expect(passes(flock(4))).toBe(false);
  });

  test('the birds at y = 300 instead of 200 do not pass', () => {
    expect(passes(flock(5, 300))).toBe(false);
  });

  test('another sky colour loses its 15 points and does not pass', () => {
    expect(score(flock(5, 200, 0, [{ t: 'clear', color: 'skyblue' }]))).toBe(85);
  });

  test('a run that broke scores 0; without the solution the goal is not met', () => {
    expect(score({ ...want, error: { line: 1, messageVi: 'lỗi', raw: 'X' } })).toBe(0);
    expect(passes({ ...want, error: { line: 1, messageVi: 'lỗi', raw: 'X' } })).toBe(false);
    expect(checkGoals([g], want)[0]?.ok).toBe(false);
    expect(needsExpected([g])).toBe(true);
  });

  test('order does not matter; pictures use the sizes they are given', () => {
    expect(score(result([...want.events].reverse()))).toBe(100);
    const bird: DrawEvent = { t: 'sprite', sprite: 'bird', x: 0, y: 0, frame: 0 };
    const sprites = { bird: { width: 100, height: 100 } };
    // 100 × 100 vs the same picture drawn 3 times bigger: far apart once their real size is known.
    expect(matchScore(result([{ ...bird, scale: 3 }]), result([bird]), { sprites })).toBeLessThan(
      MATCH_PASS,
    );
  });
});

describe('review fixes', () => {
  test('I1: sameShape fails when the calls ignore their numbers and draw in the same place', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'sameShape', name: 'draw_bird' };
    const stuck = result(
      [...bird(100, 300, 0), ...bird(100, 300, 1)],
      [call(0, 100, 300), call(1, 250, 150)],
    );
    expect(one(g, stuck)).toBe(false);
  });

  test('M1: shiftSource accepts x=100 and a comment at the end of the line', () => {
    expect(shiftSource('x=100\n', 'x', 50)).toBe('x=150\n');
    expect(shiftSource('x = 100  # vàng\n', 'x', 50)).toBe('x = 150  # vàng\n');
  });
});

describe('played: the game made this sound or started this tune', () => {
  const r: RunResult = {
    ...ok,
    events: [
      { t: 'music', name: 'happy' },
      { t: 'sound', name: 'flap' },
      { t: 'sound', name: 'flap' },
    ],
  };
  test('a sound, at least min times', () => {
    expect(one({ id: 'g', label: 'l', kind: 'played', sound: 'flap' }, r)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'played', sound: 'flap', min: 3 }, r)).toBe(false);
    expect(one({ id: 'g', label: 'l', kind: 'played', sound: 'hit' }, r)).toBe(false);
  });
  test('a tune', () => {
    expect(one({ id: 'g', label: 'l', kind: 'played', music: 'happy' }, r)).toBe(true);
    expect(one({ id: 'g', label: 'l', kind: 'played', music: 'calm' }, r)).toBe(false);
  });
  test('sounds are not part of the picture: matches ignores them', () => {
    const pic: RunResult = { ...ok, events: [{ t: 'rect', x: 1, y: 2, w: 3, h: 4, color: 'red' }] };
    const loud: RunResult = { ...pic, events: [...pic.events, { t: 'sound', name: 'win' }] };
    expect(
      checkGoals([{ id: 'g', label: 'l', kind: 'matches' }], loud, { expected: pic })[0]?.ok,
    ).toBe(true);
  });
});

describe('runGameTest keeps the sounds of loading the module', () => {
  test('play_music at the top of the file counts; drawing there does not', async () => {
    const r = await runGameTest(
      {
        start: () =>
          Promise.resolve({
            ...ok,
            events: [
              { t: 'music', name: 'happy' },
              { t: 'rect', x: 0, y: 0, w: 1, h: 1, color: 'red' },
            ],
          }),
        step: () => Promise.resolve({ ...ok, events: [{ t: 'frame' }] }),
      },
      { frames: 1, taps: [] },
    );
    expect(r.events).toEqual([{ t: 'music', name: 'happy' }, { t: 'frame' }]);
    expect(one({ id: 'g', label: 'l', kind: 'played', music: '*' }, r)).toBe(true);
  });
});

describe('circles, lines and shapes (ADR 0009)', () => {
  const g: Goal = { id: 'g', label: 'l', kind: 'matches' };
  const sky = { t: 'clear', color: 'white' } as const;
  const sun = (x: number, r = 50, color = 'gold') =>
    ({ t: 'circle', x, y: 100, r, color }) as const;
  const ray = (x2: number, width = 3, color = 'black') =>
    ({ t: 'line', x1: 0, y1: 0, x2, y2: 10, color, width }) as const;
  const roof = (top: number, color = 'purple', dx = 0): DrawEvent => ({
    t: 'polygon',
    points: [
      [dx + 100, 400],
      [dx + 200, top],
      [dx + 300, 400],
    ],
    color,
  });
  const want = result([sky, sun(300), ray(50), roof(250)]);
  const same = (events: RunResult['events']) =>
    checkGoals([g], result(events), { expected: want })[0]?.ok;

  test('the same circles, lines and shapes in any order match', () => {
    expect(same([sky, roof(250), ray(50), sun(300)])).toBe(true);
  });

  test('a circle, line or shape a few pixels off matches; a big change does not', () => {
    expect(same([sky, sun(303), ray(52), roof(253)])).toBe(true);
    expect(same([sky, sun(200), ray(50), roof(250)])).toBe(false);
    expect(same([sky, sun(300, 90), ray(50), roof(250)])).toBe(false);
    expect(same([sky, sun(300, 50, 'red'), ray(50), roof(250)])).toBe(false);
    expect(same([sky, sun(300), ray(50), roof(150)])).toBe(false);
    expect(same([sky, sun(300), ray(50), roof(250, 'teal')])).toBe(false);
    expect(same([sky, sun(300), ray(50)])).toBe(false);
  });

  test('shifts: a whole triangle and line moved by the variable count as moved', () => {
    const s: Goal = { id: 's', label: 'l', kind: 'shifts', var: 'x', by: 50, axis: 'x' };
    const line = (dx: number) =>
      ({ t: 'line', x1: dx, y1: 0, x2: dx + 20, y2: 10, color: 'red', width: 3 }) as const;
    const before = result([roof(250, 'purple', 0), line(0), sun(300)]);
    const moved = result([roof(250, 'purple', 50), line(50), sun(350)]);
    expect(checkGoals([s], before, { shifted: moved })[0]?.ok).toBe(true);
    // One corner typed as a fixed number: the shape changed instead of moving.
    const stuck: DrawEvent = {
      t: 'polygon',
      points: [
        [150, 400],
        [250, 250],
        [300, 400],
      ],
      color: 'purple',
    };
    expect(checkGoals([s], before, { shifted: result([stuck, line(50), sun(350)]) })[0]?.ok).toBe(
      false,
    );
  });

  test('ellipses, arcs and outlines are compared too (ADR 0013)', () => {
    const face = (
      h = 160,
      color = 'peachpuff',
      border?: string,
    ): Extract<DrawEvent, { t: 'ellipse' }> => ({
      t: 'ellipse',
      x: 300,
      y: 200,
      w: 120,
      h,
      color,
      ...(border === undefined ? {} : { border }),
    });
    const smile = (end = 180): Extract<DrawEvent, { t: 'arc' }> => ({
      t: 'arc',
      x: 300,
      y: 230,
      r: 30,
      start: 0,
      end,
      color: 'red',
      width: 3,
    });
    const model = result([sky, face(), smile()]);
    const like = (events: RunResult['events']) =>
      checkGoals([g], result(events), { expected: model })[0]?.ok;
    expect(like([sky, smile(), face()])).toBe(true);
    expect(like([sky, face(156), smile()])).toBe(true);
    expect(like([sky, face(80), smile()])).toBe(false);
    expect(like([sky, face(160, 'pink'), smile()])).toBe(false);
    expect(like([sky, face(160, 'none', 'black'), smile()])).toBe(false);
    const s: Goal = { id: 's', label: 'l', kind: 'shifts', var: 'x', by: 10, axis: 'x' };
    const moved = result([sky, { ...face(), x: 310 }, { ...smile(), x: 310 }]);
    expect(checkGoals([s], model, { shifted: moved })[0]?.ok).toBe(true);
  });

  test("drewRects: a background box the size of the course's stage does not count", () => {
    const d: Goal = { id: 'd', label: 'l', kind: 'drewRects', min: 1 };
    const square = { t: 'rect', x: 0, y: 0, w: 600, h: 600, color: 'white' } as const;
    const box = { t: 'rect', x: 0, y: 0, w: 400, h: 600, color: 'red' } as const;
    // On the 600 × 600 stage, a 400 × 600 box is a real piece; on the 400 × 600 stage it is the sky.
    expect(
      checkGoals([d], result([square, box]), { stage: { width: 600, height: 600 } })[0]?.ok,
    ).toBe(true);
    expect(checkGoals([d], result([square]), { stage: { width: 600, height: 600 } })[0]?.ok).toBe(
      false,
    );
    expect(checkGoals([d], result([box]))[0]?.ok).toBe(false);
  });
});

describe('scaled and mirrored pictures (ADR 0010)', () => {
  const bird = { t: 'sprite', sprite: 'bird', x: 10, y: 20, frame: 0 } as const;
  const same = (a: DrawEvent, b: DrawEvent) =>
    checkGoals(
      [{ id: 'm', label: 'l', kind: 'matches' }],
      { ...ok, events: [a] },
      {
        expected: { ...ok, events: [b] },
      },
    )[0]?.ok;

  test('matches: the size and the mirror must be right too', () => {
    expect(same(bird, bird)).toBe(true);
    expect(same({ ...bird, scale: 2, mirror: true }, { ...bird, scale: 2, mirror: true })).toBe(
      true,
    );
    expect(same({ ...bird, scale: 2 }, bird)).toBe(false);
    expect(same({ ...bird, mirror: true }, bird)).toBe(false);
  });

  test('drew still looks at the place only', () => {
    const g: Goal = { id: 'g', label: 'l', kind: 'drew', sprite: 'bird', at: [10, 20] };
    expect(one(g, { ...ok, events: [{ ...bird, scale: 3, mirror: true }] })).toBe(true);
  });
});

describe('varCompare (ADR 0011)', () => {
  const g = (
    op: '>=' | '<=' | '!=',
    value: number | string | boolean,
    when?: 'end' | 'ever',
    name = 'hp',
  ): Goal => ({
    id: 'g',
    label: 'l',
    kind: 'varCompare',
    name,
    op,
    value,
    ...(when === undefined ? {} : { when }),
  });
  const end = (vars: RunResult['vars']) => ({ ...ok, vars });

  test('at the end of the run', () => {
    expect(one(g('>=', 3), end({ hp: 3 }))).toBe(true);
    expect(one(g('>=', 3), end({ hp: 2.9 }))).toBe(false);
    expect(one(g('<=', 3), end({ hp: 3 }))).toBe(true);
    expect(one(g('<=', 3), end({ hp: 4 }))).toBe(false);
    expect(one(g('!=', 'play'), end({ hp: 'over' }))).toBe(true);
    expect(one(g('!=', 'play'), end({ hp: 'play' }))).toBe(false);
    expect(one(g('!=', false), end({ hp: true }))).toBe(true);
  });

  test('a variable that is missing or is not a number never passes', () => {
    expect(one(g('!=', 5), end({}))).toBe(false);
    expect(one(g('>=', 0), end({}))).toBe(false);
    expect(one(g('>=', 0), end({ hp: 'nhiều' }))).toBe(false);
    expect(one(g('>=', 1), end({ hp: true }))).toBe(false);
  });

  test('ever: after any frame; end: only after the last one', () => {
    const r = { ...end({ hp: 5 }), varsByFrame: [{ hp: 5 }, { hp: 2 }, { hp: 5 }] };
    const ever = (goal: Goal) => checkGoals([goal], r)[0]?.ok;
    expect(ever(g('<=', 2, 'ever'))).toBe(true);
    expect(ever(g('<=', 1, 'ever'))).toBe(false);
    expect(ever(g('<=', 2, 'end'))).toBe(false);
    expect(ever(g('<=', 2))).toBe(false);
    // A script has no frames: the end is all there is.
    expect(one(g('<=', 5, 'ever'), end({ hp: 5 }))).toBe(true);
  });
});

describe('test keys and clicks (ADR 0011)', () => {
  const play = async (t: Parameters<typeof testInput>[0]) => {
    const inputs: GameInput[] = [];
    const r = await runGameTest(
      {
        start: () => Promise.resolve({ ...ok, events: [], vars: { n: 0 } }),
        step: (input) => {
          inputs.push(input);
          return { ...ok, events: [{ t: 'frame' }], vars: { n: inputs.length } };
        },
      },
      t,
    );
    return { inputs, r };
  };

  test('without them every frame gets exactly what it got before', async () => {
    const { inputs } = await play({ frames: 3, taps: [1] });
    expect(inputs).toEqual([
      { keys: [], tapped: false },
      { keys: [], tapped: true },
      { keys: [], tapped: false },
    ]);
  });

  test('a key is held from its first to its last frame, both included; keys add up', async () => {
    const { inputs } = await play({
      frames: 5,
      taps: [],
      keys: [
        { key: 'left', from: 1, to: 3 },
        { key: 'up', from: 3, to: 4 },
        { key: 'left', from: 2, to: 2 },
      ],
    });
    expect(inputs.map((i) => i.keys)).toEqual([[], ['left'], ['left'], ['left', 'up'], ['up']]);
    expect(inputs.some((i) => i.tapped)).toBe(false);
  });

  test('space held is one tap when it goes down, as on the page', async () => {
    const { inputs } = await play({
      frames: 4,
      taps: [],
      keys: [{ key: 'space', from: 1, to: 2 }],
    });
    expect(inputs.map((i) => [i.keys.join(), i.tapped])).toEqual([
      ['', false],
      ['space', true],
      ['space', false],
      ['', false],
    ]);
  });

  test('a click is one frame, also a tap, and the mouse stays there', async () => {
    const { inputs } = await play({
      frames: 5,
      taps: [],
      clicks: [
        { frame: 3, x: 10, y: 20 },
        { frame: 1, x: 300, y: 400 },
      ],
    });
    const at = { x: 300, y: 400 };
    expect(inputs).toEqual([
      { keys: [], tapped: false },
      { keys: ['space'], tapped: true, clicked: true, pointer: at },
      { keys: [], tapped: false, pointer: at },
      { keys: ['space'], tapped: true, clicked: true, pointer: { x: 10, y: 20 } },
      { keys: [], tapped: false, pointer: { x: 10, y: 20 } },
    ]);
  });

  test('the variables of every frame are kept, up to an error', async () => {
    const { r } = await play({ frames: 3, taps: [] });
    expect(r.varsByFrame).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    let n = 0;
    const broke = await runGameTest(
      {
        start: () => Promise.resolve(ok),
        step: () => (++n === 2 ? { ...broken, vars: { n } } : { ...ok, vars: { n } }),
      },
      { frames: 9, taps: [] },
    );
    expect(broke.error).toBeDefined();
    expect(broke.varsByFrame).toEqual([{ n: 1 }, { n: 2 }]);
    const never = await runGameTest(
      { start: () => Promise.resolve(broken), step: () => ok },
      { frames: 9, taps: [] },
    );
    expect(never.varsByFrame).toEqual([]);
  });
});

describe('pictures of the roguelite: groups by the first part of the id (ADR 0011)', () => {
  const sprite = (id: string, x: number, y = 0): DrawEvent => ({
    t: 'sprite',
    sprite: id,
    x,
    y,
    frame: 0,
    scale: 3,
    mirror: true,
  });
  const frames = (...fs: DrawEvent[][]): RunResult => ({
    ...ok,
    events: fs.flatMap((f) => [...f, { t: 'frame' } as const]),
  });
  const group = { id: 'g', label: 'l' };

  test.each([
    ['hero', 'hero-knight'],
    ['mob', 'mob-bat'],
    ['boss', 'boss-1'],
    ['item', 'item-xp'],
    ['shot', 'shot-fire'],
    ['skill', 'skill-fire-1'],
    ['skill-fire', 'skill-fire-4'],
    ['fx', 'fx-hit'],
  ])('%s matches %s drawn bigger and mirrored', (prefix, id) => {
    const run = frames([sprite(id, 10)], [sprite(id, 14)]);
    expect(one({ ...group, kind: 'drew', sprite: prefix }, run)).toBe(true);
    expect(one({ ...group, kind: 'drew', sprite: id, at: [10, 0] }, run)).toBe(true);
    expect(one({ ...group, kind: 'moves', sprite: prefix, axis: 'x', dir: 1 }, run)).toBe(true);
    expect(one({ ...group, kind: 'staysWithin', sprite: prefix, axis: 'x', min: 0 }, run)).toBe(
      true,
    );
    expect(one({ ...group, kind: 'distinctCount', sprite: prefix, axis: 'x', min: 2 }, run)).toBe(
      true,
    );
    expect(one({ ...group, kind: 'drewCount', sprite: prefix, min: 1 }, run)).toBe(true);
    expect(one({ ...group, kind: 'drewCount', sprite: prefix, min: 2 }, run)).toBe(false);
  });

  test('a boss is not a mob, whatever its group in the manifest; hero-knight is not hero-mage', () => {
    const run = frames([sprite('boss-1', 1), sprite('hero-knight', 2)]);
    expect(one({ ...group, kind: 'drew', sprite: 'mob' }, run)).toBe(false);
    expect(one({ ...group, kind: 'drew', sprite: 'hero-mage' }, run)).toBe(false);
    expect(one({ ...group, kind: 'drewCount', sprite: 'mob', min: 1 }, run)).toBe(false);
  });

  test('drewCount counts the whole group in one frame', () => {
    const run = frames([sprite('mob-bat', 1), sprite('mob-slime', 2), sprite('boss-1', 3)]);
    expect(one({ ...group, kind: 'drewCount', sprite: 'mob', min: 2 }, run)).toBe(true);
    expect(one({ ...group, kind: 'drewCount', sprite: 'mob', min: 3 }, run)).toBe(false);
  });
});
