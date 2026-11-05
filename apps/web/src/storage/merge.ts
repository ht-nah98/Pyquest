import type { LessonState } from './store';

/** A lesson state with the time (ms) it was last changed on the device that wrote it. */
export type Stamped = { state: LessonState; at: number };

const union = <T>(a: readonly T[] | undefined, b: readonly T[] | undefined): T[] => [
  ...new Set([...(a ?? []), ...(b ?? [])]),
];

/**
 * Two copies of one lesson (this device, the cloud): the newer one decides where the child is and the code,
 * but what the child achieved on either copy is kept (spec 2026-11-05 §4).
 */
export function mergeLessonState(a: Stamped | undefined, b: Stamped | undefined): Stamped {
  if (a === undefined) return b as Stamped;
  if (b === undefined) return a;
  const [older, newer] = a.at > b.at ? [b, a] : [a, b];
  const o = older.state;
  const n = newer.state;
  const furthest = Math.max(o.furthestSlide ?? o.slideIndex, n.furthestSlide ?? n.slideIndex);
  return {
    at: newer.at,
    state: {
      ...n,
      quizAnswers: { ...o.quizAnswers, ...n.quizAnswers },
      exercises: { ...o.exercises, ...n.exercises },
      exercisesDone: union(n.exercisesDone, o.exercisesDone),
      doneSteps: union(n.doneSteps, o.doneSteps),
      picks: { ...o.picks, ...n.picks },
      furthestSlide: furthest,
      done: o.done || n.done,
    },
  };
}
