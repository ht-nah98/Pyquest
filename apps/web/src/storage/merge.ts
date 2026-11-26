import type { ExerciseWork, LessonState, StudioMeta } from './store';

/** A lesson state with the time (ms) it was last changed on the device that wrote it. */
export type Stamped = { state: LessonState; at: number };

/** Each exercise from the copy where the child changed it last; the same change (or none): from the newer copy. */
function mergeExercises(o: LessonState, n: LessonState): Record<string, ExerciseWork> {
  const out: Record<string, ExerciseWork> = { ...o.exercises, ...n.exercises };
  for (const [id, old] of Object.entries(o.exercises ?? {})) {
    if ((old.changedAt ?? 0) > (n.exercises?.[id]?.changedAt ?? 0)) out[id] = old;
  }
  return out;
}

/** A drawing's name and code follow the copy the child changed last; once deleted on any device it stays deleted. */
function mergeStudio(
  o: StudioMeta | undefined,
  n: StudioMeta | undefined,
): { studio?: StudioMeta } {
  if (o === undefined && n === undefined) return {};
  if (o === undefined || n === undefined) return { studio: (n ?? o) as StudioMeta };
  const deleted = o.deleted === true || n.deleted === true;
  // A drawing never changes its template: keep it even when one copy was saved without it.
  const template = n.template ?? o.template;
  return {
    studio: {
      ...((o.changedAt ?? 0) > (n.changedAt ?? 0) ? o : n),
      createdAt: Math.min(o.createdAt, n.createdAt),
      ...(deleted ? { deleted: true } : {}),
      ...(template === undefined ? {} : { template }),
    },
  };
}

const drawingIsNewer = (a: LessonState, b: LessonState): boolean =>
  a.studio !== undefined && (a.studio.changedAt ?? 0) > (b.studio?.changedAt ?? 0);

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
  const studio = mergeStudio(o.studio, n.studio);
  if (studio.studio?.deleted === true) {
    // A deleted drawing keeps no code, even when the newer copy was edited on an offline device.
    const rest: LessonState = { ...n, files: {} };
    delete rest.workspace;
    return { at: newer.at, state: { ...rest, ...studio } };
  }
  // Opening a drawing on another device saves its blocks: that must not bring the older code back.
  const drawing = drawingIsNewer(o, n)
    ? { files: o.files, ...(o.workspace === undefined ? {} : { workspace: o.workspace }) }
    : {};
  return {
    at: newer.at,
    state: {
      ...n,
      quizAnswers: { ...o.quizAnswers, ...n.quizAnswers },
      exercises: mergeExercises(o, n),
      exercisesDone: union(n.exercisesDone, o.exercisesDone),
      doneSteps: union(n.doneSteps, o.doneSteps),
      picks: { ...o.picks, ...n.picks },
      furthestSlide: furthest,
      done: o.done || n.done,
      ...studio,
      ...drawing,
    },
  };
}
