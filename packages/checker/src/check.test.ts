import type { Goal } from '@pyquest/content-schema';
import type { RunResult } from '@pyquest/runtime';
import { describe, expect, test } from 'vitest';
import { checkGoals, runGameTest } from './index';

const ok: RunResult = {
  events: [
    { t: 'say', text: '  Mình sẽ làm game!  ' },
    { t: 'sprite', sprite: 'bird', x: 100, y: 200, frame: 0 },
  ],
  vars: { x: 100, name: 'Lửa' },
  stoppedByLimit: false,
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
        start: () => Promise.resolve({ events: [], vars: {}, stoppedByLimit: false }),
        step: (input) => {
          inputs.push(input.tapped);
          y += input.tapped ? -5 : 2;
          return {
            events: [{ t: 'sprite', sprite: 'bird', x: 0, y, frame: 0 }, { t: 'frame' }],
            vars: { y },
            stoppedByLimit: false,
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
        start: () => Promise.resolve({ events: [], vars: {}, stoppedByLimit: false }),
        step: () => ({
          events: [],
          vars: {},
          stoppedByLimit: false,
          error: { line: 3, messageVi: 'x', raw: 'E' },
        }),
      },
      { frames: 10, taps: [] },
    );
    expect(r.error?.line).toBe(3);
  });
});
