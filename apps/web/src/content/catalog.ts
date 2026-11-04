import {
  AssetManifestSchema,
  CourseSchema,
  isOpenLesson,
  parseLesson,
  type Asset,
  type Course,
  type Lesson,
  type OpenLesson,
} from '@pyquest/content-schema';

// Vite fixes this list at start-up: a new file in content/ needs `npm run dev` restarted (AGENTS.md §9.3).
const courseFiles = import.meta.glob<unknown>('@content/courses/*/course.json', {
  eager: true,
  import: 'default',
});
const lessonFiles = import.meta.glob<unknown>('@content/courses/*/lessons/*.json', {
  eager: true,
  import: 'default',
});
const sampleGames = import.meta.glob<string>('@content/courses/*/sample-game/main.py', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const manifestFile = import.meta.glob<unknown>('@content/assets/library/manifest.json', {
  eager: true,
  import: 'default',
});
const assetUrls = import.meta.glob<string>('@content/assets/library/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export type CatalogCourse = Course & { lessons: Lesson[]; sampleGame?: string };

const dirOf = (path: string) => /courses\/([^/]+)\//.exec(path)?.[1] ?? '';

function build() {
  const lessonsByDir = new Map<string, Lesson[]>();
  for (const [path, json] of Object.entries(lessonFiles)) {
    const list = lessonsByDir.get(dirOf(path)) ?? [];
    list.push(parseLesson(json));
    lessonsByDir.set(dirOf(path), list);
  }
  const courses = new Map<string, CatalogCourse>();
  for (const [path, json] of Object.entries(courseFiles)) {
    const course = CourseSchema.parse(json);
    const lessons = (lessonsByDir.get(dirOf(path)) ?? []).sort((a, b) => a.order - b.order);
    const sample = Object.entries(sampleGames).find(([p]) => dirOf(p) === dirOf(path))?.[1];
    courses.set(course.id, {
      ...course,
      lessons,
      ...(sample === undefined ? {} : { sampleGame: sample }),
    });
  }
  const manifest = AssetManifestSchema.parse(Object.values(manifestFile)[0] ?? { assets: [] });
  const urls = new Map<string, string>();
  for (const [path, url] of Object.entries(assetUrls)) urls.set(path.split('/').pop() ?? '', url);
  return { courses, assets: new Map(manifest.assets.map((a) => [a.id, a])), urls };
}

const data = build();

export const catalog = {
  courses(): CatalogCourse[] {
    return [...data.courses.values()];
  },
  course(id: string): CatalogCourse | undefined {
    return data.courses.get(id);
  },
  /** An open (not hidden) lesson, or undefined. */
  openLesson(id: string): OpenLesson | undefined {
    for (const c of data.courses.values()) {
      const l = c.lessons.find((x) => x.id === id);
      if (l !== undefined) return isOpenLesson(l) ? l : undefined;
    }
    return undefined;
  },
  courseOf(lessonId: string): CatalogCourse | undefined {
    return [...data.courses.values()].find((c) => c.lessons.some((l) => l.id === lessonId));
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
  /** A slide image by file name. */
  imageUrl(file: string): string | undefined {
    return data.urls.get(file);
  },
};
