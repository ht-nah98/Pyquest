import type { LibraryEntry } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { opensLesson, seesCourse } from './access';
import { catalog } from './catalog';
import { inCourseOrder, libraryFor, type CourseLinks } from './courses';

const course = (id: string, lessonIds: string[], after?: string): CourseLinks => ({
  id,
  lessons: lessonIds.map((l, order) => ({ id: l, order })),
  ...(after === undefined ? {} : { after }),
});
const entry = (name: string, lesson?: string): LibraryEntry => ({
  name,
  signature: name,
  vi: name,
  why: name,
  example: name,
  ...(lesson === undefined ? {} : { lesson }),
});

describe('inCourseOrder', () => {
  const order = (...cs: CourseLinks[]) => inCourseOrder(cs).map((c) => c.id);

  test('a course sits below the one it comes after, whatever the folder names', () => {
    const a = course('a', [], 'b');
    const b = course('b', []);
    const c = course('c', [], 'a');
    expect(order(a, b, c)).toEqual(['b', 'a', 'c']);
    expect(order(c, a, b)).toEqual(['b', 'a', 'c']);
  });

  test('unknown and circular links lose no course', () => {
    expect(order(course('a', [], 'nope'), course('b', []))).toEqual(['a', 'b']);
    expect(order(course('a', [], 'b'), course('b', [], 'a'))).toEqual(['a', 'b']);
  });
});

describe('libraryFor', () => {
  const entries = [
    entry('print', 'l00'),
    entry('clear', 'l01'),
    entry('str', 'l02'),
    entry('dict', 'h01'),
    entry('turtle', 'v00'),
    entry('later'),
  ];
  const courses = [
    course('first', ['l00', 'l01', 'l02']),
    course('game', ['h00', 'h01'], 'first'),
    course('other', ['v00']),
    course('third', ['m00'], 'game'),
  ];
  const names = (id: string) => libraryFor(entries, courses, id).map((e) => e.name);

  test('the own course up to this lesson; order numbers do not leak between courses', () => {
    expect(names('l00')).toEqual(['print']);
    expect(names('l01')).toEqual(['print', 'clear']);
    expect(names('l02')).toEqual(['print', 'clear', 'str']);
    expect(names('v00')).toEqual(['turtle']);
  });

  test('a course after another one knows all of it, and all that came before that', () => {
    expect(names('h00')).toEqual(['print', 'clear', 'str']);
    expect(names('h01')).toEqual(['print', 'clear', 'str', 'dict']);
    expect(names('m00')).toEqual(['print', 'clear', 'str', 'dict']);
  });

  test('an unknown lesson lists nothing', () => {
    expect(names('x99')).toEqual([]);
  });
});

describe('the real courses', () => {
  test('Bay Qua Khe comes first, Hầm Ngọc (a draft, 600 × 600) after it', () => {
    expect(catalog.courses().map((c) => c.id)).toEqual(['bay-qua-khe', 'ham-ngoc']);
    expect(catalog.course('ham-ngoc')).toMatchObject({ draft: true, after: 'bay-qua-khe' });
    expect(catalog.lessonStage('h00')).toEqual({ width: 600, height: 600 });
    expect(catalog.lessonStage('l00')).toEqual({ width: 400, height: 600 });
    expect(catalog.course('ham-ngoc')?.sampleGame).toContain('def update');
  });

  test('every Bay Qua Khe lesson lists what it listed before: its own course up to its order', () => {
    const own = catalog.course('bay-qua-khe')?.lessons ?? [];
    expect(own).toHaveLength(26);
    for (const l of own) {
      const before = catalog.library().filter((e) => {
        const at = own.find((x) => x.id === e.lesson);
        return at !== undefined && at.order <= l.order;
      });
      expect(catalog.library(l.id)).toEqual(before);
    }
  });

  test('Bài 0 of Hầm Ngọc knows every command Bay Qua Khe taught', () => {
    const names = catalog.library('h00').map((e) => e.name);
    expect(names).toEqual(
      expect.arrayContaining(['draw_image', 'key_pressed', 'random_int', 'play_music']),
    );
    expect(catalog.library('h00')).toEqual(catalog.library('l25'));
    expect(names).not.toContain('draw_circle');
  });

  test('a child never sees the draft course, nor opens a lesson of it; the coach does', () => {
    const draft = catalog.course('ham-ngoc');
    const open = catalog.course('bay-qua-khe');
    if (draft === undefined || open === undefined) throw new Error('courses');
    expect(seesCourse(draft, 'student')).toBe(false);
    expect(seesCourse(draft, 'coach')).toBe(true);
    expect(seesCourse(open, 'student')).toBe(true);
    expect(opensLesson(draft, 'h00', 'student')).toBe(false);
    expect(opensLesson(draft, 'h00', 'coach')).toBe(true);
    expect(opensLesson(open, 'l00', 'student')).toBe(true);
    // The course approved, one lesson still a draft: that lesson stays closed.
    expect(opensLesson({ ...draft, draft: false }, 'h00', 'student')).toBe(false);
  });
});
