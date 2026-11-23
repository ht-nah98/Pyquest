import type { Lesson } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { emptyLessonState } from '../../storage/store';
import { cellOf, currentLesson, isIn } from './summary';

const lesson = (id: string, ex: string[]) =>
  ({ id, exercises: ex.map((e) => ({ id: e })) }) as unknown as Lesson;

describe('coach summary', () => {
  test('counts the exercises a child finished in a lesson', () => {
    const l = lesson('l01', ['a', 'b', 'c']);
    expect(cellOf(l, { ...emptyLessonState(), exercisesDone: ['a', 'c', 'zz'] })).toEqual({
      done: 2,
      total: 3,
      finished: false,
      started: true,
    });
    expect(cellOf(l, undefined).started).toBe(false);
  });

  test('the current lesson is the last one touched, or the next after a finished one', () => {
    const ls = [lesson('l01', []), lesson('l02', []), lesson('l03', [])];
    expect(currentLesson(ls, new Map([['l01', emptyLessonState()]]))?.id).toBe('l01');
    expect(currentLesson(ls, new Map([['l01', { ...emptyLessonState(), done: true }]]))?.id).toBe(
      'l02',
    );
    expect(currentLesson(ls, new Map())?.id).toBe('l01');
  });
});

test('a child is in the first course always, in a later one once they opened a lesson of it', () => {
  const first = { lessons: [lesson('l00', [])] };
  const later = { after: 'bay-qua-khe', lessons: [lesson('h00', []), lesson('h01', [])] };
  const none = new Map<string, ReturnType<typeof emptyLessonState>>();
  expect(isIn(first, none)).toBe(true);
  expect(isIn(later, none)).toBe(false);
  expect(isIn(later, new Map([['l00', emptyLessonState()]]))).toBe(false);
  expect(isIn(later, new Map([['h01', emptyLessonState()]]))).toBe(true);
});

test('the current lesson of a course ignores work in the other course', () => {
  const states = new Map([
    ['l01', { ...emptyLessonState(), done: true }],
    ['h00', emptyLessonState()],
  ]);
  expect(currentLesson([lesson('l01', []), lesson('l02', [])], states)?.id).toBe('l02');
  expect(currentLesson([lesson('h00', []), lesson('h01', [])], states)?.id).toBe('h00');
});
