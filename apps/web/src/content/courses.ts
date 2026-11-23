import type { Course, Lesson, LibraryEntry } from '@pyquest/content-schema';

/** The part of a course the rules below need. */
export type CourseLinks = Pick<Course, 'id' | 'after'> & {
  lessons: readonly Pick<Lesson, 'id' | 'order'>[];
};

/** Courses as the list shows them: one that comes after another sits below it (Bay Qua Khe first). */
export function inCourseOrder<C extends Pick<Course, 'id' | 'after'>>(courses: readonly C[]): C[] {
  const out: C[] = [];
  let rest = [...courses];
  while (rest.length > 0) {
    const ready = rest.filter(
      (c) => c.after === undefined || !rest.some((other) => other.id === c.after),
    );
    // Going round in a circle is an error in content:check; here nothing may get lost.
    const next = ready.length > 0 ? ready : rest;
    out.push(...next);
    rest = rest.filter((c) => !next.includes(c));
  }
  return out;
}

/** The courses taught before this one (`after`, and theirs), nearest first. */
function coursesBefore(courses: readonly CourseLinks[], course: CourseLinks): CourseLinks[] {
  const out: CourseLinks[] = [];
  for (let id = course.after; id !== undefined;) {
    const before = courses.find((c) => c.id === id);
    if (before === undefined || before === course || out.includes(before)) break;
    out.push(before);
    id = before.after;
  }
  return out;
}

/**
 * The pyquest commands a child has met in this lesson: those of its own course up to it, and all of those of
 * the courses before (ADR 0011). A command no lesson teaches yet (no `lesson`) is never listed.
 */
export function libraryFor(
  entries: readonly LibraryEntry[],
  courses: readonly CourseLinks[],
  lessonId: string,
): LibraryEntry[] {
  const course = courses.find((c) => c.lessons.some((l) => l.id === lessonId));
  const order = course?.lessons.find((l) => l.id === lessonId)?.order;
  if (course === undefined || order === undefined) return [];
  const met = new Set([
    ...course.lessons.filter((l) => l.order <= order).map((l) => l.id),
    ...coursesBefore(courses, course).flatMap((c) => c.lessons.map((l) => l.id)),
  ]);
  return entries.filter((e) => e.lesson !== undefined && met.has(e.lesson));
}
