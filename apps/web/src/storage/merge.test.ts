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
});
