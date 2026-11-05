import type { Lesson } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { emptyLessonState } from '../../storage/store';
import { cellOf, currentLesson } from './summary';

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
