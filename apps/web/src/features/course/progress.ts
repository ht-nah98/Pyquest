import { isOpenLesson, type Lesson } from '@pyquest/content-schema';
import type { LessonState, Role } from '../../storage/store';

export type LessonStatus = 'hidden' | 'locked' | 'open' | 'done';

/** A child opens lessons in order; the coach may open any lesson that is ready (spec §5). */
export function lessonStatus(
  lessons: readonly Lesson[],
  lessonId: string,
  states: ReadonlyMap<string, LessonState>,
  role: Role,
): LessonStatus {
  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];
  if (lesson === undefined || !isOpenLesson(lesson)) return 'hidden';
  if (states.get(lessonId)?.done === true) return 'done';
  if (role === 'coach' || index === 0) return 'open';
  const before = lessons[index - 1];
  return before !== undefined && states.get(before.id)?.done === true ? 'open' : 'locked';
}

/** Roadmap parts that light up: everything the finished lessons built. */
export function litRoadmap(
  lessons: readonly Lesson[],
  states: ReadonlyMap<string, LessonState>,
): Set<string> {
  const lit = new Set<string>();
  for (const l of lessons) {
    if (isOpenLesson(l) && states.get(l.id)?.done === true)
      for (const id of l.unlocksRoadmap) lit.add(id);
  }
  return lit;
}
