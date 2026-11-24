import {
  AssetManifestSchema,
  LibraryRefSchema,
  StudioSchema,
  type LibraryEntry,
  type Studio,
  type Asset,
  type OpenLesson,
} from '@pyquest/content-schema';
import { DEFAULT_STAGE, type StageSize } from '@pyquest/runtime';
import {
  inCourseOrder,
  libraryFor,
  readBody,
  readCourses,
  studioLibrary,
  type CatalogCourse,
  type CourseBody,
} from './courses';

// Vite fixes this list at start-up: a new file in content/ needs `npm run dev` restarted (AGENTS.md §9.3).
const courseFiles = import.meta.glob<unknown>('@content/courses/*/course.json', {
  eager: true,
  import: 'default',
});
const headFiles = import.meta.glob<unknown>('@content/courses/*/lessons/*.json', {
  eager: true,
  query: '?head',
  import: 'default',
});
// Not eager: a course is downloaded when somebody enters it (catalog.load, ADR 0012).
const lessonFiles = import.meta.glob<unknown>('@content/courses/*/lessons/*.json', {
  import: 'default',
});
const sampleGames = import.meta.glob<string>('@content/courses/*/sample-game/main.py', {
  query: '?raw',
  import: 'default',
});
const manifestFile = import.meta.glob<unknown>('@content/assets/library/manifest.json', {
  eager: true,
  import: 'default',
});
const libraryFile = import.meta.glob<unknown>('@content/reference/pyquest.json', {
  eager: true,
  import: 'default',
});
const studioFile = import.meta.glob<unknown>('@content/studio/studio.json', {
  eager: true,
  import: 'default',
});
const assetUrls = import.meta.glob<string>('@content/assets/library/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export type { CatalogCourse };

function build() {
  const courses = readCourses(courseFiles, headFiles);
  const manifest = AssetManifestSchema.parse(Object.values(manifestFile)[0] ?? { assets: [] });
  const urls = new Map<string, string>();
  for (const [path, url] of Object.entries(assetUrls)) urls.set(path.split('/').pop() ?? '', url);
  const library = LibraryRefSchema.parse(
    Object.values(libraryFile)[0] ?? {
      entries: [{ name: '-', signature: '-', vi: '-', example: '-', lesson: 'l00' }],
    },
  );
  const studioJson = Object.values(studioFile)[0];
  const studio = studioJson === undefined ? undefined : StudioSchema.parse(studioJson);
  return {
    courses,
    studio,
    assets: new Map(manifest.assets.map((a) => [a.id, a])),
    urls,
    library: library.entries,
  };
}

const data = build();

const bodies = new Map<string, CourseBody>();
const loading = new Map<string, Promise<void>>();

const filesOf = <T>(files: Record<string, () => Promise<T>>, courseId: string) =>
  Object.entries(files)
    .filter(([path]) => path.includes(`/courses/${courseId}/`))
    .map(([, file]) => file());

async function loadBody(course: CatalogCourse): Promise<void> {
  const [lessons, games] = await Promise.all([
    Promise.all(filesOf(lessonFiles, course.id)),
    Promise.all(filesOf(sampleGames, course.id)),
  ]);
  // Found by folder name: a folder not named after its course id must not look like an empty course.
  if (lessons.length === 0) throw new Error(`content/courses/${course.id}/ has no lessons`);
  bodies.set(course.id, readBody(course.draft === true, lessons, games[0]));
}

export const catalog = {
  /** Every course, drafts too (the pages ask seesCourse), in the order children take them. */
  courses(): CatalogCourse[] {
    return inCourseOrder([...data.courses.values()]);
  },
  course(id: string): CatalogCourse | undefined {
    return data.courses.get(id);
  },
  /**
   * Downloads a course's lessons and sample game, once; an unknown course has nothing to download. It rejects
   * when the download fails, and the next call tries again.
   */
  load(courseId: string): Promise<void> {
    const course = data.courses.get(courseId);
    if (course === undefined || bodies.has(courseId)) return Promise.resolve();
    const now = loading.get(courseId);
    if (now !== undefined) return now;
    const started = loadBody(course).finally(() => loading.delete(courseId));
    loading.set(courseId, started);
    return started;
  },
  isLoaded(courseId: string): boolean {
    return bodies.has(courseId);
  },
  /** An open (not hidden) lesson, or undefined. Its course must be loaded (NeedCourse in app/routes.tsx). */
  openLesson(id: string): OpenLesson | undefined {
    return bodies.get(this.courseOf(id)?.id ?? '')?.lessons.get(id);
  },
  /** The sample game's code; its course must be loaded. */
  sampleGame(courseId: string): string | undefined {
    return bodies.get(courseId)?.sampleGame;
  },
  courseOf(lessonId: string): CatalogCourse | undefined {
    return [...data.courses.values()].find((c) => c.lessons.some((l) => l.id === lessonId));
  },
  /** The stage of a course (400 × 600 when the course sets none). */
  stageOf(courseId: string): StageSize {
    return data.courses.get(courseId)?.stage ?? DEFAULT_STAGE;
  },
  /** The stage of the course's sample game. */
  sampleStageOf(courseId: string): StageSize {
    return data.courses.get(courseId)?.sampleStage ?? this.stageOf(courseId);
  },
  /** The stage of the course a lesson belongs to. */
  lessonStage(lessonId: string): StageSize {
    return this.courseOf(lessonId)?.stage ?? DEFAULT_STAGE;
  },
  /** The 🎨 Xưởng vẽ (content/studio/studio.json), if there is one. */
  studio(): Studio | undefined {
    return data.studio;
  },
  asset(id: string): Asset | undefined {
    return data.assets.get(id);
  },
  assets(): Asset[] {
    return [...data.assets.values()];
  },
  assetUrl(id: string): string | undefined {
    const a = data.assets.get(id);
    return a === undefined ? undefined : data.urls.get(a.file);
  },
  /** pyquest commands met by this lesson (libraryFor); all of them when upto is undefined. */
  library(upto?: string): LibraryEntry[] {
    if (upto === undefined) return data.library;
    if (upto === 'studio') return studioLibrary(data.library, [...data.courses.values()]);
    return libraryFor(data.library, [...data.courses.values()], upto);
  },
  /** A slide image by file name. */
  imageUrl(file: string): string | undefined {
    return data.urls.get(file);
  },
};
