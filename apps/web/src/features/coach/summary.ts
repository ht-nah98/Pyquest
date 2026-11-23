import type { Course, LessonHead } from '@pyquest/content-schema';
import type { LessonState } from '../../storage/store';

/** How far a child is in one lesson, for the coach's grid. */
export type Cell = { done: number; total: number; finished: boolean; started: boolean };

export function cellOf(lesson: LessonHead, state: LessonState | undefined): Cell {
  const ids = lesson.exercises.map((e) => e.id);
  const done = ids.filter((id) => state?.exercisesDone?.includes(id) === true).length;
  return {
    done,
    total: ids.length,
    finished: state?.done === true,
    started: state !== undefined,
  };
}

/** A child is in a course once they opened one of its lessons; everybody is in a course that is the first one. */
export function isIn(
  course: Pick<Course, 'after'> & { lessons: readonly LessonHead[] },
  states: ReadonlyMap<string, LessonState>,
): boolean {
  return course.after === undefined || course.lessons.some((l) => states.has(l.id));
}

/** The lesson a child is on: the first one not finished, after the last one they touched. */
export function currentLesson(
  lessons: readonly LessonHead[],
  states: ReadonlyMap<string, LessonState>,
): LessonHead | undefined {
  let last = -1;
  lessons.forEach((l, i) => {
    if (states.has(l.id)) last = i;
  });
  const touched = lessons[last];
  if (touched !== undefined && states.get(touched.id)?.done !== true) return touched;
  return lessons[last + 1] ?? touched;
}
