import type { Lesson } from '@pyquest/content-schema';
import type { LessonState } from '../../storage/store';

/** How far a child is in one lesson, for the coach's grid. */
export type Cell = { done: number; total: number; finished: boolean; started: boolean };

/** The exercises of a lesson (a hidden lesson has none). */
export const exercisesOf = (lesson: Lesson) =>
  'exercises' in lesson ? (lesson.exercises ?? []) : [];

export function cellOf(lesson: Lesson, state: LessonState | undefined): Cell {
  const ids = exercisesOf(lesson).map((e) => e.id);
  const done = ids.filter((id) => state?.exercisesDone?.includes(id) === true).length;
  return {
    done,
    total: ids.length,
    finished: state?.done === true,
    started: state !== undefined,
  };
}

/** The lesson a child is on: the first one not finished, after the last one they touched. */
export function currentLesson(
  lessons: readonly Lesson[],
  states: ReadonlyMap<string, LessonState>,
): Lesson | undefined {
  let last = -1;
  lessons.forEach((l, i) => {
    if (states.has(l.id)) last = i;
  });
  const touched = lessons[last];
  if (touched !== undefined && states.get(touched.id)?.done !== true) return touched;
  return lessons[last + 1] ?? touched;
}
