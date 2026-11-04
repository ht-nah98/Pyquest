import type { Lesson } from '@pyquest/content-schema';
import { describe, expect, test } from 'vitest';
import { emptyLessonState, type LessonState } from '../../storage/store';
import { litRoadmap, lessonStatus } from './progress';

const open = (id: string, order: number, unlocks: string[] = []): Lesson => ({
  id,
  courseId: 'c',
  order,
  title: id,
  steps: [
    { kind: 'understand', slides: [{ id: `${id}-a` }] },
    { kind: 'playtest', slides: [{ id: `${id}-b` }] },
  ],
  unlocksRoadmap: unlocks,
  docsUnlocked: [],
});
const hidden = (id: string, order: number): Lesson => ({
  id,
  courseId: 'c',
  order,
  title: id,
  hidden: true,
});
const done = (): LessonState => ({ ...emptyLessonState(), done: true });

const lessons = [
  open('l00', 0),
  open('l01', 1, ['stage']),
  open('l02', 2, ['bird']),
  hidden('l03', 3),
];

describe('lessonStatus', () => {
  test('the first lesson is open, the rest locked until the one before is done', () => {
    const states = new Map<string, LessonState>();
    expect(lessons.map((l) => lessonStatus(lessons, l.id, states, 'student'))).toEqual([
      'open',
      'locked',
      'locked',
      'hidden',
    ]);
    states.set('l00', done());
    expect(lessonStatus(lessons, 'l01', states, 'student')).toBe('open');
    expect(lessonStatus(lessons, 'l00', states, 'student')).toBe('done');
  });

  test('the coach can open every lesson that is not hidden', () => {
    const s = new Map<string, LessonState>();
    expect(lessonStatus(lessons, 'l02', s, 'coach')).toBe('open');
    expect(lessonStatus(lessons, 'l03', s, 'coach')).toBe('hidden');
  });
});

test('a draft lesson is hidden from children but open for the coach', () => {
  const draft: Lesson = { ...(open('l01', 1) as object), draft: true } as Lesson;
  const list = [open('l00', 0), draft];
  const s = new Map([['l00', done()]]);
  expect(lessonStatus(list, 'l01', s, 'student')).toBe('hidden');
  expect(lessonStatus(list, 'l01', s, 'coach')).toBe('open');
});

test('litRoadmap lights the parts of finished lessons only', () => {
  const states = new Map([
    ['l01', done()],
    ['l02', emptyLessonState()],
  ]);
  expect([...litRoadmap(lessons, states)]).toEqual(['stage']);
});
