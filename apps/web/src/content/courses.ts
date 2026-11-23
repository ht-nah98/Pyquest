import {
  CourseSchema,
  isOpenLesson,
  LessonHeadSchema,
  parseLesson,
  type Course,
  type LessonHead,
  type LibraryEntry,
  type OpenLesson,
} from '@pyquest/content-schema';

/** The part of a course the rules below need. */
export type CourseLinks = Pick<Course, 'id' | 'after' | 'draft'> & {
  lessons: readonly Pick<LessonHead, 'id' | 'order'>[];
};

export type CatalogCourse = Course & { lessons: LessonHead[] };

/** What is downloaded when somebody enters the course: its open lessons, and its sample game (ADR 0012). */
export type CourseBody = { lessons: Map<string, OpenLesson>; sampleGame: string | undefined };

type ContentFiles<T> = Readonly<Record<string, T>>;

const dirOf = (path: string) => /courses\/([^/]+)\//.exec(path)?.[1] ?? '';
const isDraft = (json: unknown) => (json as { draft?: unknown } | null)?.draft === true;

/**
 * Every course with the heads of its lessons. Something broken in a draft must not blank the whole app: a broken draft
 * lesson, or the whole draft course, is left out. Broken content that is no draft still throws, and
 * content:check reports both.
 */
export function readCourses(
  courseFiles: ContentFiles<unknown>,
  headFiles: ContentFiles<unknown>,
): Map<string, CatalogCourse> {
  const courses = new Map<string, CatalogCourse>();
  for (const [path, json] of Object.entries(courseFiles)) {
    const dir = dirOf(path);
    try {
      const course = CourseSchema.parse(json);
      const lessons: LessonHead[] = [];
      for (const [lessonPath, lessonJson] of Object.entries(headFiles)) {
        if (dirOf(lessonPath) !== dir) continue;
        try {
          lessons.push(LessonHeadSchema.parse(lessonJson));
        } catch (e) {
          if (course.draft === true || !isDraft(lessonJson)) throw e;
        }
      }
      courses.set(course.id, {
        ...course,
        lessons: lessons.sort((a, b) => a.order - b.order),
      });
    } catch (e) {
      if (!isDraft(json)) throw e;
    }
  }
  return courses;
}

/**
 * The lessons of one course, whole. A broken draft lesson is left out (its page says it is not open yet), as in
 * readCourses; a broken lesson that is no draft throws.
 */
export function readBody(
  courseDraft: boolean,
  lessonJsons: readonly unknown[],
  sampleGame: string | undefined,
): CourseBody {
  const lessons = new Map<string, OpenLesson>();
  for (const json of lessonJsons) {
    try {
      const lesson = parseLesson(json);
      if (isOpenLesson(lesson)) lessons.set(lesson.id, lesson);
    } catch (e) {
      if (!courseDraft && !isDraft(json)) throw e;
    }
  }
  return { lessons, sampleGame };
}

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
 * the open courses before (ADR 0011). A command no lesson teaches yet (no `lesson`) is never listed.
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
    ...coursesBefore(courses, course)
      .filter((c) => c.draft !== true)
      .flatMap((c) => c.lessons.map((l) => l.id)),
  ]);
  return entries.filter((e) => e.lesson !== undefined && met.has(e.lesson));
}

/**
 * The commands of the 🎨 Xưởng vẽ: those an open course teaches, and those no lesson teaches (its own drawing
 * commands), but not what only a game can use. What only a draft course teaches stays out.
 */
export function studioLibrary(
  entries: readonly LibraryEntry[],
  courses: readonly CourseLinks[],
): LibraryEntry[] {
  const taught = new Set(
    courses.filter((c) => c.draft !== true).flatMap((c) => c.lessons.map((l) => l.id)),
  );
  return entries.filter(
    (e) => e.gameOnly !== true && (e.lesson === undefined || taught.has(e.lesson)),
  );
}
