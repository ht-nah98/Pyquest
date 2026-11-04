import type { Goal } from '@pyquest/content-schema';
import type { RunResult } from '@pyquest/runtime';
import { describe, expect, test } from 'vitest';
import { checkGoals, needsExpected, runGameTest, shiftSource } from './index';

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

describe("matches: the picture is the same as the solution's", () => {
  const g: Goal = { id: 'g', label: 'l', kind: 'matches' };
  const sky = { t: 'clear', color: 'skyblue' } as const;
  const box = (x: number, color = 'red') => ({ t: 'rect', x, y: 0, w: 10, h: 10, color }) as const;
  const want = result([sky, box(0), box(20, 'blue')]);

  test('same pieces in any order match', () => {
    expect(checkGoals([g], result([sky, box(20, 'blue'), box(0)]), { expected: want })[0]?.ok).toBe(
      true,
    );
  });

  test('a piece in another place, colour or size does not match', () => {
    expect(checkGoals([g], result([sky, box(0), box(30, 'blue')]), { expected: want })[0]?.ok).toBe(
      false,
    );
    expect(checkGoals([g], result([sky, box(0), box(20, 'red')]), { expected: want })[0]?.ok).toBe(
      false,
    );
    expect(checkGoals([g], result([sky, box(0)]), { expected: want })[0]?.ok).toBe(false);
  });

  test('the background colour counts', () => {
    const night = result([{ t: 'clear', color: 'navy' }, box(0), box(20, 'blue')]);
    expect(checkGoals([g], night, { expected: want })[0]?.ok).toBe(false);
  });

  test('an extra copy of a piece does not match', () => {
    expect(
      checkGoals([g], result([sky, box(0), box(0), box(20, 'blue')]), { expected: want })[0]?.ok,
    ).toBe(false);
  });

  test("without the solution's picture the goal is not met", () => {
    expect(checkGoals([g], want)[0]?.ok).toBe(false);
    expect(needsExpected([g])).toBe(true);
  });
});
