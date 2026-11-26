import { BLOCK_TYPES, registerBlocks, toPython, treeToState } from '@pyquest/blocks';
import {
  checkGoals,
  needsExpected,
  needsShiftedRun,
  runGameTest,
  shiftSource,
  type GoalResult,
} from '@pyquest/checker';
import {
  AssetManifestSchema,
  CourseSchema,
  LibraryRefSchema,
  StudioSchema,
  type Studio,
  type StudioTemplate,
  isOpenLesson,
  parseLesson,
  type Course,
  type Exercise,
  type GameTest,
  type Lesson,
  type OpenLesson,
} from '@pyquest/content-schema';
import {
  DEFAULT_STAGE,
  type BlockNode,
  type PyRunner,
  type RunResult,
  type StageSize,
} from '@pyquest/runtime';

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
  /** content/studio/studio.json (🎨 Xưởng vẽ). */
  studio?: unknown;
};

const SEED = 1;
const GAME_FRAMES = 300;

/** Every rule from docs/conventions/content-authoring.md §5. Returns human-readable errors; empty = green. */
export async function checkContent(input: ContentInput, py: PyRunner): Promise<string[]> {
  const errors: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  for (const stray of input.strayFiles) err(stray, 'stray file in content/ (rule 8)');

  checkCourses(input, err);

  // Rule 10: the library reference parses and points at lessons that exist.
  const allLessonIds = new Set(
    input.courses.flatMap((c) => c.lessons.map((l) => (l.json as { id?: string }).id ?? '')),
  );
  if (input.library !== undefined) {
    const lib = LibraryRefSchema.safeParse(input.library);
    if (!lib.success) err('reference/pyquest.json', lib.error.message);
    else
      for (const e of lib.data.entries)
        if (e.lesson !== undefined && !allLessonIds.has(e.lesson))
          err('reference/pyquest.json', `${e.name}: unknown lesson ${e.lesson}`);
  }

  const manifest = AssetManifestSchema.safeParse(input.manifest);
  if (manifest.success) py.setAssets(manifest.data.assets.map((a) => a.id));
  if (input.studio !== undefined) await checkStudio(input.studio, py, err);
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
    // Grading runs use the course's stage, like the page does (ADR 0009); absent = 400 × 600.
    const stage = course.data.stage;

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
        stage,
      });
    }

    if (c.sampleGame !== undefined) {
      const failure = await runSampleGame(c.sampleGame, py, course.data.sampleStage ?? stage);
      if (failure !== null) err(`${c.dir}/sample-game/main.py`, `sample game fails: ${failure}`);
    }
  }
  return errors;
}

/** Saved work and links know a lesson by its id alone, so it is one letter and two digits (h05), used once. */
const LESSON_ID = /^[a-z]\d{2}$/;

/** Rule 13: lesson ids are unique on the whole platform; `after` names another course, without going round (ADR 0011). */
function checkCourses(input: ContentInput, err: (where: string, msg: string) => void): void {
  const owner = new Map<string, string>();
  for (const c of input.courses)
    for (const { file, json } of c.lessons) {
      const id = (json as { id?: unknown }).id;
      if (typeof id !== 'string') continue; // the lesson schema reports it
      if (!LESSON_ID.test(id))
        err(`${c.dir}/${file}`, `lesson id "${id}" must be a letter and two digits, like h05`);
      const first = owner.get(id);
      if (first !== undefined)
        err(`${c.dir}/${file}`, `duplicate lesson id "${id}" (already in ${first})`);
      else owner.set(id, c.dir);
    }

  const after = new Map<string, Course['after']>();
  for (const c of input.courses) {
    const course = CourseSchema.safeParse(c.course);
    if (course.success) after.set(course.data.id, course.data.after);
  }
  for (const id of after.keys()) {
    const seen = new Set([id]);
    for (let next = after.get(id); next !== undefined; next = after.get(next)) {
      if (!after.has(next)) err(id, `after: unknown course "${next}"`);
      if (seen.has(next)) {
        err(id, `after: the courses go round in a circle (${[...seen, next].join(' → ')})`);
        break;
      }
      seen.add(next);
    }
  }
}

type Ctx = {
  roadmapIds: Set<string>;
  assetIds: Set<string>;
  input: ContentInput;
  py: PyRunner;
  err: (where: string, msg: string) => void;
  stage: StageSize | undefined;
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
  for (const ex of lesson.exercises ?? []) await checkExercise(ex, `${where}/${ex.id}`, ctx);
}

/**
 * Rule 12: the drawing studio (spec 2026-11-23 §6) offers real blocks, and its starter is a drawing that
 * runs on the studio's stage and that the block editor keeps exactly as written.
 */
async function checkStudio(
  json: unknown,
  py: PyRunner,
  err: (where: string, msg: string) => void,
): Promise<void> {
  const where = 'studio/studio.json';
  const parsed = StudioSchema.safeParse(json);
  if (!parsed.success) {
    err(where, parsed.error.message);
    return;
  }
  const studio = parsed.data;
  const known: readonly string[] = BLOCK_TYPES;
  for (const id of studio.toolbox)
    if (!known.includes(id)) err(where, `unknown toolbox block "${id}"`);
  registerBlocks();
  const tree = py.parseBlocks(studio.starter);
  const back = tree.ok ? toPython(treeToState(tree.statements)) : null;
  if (back === null || back.trimEnd() !== studio.starter.trimEnd()) {
    err(where, 'starter code does not survive the blocks round trip');
  }
  if (tree.ok) {
    const missing = [...blockTypes(tree.statements)].filter((t) => !studio.toolbox.includes(t));
    if (missing.length > 0)
      err(where, `toolbox lacks blocks the starter uses: ${missing.join(', ')}`);
  }
  const run = await py.runScript({ 'main.py': studio.starter }, 'main.py', {
    seed: SEED,
    maxEvents: 5000,
    stage: studio.stage,
  });
  if (run.error !== undefined) err(where, `starter fails: ${run.error.raw}`);
  for (const t of studio.templates)
    await checkTemplate(studio, t, py, (msg) => {
      err(where, msg);
    });
}

/** Drawn pieces, not the sky, words to the console, sounds or frame marks. */
const NOT_A_SHAPE = new Set(['clear', 'frame', 'say', 'sound', 'music']);

/**
 * A 📐 template (spec 2026-11-26 §5.2) is a picture the child can rebuild with the studio's own blocks: it runs on
 * the studio's stage, keeps its exact text through the block editor, and draws at least 3 shapes.
 */
async function checkTemplate(
  studio: Studio,
  t: StudioTemplate,
  py: PyRunner,
  err: (msg: string) => void,
): Promise<void> {
  const name = `template "${t.id}"`;
  const tree = py.parseBlocks(t.code);
  const back = tree.ok ? toPython(treeToState(tree.statements)) : null;
  if (back === null || back.trimEnd() !== t.code.trimEnd())
    err(`${name} does not survive the blocks round trip`);
  if (tree.ok) {
    if (usesCodeText(tree.statements))
      err(`${name} has code text blocks: every line must be a real block the child can drag`);
    const missing = [...blockTypes(tree.statements)].filter((b) => !studio.toolbox.includes(b));
    if (missing.length > 0) err(`${name} uses blocks not in the toolbox: ${missing.join(', ')}`);
  }
  const run = await py.runScript({ 'main.py': t.code }, 'main.py', {
    seed: SEED,
    maxEvents: 5000,
    stage: studio.stage,
  });
  if (run.error !== undefined) {
    err(`${name} fails: ${run.error.raw}`);
    return;
  }
  if (run.events.filter((e) => !NOT_A_SHAPE.has(e.t)).length < 3)
    err(`${name} draws fewer than 3 shapes`);
}

/** Code text, blank lines and call blocks are never in a toolbox list: they come from the code itself. */
const NOT_IN_TOOLBOX = new Set(['pq_raw', 'pq_raw_expr', 'pq_call', 'pq_call_expr']);

/** A code-text line that is really code: not a blank line, not a # comment (those show quietly, ADR 0003). */
const realCodeText = (n: BlockNode): boolean => {
  const state = n.extraState as { code?: unknown } | undefined;
  const code = typeof state?.code === 'string' ? state.code.trim() : '';
  return code !== '' && !code.startsWith('#');
};

/** True when some line or value of the tree is only code text (pq_raw / pq_raw_expr), not a real block. */
function usesCodeText(nodes: readonly BlockNode[]): boolean {
  const raw = (n: BlockNode): boolean =>
    (n.type === 'pq_raw' && realCodeText(n)) ||
    n.type === 'pq_raw_expr' ||
    Object.values(n.inputs ?? {}).some(raw) ||
    Object.values(n.statements ?? {}).some((list) => list.some(raw));
  return nodes.some(raw);
}

/** The toolbox block types a block tree uses, nested blocks too. */
export function blockTypes(nodes: readonly BlockNode[]): Set<string> {
  const out = new Set<string>();
  const walk = (n: BlockNode) => {
    if (!NOT_IN_TOOLBOX.has(n.type)) out.add(n.type);
    for (const c of Object.values(n.inputs ?? {})) walk(c);
    for (const list of Object.values(n.statements ?? {})) list.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

/** The checker's own match (inGroup): the picture itself, or a picture whose id starts with it and a dash. */
const hasPicture = (assetIds: ReadonlySet<string>, sprite: string): boolean =>
  [...assetIds].some((id) => id === sprite || id.startsWith(`${sprite}-`));

/** Every exercise is checked like a whole lesson used to be (spec foundations-first §4). */
async function checkExercise(code: Exercise, where: string, ctx: Ctx): Promise<void> {
  const known: readonly string[] = BLOCK_TYPES;
  for (const id of code.toolbox)
    if (!known.includes(id)) ctx.err(where, `unknown toolbox block "${id}"`);
  for (const goal of code.goals) {
    // A goal's sprite is one picture (hero-knight) or the first part of several ids (hero, skill-fire).
    if ('sprite' in goal && !hasPicture(ctx.assetIds, goal.sprite)) {
      ctx.err(where, `goal ${goal.id} sprite "${goal.sprite}" is not in the asset library`);
    }
    if ((goal.kind === 'shifts' || goal.kind === 'matches') && code.mode !== 'script') {
      ctx.err(where, `goal ${goal.id}: ${goal.kind} only works in script mode`);
    }
  }

  const { width, height } = ctx.stage ?? DEFAULT_STAGE;
  for (const c of code.test?.clicks ?? []) {
    if (c.x < 0 || c.x > width || c.y < 0 || c.y > height)
      ctx.err(
        where,
        `test click at (${String(c.x)}, ${String(c.y)}) is outside the ${String(width)} × ${String(height)} stage`,
      );
  }

  // Rule 9: what the lesson ships must survive code → blocks → code unchanged, or the editor would
  // rewrite it the moment the child touches a block.
  registerBlocks();
  const needed = new Set<string>();
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
    if (tree.ok) for (const t of blockTypes(tree.statements)) needed.add(t);
  }
  // Rule 11: every exercise can be built by dragging blocks (HLV 23/11, ADR 0008), so the toolbox
  // holds every block the starter and the solution use.
  const missing = [...needed].filter((t) => !code.toolbox.includes(t));
  if (missing.length > 0) {
    ctx.err(where, `toolbox lacks blocks the code uses: ${missing.join(', ')}`);
  }

  const solution = await gradeFiles(ctx.py, code, code.solution, ctx.stage);
  const failed = solution.goals.filter((g) => !g.ok);
  if (failed.length > 0) {
    const why = solution.run.error === undefined ? '' : ` (${solution.run.error.raw})`;
    ctx.err(where, `solution misses goals ${failed.map((g) => g.id).join(', ')}${why}`);
  }
  const starter = await gradeFiles(ctx.py, code, code.starter, ctx.stage);
  if (starter.goals.every((g) => g.ok)) {
    ctx.err(where, 'starter already passes every goal; the exercise would finish itself');
  }
}

/**
 * Runs an exercise's files and grades them the way the page does: a 'shifts' goal's second run and a
 * 'matches' goal's solution run included.
 */
async function gradeFiles(
  py: PyRunner,
  code: Exercise,
  files: Record<string, string>,
  stage: StageSize | undefined,
): Promise<{ run: RunResult; goals: GoalResult[] }> {
  const run = await runLesson(py, code.mode, files, code.main, code.test, stage);
  const shift = needsShiftedRun(code.goals);
  const moved =
    shift === undefined ? undefined : shiftSource(files[code.main] ?? '', shift.var, shift.by);
  const shifted =
    moved === undefined
      ? undefined
      : await runLesson(
          py,
          code.mode,
          { ...files, [code.main]: moved },
          code.main,
          code.test,
          stage,
        );
  const expected = needsExpected(code.goals)
    ? await runLesson(py, code.mode, code.solution, code.main, code.test, stage)
    : undefined;
  return {
    run,
    goals: checkGoals(code.goals, run, {
      ...(shifted === undefined ? {} : { shifted }),
      ...(expected === undefined ? {} : { expected }),
      ...(stage === undefined ? {} : { stage }),
    }),
  };
}

async function runLesson(
  py: PyRunner,
  mode: 'script' | 'game',
  files: Record<string, string>,
  main: string,
  test: GameTest = { frames: 90, taps: [] },
  stage?: StageSize,
): Promise<RunResult> {
  const size = stage === undefined ? {} : { stage };
  if (mode === 'script') return py.runScript(files, main, { seed: SEED, maxEvents: 5000, ...size });
  return runGameTest(
    {
      start: () => py.startGame(files, main, { seed: SEED, ...size }),
      step: (input) => py.step(input),
    },
    test,
  );
}

/** Plays 300 frames, tapping now and then, so ready → play → over → ready all run. */
async function runSampleGame(
  source: string,
  py: PyRunner,
  stage: StageSize | undefined,
): Promise<string | null> {
  const start = await py.startGame({ 'main.py': source }, 'main.py', {
    seed: SEED,
    ...(stage === undefined ? {} : { stage }),
  });
  if (start.error !== undefined) return start.error.raw;
  for (let f = 0; f < GAME_FRAMES; f++) {
    const r = py.step({ keys: [], tapped: f % 18 === 0 });
    if (r.error !== undefined) return `frame ${String(f)}: ${r.error.raw}`;
  }
  return null;
}
