import type { Exercise, StepKind } from '@pyquest/content-schema';
import type { ExerciseWork, LessonState } from '../../storage/store';

/** The first exercise is always open; each next one opens when the one before it is done. */
export function isUnlocked(
  all: readonly Exercise[],
  done: readonly string[],
  index: number,
): boolean {
  if (index <= 0) return true;
  const before = all[index - 1];
  return before !== undefined && done.includes(before.id);
}

/**
 * The exercise to show. A requested one (from ?ex=) if it exists and is open (the coach may open any);
 * otherwise the one open last time, else the first not done, else the last.
 */
export function pickExercise(
  all: readonly Exercise[],
  state: LessonState,
  requested: string | undefined,
  isCoach: boolean,
): Exercise {
  const done = state.exercisesDone ?? [];
  const at = all.findIndex((e) => e.id === requested);
  const want = all[at];
  if (want !== undefined && (isCoach || isUnlocked(all, done, at))) return want;
  const last = all.find((e) => e.id === state.exercise);
  if (last !== undefined) return last;
  const fallback = all[all.length - 1] ?? all[0];
  if (fallback === undefined) throw new Error('a lesson with a code step has exercises');
  return all.find((e) => !done.includes(e.id)) ?? fallback;
}

/**
 * The child's work on an exercise, else its starter. Code saved before the course was rebuilt
 * (LessonState.files) belongs to old lessons and is not reused (review M3).
 */
export function workOf(state: LessonState, _all: readonly Exercise[], ex: Exercise): ExerciseWork {
  const saved = state.exercises?.[ex.id];
  if (saved !== undefined && Object.keys(saved.files).length > 0) return saved;
  return { files: ex.starter };
}

/** The steps that count as done: everything before playtest, once every exercise is done. */
export function doneSteps(
  kinds: readonly StepKind[],
  all: readonly Exercise[],
  done: readonly string[],
): StepKind[] {
  if (!all.every((e) => done.includes(e.id))) return [];
  return kinds.filter((k) => k !== 'playtest');
}
