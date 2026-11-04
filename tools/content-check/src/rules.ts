import { BLOCK_TYPES, registerBlocks, toPython, treeToState } from '@pyquest/blocks';
import { checkGoals, runGameTest } from '@pyquest/checker';
import {
  AssetManifestSchema,
  CourseSchema,
  LibraryRefSchema,
  isOpenLesson,
  parseLesson,
  type Lesson,
  type OpenLesson,
} from '@pyquest/content-schema';
import type { PyRunner, RunResult } from '@pyquest/runtime';

export type ContentInput = {
  courses: {
    dir: string;
    course: unknown;
    lessons: { file: string; json: unknown }[];
    sampleGame?: string;
  }[];
  manifest: unknown;
  /** File names present in content/assets/library/. */
  assetFiles: string[];
  /** Files under content/ that match no known pattern. */
  strayFiles: string[];
  /** content/reference/pyquest.json (📘 Thư viện). */
  library?: unknown;
};

const SEED = 1;
const GAME_FRAMES = 300;

/** Every rule from docs/conventions/content-authoring.md §5. Returns human-readable errors; empty = green. */
export async function checkContent(input: ContentInput, py: PyRunner): Promise<string[]> {
  const errors: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  for (const stray of input.strayFiles) err(stray, 'stray file in content/ (rule 8)');

  // Rule 10: the library reference parses and points at lessons that exist.
  const allLessonIds = new Set(
    input.courses.flatMap((c) => c.lessons.map((l) => (l.json as { id?: string }).id ?? '')),
  );
  if (input.library !== undefined) {
    const lib = LibraryRefSchema.safeParse(input.library);
    if (!lib.success) err('reference/pyquest.json', lib.error.message);
    else
      for (const e of lib.data.entries)
        if (!allLessonIds.has(e.lesson))
          err('reference/pyquest.json', `${e.name}: unknown lesson ${e.lesson}`);
  }

  const manifest = AssetManifestSchema.safeParse(input.manifest);
  if (manifest.success) py.setAssets(manifest.data.assets.map((a) => a.id));
  const assetIds = new Set<string>();
  if (!manifest.success) err('assets/library/manifest.json', manifest.error.message);
  else {
    for (const a of manifest.data.assets) {
      if (assetIds.has(a.id)) err('manifest', `duplicate asset id "${a.id}"`);
      assetIds.add(a.id);
      if (!input.assetFiles.includes(a.file))
        err('manifest', `asset "${a.id}" file ${a.file} is missing`);
    }
  }

  for (const c of input.courses) {
    const course = CourseSchema.safeParse(c.course);
    if (!course.success) {
      err(`${c.dir}/course.json`, course.error.message);
      continue;
    }
    const roadmapIds = new Set(course.data.roadmap.map((r) => r.id));

    const lessons: Lesson[] = [];
    for (const { file, json } of c.lessons) {
      try {
        const lesson = parseLesson(json);
        if (`${lesson.id}.json` !== file)
          err(`${c.dir}/${file}`, `file name must be ${lesson.id}.json`);
        if (lesson.courseId !== course.data.id)
          err(`${c.dir}/${file}`, `courseId must be ${course.data.id}`);
        lessons.push(lesson);
      } catch (e) {
        err(`${c.dir}/${file}`, e instanceof Error ? e.message : String(e));
      }
    }

    const ids = lessons.map((l) => l.id);
    for (const id of course.data.lessonIds) {
      if (!ids.includes(id)) err(`${c.dir}/course.json`, `lesson ${id} has no file`);
    }
    for (const id of ids) {
      if (!course.data.lessonIds.includes(id))
        err(`${c.dir}/course.json`, `lesson ${id} is not in lessonIds`);
    }
    for (const lesson of lessons) {
      const index = course.data.lessonIds.indexOf(lesson.id);
      if (index >= 0 && lesson.order !== index) {
        err(`${c.dir}/${lesson.id}`, `order ${String(lesson.order)} must be ${String(index)}`);
      }
    }

    for (const lesson of lessons.filter(isOpenLesson)) {
      await checkOpenLesson(lesson, `${c.dir}/${lesson.id}`, {
        roadmapIds,
        assetIds,
        input,
        py,
        err,
      });
    }

    if (c.sampleGame !== undefined) {
      const failure = await runSampleGame(c.sampleGame, py);
      if (failure !== null) err(`${c.dir}/sample-game/main.py`, `sample game fails: ${failure}`);
    }
  }
  return errors;
}

type Ctx = {
  roadmapIds: Set<string>;
  assetIds: Set<string>;
  input: ContentInput;
  py: PyRunner;
  err: (where: string, msg: string) => void;
};

async function checkOpenLesson(lesson: OpenLesson, where: string, ctx: Ctx): Promise<void> {
  for (const id of lesson.unlocksRoadmap) {
    if (!ctx.roadmapIds.has(id))
      ctx.err(where, `unlocksRoadmap "${id}" is not on the course roadmap`);
  }
  for (const step of lesson.steps) {
    for (const slide of step.slides) {
      if (slide.image !== undefined && !ctx.input.assetFiles.includes(slide.image)) {
        ctx.err(where, `slide ${slide.id} image ${slide.image} is missing`);
      }
    }
  }
  const code = lesson.code;
  if (code === undefined) return;

  const known: readonly string[] = BLOCK_TYPES;
  for (const id of code.toolbox)
    if (!known.includes(id)) ctx.err(where, `unknown toolbox block "${id}"`);
  for (const goal of code.goals) {
    if (goal.kind === 'drew' && !ctx.assetIds.has(goal.sprite)) {
      ctx.err(where, `goal ${goal.id} sprite "${goal.sprite}" is not in the asset library`);
    }
  }

  // Rule 9: what the lesson ships must survive code → blocks → code unchanged, or the editor would
  // rewrite it the moment the child touches a block.
  registerBlocks();
  for (const [kind, files] of [
    ['starter', code.starter],
    ['solution', code.solution],
  ] as const) {
    const source = files[code.main] ?? '';
    const tree = ctx.py.parseBlocks(source);
    const back = tree.ok ? toPython(treeToState(tree.statements)) : null;
    if (back === null || back.trimEnd() !== source.trimEnd()) {
      ctx.err(where, `${kind} code does not survive the blocks round trip`);
    }
  }

  const solution = await runLesson(ctx.py, code.mode, code.solution, code.main, code.test);
  const failed = checkGoals(code.goals, solution).filter((g) => !g.ok);
  if (failed.length > 0) {
    const why = solution.error === undefined ? '' : ` (${solution.error.raw})`;
    ctx.err(where, `solution misses goals ${failed.map((g) => g.id).join(', ')}${why}`);
  }
  const starter = await runLesson(ctx.py, code.mode, code.starter, code.main, code.test);
  if (checkGoals(code.goals, starter).every((g) => g.ok)) {
    ctx.err(where, 'starter already passes every goal; the lesson would finish itself');
  }
}

async function runLesson(
  py: PyRunner,
  mode: 'script' | 'game',
  files: Record<string, string>,
  main: string,
  test: { frames: number; taps: number[] } = { frames: 90, taps: [] },
): Promise<RunResult> {
  if (mode === 'script') return py.runScript(files, main, { seed: SEED, maxEvents: 5000 });
  return runGameTest(
    { start: () => py.startGame(files, main, { seed: SEED }), step: (input) => py.step(input) },
    test,
  );
}

/** Plays 300 frames, tapping now and then, so ready → play → over → ready all run. */
async function runSampleGame(source: string, py: PyRunner): Promise<string | null> {
  const start = await py.startGame({ 'main.py': source }, 'main.py', { seed: SEED });
  if (start.error !== undefined) return start.error.raw;
  for (let f = 0; f < GAME_FRAMES; f++) {
    const r = py.step({ keys: [], tapped: f % 18 === 0 });
    if (r.error !== undefined) return `frame ${String(f)}: ${r.error.raw}`;
  }
  return null;
}
