import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PyRunner } from '@pyquest/runtime';
import { checkContent, type ContentInput } from './rules';

const CONTENT = fileURLToPath(new URL('../../../content', import.meta.url));
const LIBRARY = join(CONTENT, 'assets/library');

/** Every file under content/ must match one of these (rule 8, AGENTS.md §9.13). */
const ALLOWED = [
  /^courses\/[a-z0-9-]+\/course\.json$/,
  /^courses\/[a-z0-9-]+\/lessons\/l\d{2}\.json$/,
  /^courses\/[a-z0-9-]+\/sample-game\/[a-z0-9_]+\.py$/,
  /^assets\/library\/manifest\.json$/,
  /^assets\/library\/[a-z0-9-]+\.png$/,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8')) as unknown;

const files = walk(CONTENT).map((f) => relative(CONTENT, f));
const input: ContentInput = {
  courses: readdirSync(join(CONTENT, 'courses')).map((dir) => {
    const base = join(CONTENT, 'courses', dir);
    const sample = join(base, 'sample-game/main.py');
    return {
      dir,
      course: readJson(join(base, 'course.json')),
      lessons: readdirSync(join(base, 'lessons'))
        .sort()
        .map((file) => ({ file, json: readJson(join(base, 'lessons', file)) })),
      ...(existsSync(sample) ? { sampleGame: readFileSync(sample, 'utf8') } : {}),
    };
  }),
  manifest: existsSync(join(LIBRARY, 'manifest.json'))
    ? readJson(join(LIBRARY, 'manifest.json'))
    : { assets: [] },
  assetFiles: existsSync(LIBRARY) ? readdirSync(LIBRARY) : [],
  strayFiles: files.filter((f) => !ALLOWED.some((re) => re.test(f))),
};

const py = await PyRunner.create();
const errors = await checkContent(input, py);
const lessons = input.courses.flatMap((c) => c.lessons);
const open = lessons.filter((l) => (l.json as { hidden?: boolean }).hidden !== true).length;

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`content:check: ${String(errors.length)} error(s)`);
  process.exit(1);
}
console.log(
  `content:check ✓ ${String(input.courses.length)} course(s), ${String(lessons.length)} lessons (${String(open)} open), ${String(files.length)} files`,
);
