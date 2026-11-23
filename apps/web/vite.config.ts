import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { HEAD_QUERY, headOf } from './src/content/lessonHead';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

/** `lesson.json?head` is the lesson without its slides and code (ADR 0012). Dev adds `import` to the query. */
const lessonHeads: Plugin = {
  name: 'pyquest:lesson-heads',
  enforce: 'pre',
  async load(id) {
    const [file = '', query = ''] = id.split('?');
    if (!file.endsWith('.json') || !query.split('&').includes(HEAD_QUERY)) return null;
    this.addWatchFile(file);
    const head = headOf(JSON.parse(await readFile(file, 'utf8')));
    return { code: `export default ${JSON.stringify(head)};`, map: null, moduleType: 'js' };
  },
};

const LESSON_BODY =
  /content\/courses\/([^/]+)\/(?:lessons\/[^/]+\.json|sample-game\/main\.py\?raw)$/;

/** The build fails when a lesson lands anywhere but in its course's own download (ADR 0012). */
const courseChunks: Plugin = {
  name: 'pyquest:course-chunks',
  apply: 'build',
  generateBundle(_, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue;
      for (const id of chunk.moduleIds) {
        const course = LESSON_BODY.exec(id)?.[1];
        if (course !== undefined && chunk.name !== `course-${course}`)
          this.error(`${id} is in chunk "${chunk.name}", not in "course-${course}"`);
      }
    }
  },
};

export default defineConfig({
  // GitHub Pages serves the app under /Pyquest/ (deploy job in .github/workflows/ci.yml); everything else under /.
  base: process.env['PQ_BASE'] ?? '/',
  plugins: [lessonHeads, courseChunks, react(), tailwindcss()],
  resolve: {
    alias: { '@content': `${repoRoot}content` },
  },
  // Pyodide loads its own wasm and stdlib from /pyodide/ (ADR 0002); Vite must not pre-bundle it.
  optimizeDeps: { exclude: ['pyodide'] },
  worker: { format: 'es' },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // One download per course: its lessons and sample game come together (ADR 0012).
          groups: [
            {
              test: LESSON_BODY,
              name: (id) => {
                const course = LESSON_BODY.exec(id)?.[1];
                return course === undefined ? null : `course-${course}`;
              },
            },
          ],
        },
      },
    },
  },
  server: { fs: { allow: [repoRoot] } },
});
