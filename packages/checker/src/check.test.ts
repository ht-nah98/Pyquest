import type { Goal } from '@pyquest/content-schema';
import type { RunResult } from '@pyquest/runtime';
import { describe, expect, test } from 'vitest';
import { checkGoals } from './index';

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
