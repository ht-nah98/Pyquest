import type { Exercise } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { emptyLessonState, type LessonState } from '../../storage/store';
import { doneSteps, isUnlocked, pickExercise, workOf } from './exercises';

const ex = (id: string): Exercise => ({
  id,
  title: id,
  task: 'Làm.',
  input: 'blocks',
  starter: { 'main.py': `# ${id}\n` },
  main: 'main.py',
  toolbox: [],
  mode: 'script',
  goals: [{ id: `${id}-g`, label: 'ok', kind: 'noError' }],
  solution: { 'main.py': '' },
});
const all = [ex('e1'), ex('e2'), ex('e3')];
const state = (patch: Partial<LessonState> = {}): LessonState => ({
  ...emptyLessonState(),
  ...patch,
});

describe('exercises of a lesson', () => {
  test('an exercise opens when the one before it is done; the first is always open', () => {
    expect(all.map((_, i) => isUnlocked(all, ['e1'], i))).toEqual([true, true, false]);
  });

  test('without a choice: the one open last time, else the first not done', () => {
    expect(pickExercise(all, state(), undefined, false).id).toBe('e1');
    expect(pickExercise(all, state({ exercisesDone: ['e1'] }), undefined, false).id).toBe('e2');
    expect(
      pickExercise(all, state({ exercise: 'e1', exercisesDone: ['e1'] }), undefined, false).id,
    ).toBe('e1');
  });

  test('a child cannot open a locked exercise by its link; the coach can', () => {
    expect(pickExercise(all, state(), 'e3', false).id).toBe('e1');
    expect(pickExercise(all, state(), 'e3', true).id).toBe('e3');
    expect(pickExercise(all, state(), 'nope', true).id).toBe('e1');
  });

  test('work: saved per exercise; the old single code counts as the first exercise', () => {
    const old = state({ files: { 'main.py': 'cũ' } });
    expect(workOf(old, all, all[0]!).files).toEqual({ 'main.py': 'cũ' });
    expect(workOf(old, all, all[1]!).files).toEqual({ 'main.py': '# e2\n' });
    const saved = state({ exercises: { e2: { files: { 'main.py': 'mới' } } } });
    expect(workOf(saved, all, all[1]!).files).toEqual({ 'main.py': 'mới' });
  });

  test('the code step is done only when every exercise is done', () => {
    expect(doneSteps(['understand', 'code', 'playtest'], all, ['e1', 'e2'])).toEqual([]);
    expect(doneSteps(['understand', 'code', 'playtest'], all, ['e1', 'e2', 'e3'])).toEqual([
      'understand',
      'code',
    ]);
  });
});
