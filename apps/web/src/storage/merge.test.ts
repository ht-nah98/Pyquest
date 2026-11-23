import { describe, expect, test } from 'vitest';
import { mergeLessonState } from './merge';
import { emptyLessonState, type LessonState } from './store';

const s = (patch: Partial<LessonState>): LessonState => ({ ...emptyLessonState(), ...patch });

describe('mergeLessonState: newer wins, achievements are never lost', () => {
  test('the newer copy decides where the child is and the code', () => {
    const old = { state: s({ slideIndex: 2, exercise: 'e1' }), at: 100 };
    const now = { state: s({ slideIndex: 5, exercise: 'e2' }), at: 200 };
    const m = mergeLessonState(old, now);
    expect(m.at).toBe(200);
    expect(m.state.slideIndex).toBe(5);
    expect(m.state.exercise).toBe('e2');
    expect(mergeLessonState(now, old).state.slideIndex).toBe(5);
  });

  test('done exercises, done steps and the furthest slide are united', () => {
    const a = {
      state: s({
        exercisesDone: ['e1', 'e2'],
        doneSteps: ['understand'],
        furthestSlide: 9,
        done: true,
      }),
      at: 100,
    };
    const b = {
      state: s({ exercisesDone: ['e3'], doneSteps: ['code'], furthestSlide: 4 }),
      at: 200,
    };
    const m = mergeLessonState(a, b).state;
    expect([...(m.exercisesDone ?? [])].sort()).toEqual(['e1', 'e2', 'e3']);
    expect([...m.doneSteps].sort()).toEqual(['code', 'understand']);
    expect(m.furthestSlide).toBe(9);
    expect(m.done).toBe(true);
  });

  test('code of an exercise only the older copy has is kept', () => {
    const a = {
      state: s({
        exercises: { e1: { files: { 'main.py': 'old e1' } }, e2: { files: { 'main.py': 'a e2' } } },
      }),
      at: 100,
    };
    const b = {
      state: s({ exercises: { e2: { files: { 'main.py': 'b e2' } } }, quizAnswers: { q2: 1 } }),
      at: 200,
    };
    const m = mergeLessonState({ ...a, state: { ...a.state, quizAnswers: { q1: 0 } } }, b).state;
    expect(m.exercises?.['e1']?.files['main.py']).toBe('old e1');
    expect(m.exercises?.['e2']?.files['main.py']).toBe('b e2');
    expect(m.quizAnswers).toEqual({ q1: 0, q2: 1 });
  });

  test('a missing side returns the other unchanged', () => {
    const a = { state: s({ slideIndex: 3 }), at: 7 };
    expect(mergeLessonState(a, undefined)).toEqual(a);
    expect(mergeLessonState(undefined, a)).toEqual(a);
  });

  test('a drawing: the newer name and code win, the first creation time stays', () => {
    const a = {
      state: s({ files: { 'main.py': 'old' }, studio: { title: 'Nhà', createdAt: 50 } }),
      at: 100,
    };
    const b = {
      state: s({ files: { 'main.py': 'new' }, studio: { title: 'Nhà đẹp', createdAt: 90 } }),
      at: 200,
    };
    const m = mergeLessonState(a, b).state;
    expect(m.files['main.py']).toBe('new');
    expect(m.studio).toEqual({ title: 'Nhà đẹp', createdAt: 50 });
    expect(mergeLessonState(undefined, a).state.studio?.title).toBe('Nhà');
    expect(mergeLessonState(a, { state: s({}), at: 300 }).state.studio?.title).toBe('Nhà');
  });

  test('a drawing deleted on one device stays deleted, even if the other edited it later', () => {
    const gone = {
      state: s({ studio: { title: 'Mây', createdAt: 1, deleted: true } }),
      at: 100,
    };
    const edited = {
      state: s({ files: { 'main.py': 'x' }, studio: { title: 'Mây', createdAt: 1 } }),
      at: 200,
    };
    expect(mergeLessonState(gone, edited).state.studio?.deleted).toBe(true);
    expect(mergeLessonState(edited, gone).state.studio?.deleted).toBe(true);
    // Its code goes too, even though the newer copy (edited offline) still had it.
    const merged = mergeLessonState(gone, { ...edited, state: { ...edited.state, workspace: {} } });
    expect(merged.state.files).toEqual({});
    expect(merged.state.workspace).toBeUndefined();
    expect(mergeLessonState(edited, { ...edited, at: 300 }).state.studio?.deleted).toBeUndefined();
  });

  test('lesson rows never get a studio field', () => {
    const m = mergeLessonState({ state: s({}), at: 1 }, { state: s({}), at: 2 }).state;
    expect('studio' in m).toBe(false);
  });

  test('a device that only opened the lesson later does not bring the older code of an exercise back', () => {
    const work = (code: string, changedAt?: number) => ({
      files: { 'main.py': code },
      ...(changedAt === undefined ? {} : { changedAt }),
    });
    const typed = {
      state: s({ exercises: { e1: work('a', 50), e2: work('typed', 90) } }),
      at: 100,
    };
    const opened = { state: s({ exercises: { e1: work('a', 50), e2: work('starter') } }), at: 200 };
    for (const m of [mergeLessonState(typed, opened), mergeLessonState(opened, typed)]) {
      expect(m.state.exercises?.['e2']?.files['main.py']).toBe('typed');
      expect(m.state.exercises?.['e1']?.files['main.py']).toBe('a');
      expect(m.at).toBe(200);
    }
    // Work saved before this existed has no time: the newer copy decides, as it always did.
    const old = (code: string, at: number) => ({ state: s({ exercises: { e1: work(code) } }), at });
    expect(
      mergeLessonState(old('x', 1), old('y', 2)).state.exercises?.['e1']?.files['main.py'],
    ).toBe('y');
  });

  test('a device that only opened a drawing later does not bring its older code back', () => {
    const d = (code: string, changedAt: number, title: string) =>
      s({ files: { 'main.py': code }, studio: { title, createdAt: 1, changedAt } });
    const typed = { state: d('new', 90, 'Trăng'), at: 100 };
    const opened = { state: d('old', 50, 'Tranh 1'), at: 200 };
    for (const m of [mergeLessonState(typed, opened), mergeLessonState(opened, typed)]) {
      expect(m.state.files['main.py']).toBe('new');
      expect(m.state.studio?.title).toBe('Trăng');
    }
  });
});
