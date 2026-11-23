/** The import query that asks for a lesson's head instead of the whole lesson. */
export const HEAD_QUERY = 'head';

type Json = Record<string, unknown>;

/**
 * A lesson file cut down to its head. It runs at build time and checks nothing: a broken value goes through
 * as it is, for readCourses to judge.
 */
export function headOf(json: unknown): unknown {
  if (typeof json !== 'object' || json === null) return json;
  const l = json as Json;
  // A hidden lesson may be half written: like HiddenLessonSchema, nothing else of it counts.
  const base = {
    id: l['id'],
    courseId: l['courseId'],
    order: l['order'],
    title: l['title'],
    hidden: l['hidden'],
    draft: l['draft'],
  };
  if (l['hidden'] === true) return { ...base, unlocksRoadmap: [], exercises: [] };
  const exercises = Array.isArray(l['exercises'])
    ? (l['exercises'] as (Json | null)[]).map((e) => ({ id: e?.['id'], title: e?.['title'] }))
    : [];
  return {
    ...base,
    summary: l['summary'],
    unlocksRoadmap: l['unlocksRoadmap'] ?? [],
    exercises,
  };
}
