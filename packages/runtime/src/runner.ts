import { loadPyodide, type PyodideAPI } from 'pyodide';
import { translateError } from './errors';
import { HOST_SOURCE } from './pyquest/host.py.ts';
import { PYQUEST_SOURCE } from './pyquest/pyquest.py.ts';
import { TOBLOCKS_SOURCE } from './pyquest/toblocks.py.ts';
import type {
  BlockNode,
  BlockTree,
  DrawEvent,
  Files,
  GameInput,
  RunOptions,
  RunResult,
} from './types';

const DEFAULT_MAX_LINES = 1_000_000;
const SITE = '/home/pyodide/pqlib';

type RawResult = {
  events: DrawEvent[];
  vars: Record<string, number | string | boolean>;
  stoppedByLimit: boolean;
  error?: { type: string; msg: string; line: number | null };
};

type HostFn = (...args: unknown[]) => string;

/** Real Python (Pyodide) with the pyquest library. Works on Node (tests, content:check) and in a Web Worker. */
export class PyRunner {
  private constructor(
    private readonly runScriptFn: HostFn,
    private readonly startGameFn: HostFn,
    private readonly stepFn: HostFn,
    private readonly toBlocksFn: HostFn,
  ) {}

  /** indexURL: where pyodide.asm.wasm lives. Omit on Node; the page serves it from /pyodide/ (no CDN). */
  static async create(opts: { indexURL?: string } = {}): Promise<PyRunner> {
    const py: PyodideAPI = await loadPyodide(
      opts.indexURL === undefined ? {} : { indexURL: opts.indexURL },
    );
    // Pyodide's FS type does not resolve under skipLibCheck; this is the slice we use.
    const fs = py.FS as {
      mkdirTree(path: string): void;
      writeFile(path: string, data: string): void;
    };
    fs.mkdirTree(SITE);
    fs.writeFile(`${SITE}/pyquest.py`, PYQUEST_SOURCE);
    fs.writeFile(`${SITE}/pq_host.py`, HOST_SOURCE);
    fs.writeFile(`${SITE}/pq_toblocks.py`, TOBLOCKS_SOURCE);
    py.runPython(
      `import sys\nsys.path.insert(0, ${JSON.stringify(SITE)})\nimport pq_host, pq_toblocks`,
    );
    const host = py.pyimport('pq_host') as unknown as Record<string, HostFn>;
    const pick = (name: string): HostFn => {
      const fn = host[name];
      if (fn === undefined) throw new Error(`pq_host.${name} missing`);
      return fn;
    };
    const toBlocks = (py.pyimport('pq_toblocks') as unknown as Record<string, HostFn>)['to_blocks'];
    if (toBlocks === undefined) throw new Error('pq_toblocks.to_blocks missing');
    return new PyRunner(pick('run_script'), pick('start_game'), pick('step'), toBlocks);
  }

  /** Runs the program once and returns every draw event it made (script mode). */
  runScript(files: Files, main: string, opts: RunOptions): Promise<RunResult> {
    const raw = this.runScriptFn(
      JSON.stringify(files),
      main,
      opts.seed,
      opts.maxEvents,
      opts.maxLines ?? DEFAULT_MAX_LINES,
    );
    return Promise.resolve(toResult(raw));
  }

  /** Runs the module so update()/draw() exist (game mode). */
  startGame(
    files: Files,
    main: string,
    opts: { seed: number; maxLines?: number },
  ): Promise<RunResult> {
    const raw = this.startGameFn(
      JSON.stringify(files),
      main,
      opts.seed,
      opts.maxLines ?? DEFAULT_MAX_LINES,
    );
    return Promise.resolve(toResult(raw));
  }

  /** Parses Python into a block tree (ADR 0003). Syntax errors come back in Vietnamese, not thrown. */
  parseBlocks(source: string): BlockTree {
    const raw = JSON.parse(this.toBlocksFn(source)) as
      | { ok: true; statements: BlockNode[] }
      | { ok: false; type: string; msg: string; line: number | null };
    if (raw.ok) return raw;
    return { ok: false, line: raw.line, messageVi: translateError(raw.type, raw.msg, raw.line) };
  }

  /** One frame: update() then draw(); returns that frame's draw events. */
  step(input: GameInput): RunResult {
    return toResult(this.stepFn(JSON.stringify(input.keys), input.tapped));
  }
}

function toResult(json: string): RunResult {
  const raw = JSON.parse(json) as RawResult;
  const result: RunResult = {
    events: raw.events,
    vars: raw.vars,
    stoppedByLimit: raw.stoppedByLimit,
  };
  if (raw.error !== undefined) {
    result.error = {
      line: raw.error.line,
      messageVi: translateError(raw.error.type, raw.error.msg, raw.error.line),
      raw: `${raw.error.type}: ${raw.error.msg}`,
    };
  }
  return result;
}
