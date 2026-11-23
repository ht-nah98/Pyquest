import type { BlockTree, Files, GameInput, RunResult, StageSize } from '@pyquest/runtime';
import { DEFAULT_STAGE } from '@pyquest/runtime';
import { useSyncExternalStore } from 'react';
import type { WorkerReply, WorkerRequest } from './protocol';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'running' | 'failed';

type RunCall = { stage?: StageSize; seed?: number; maxEvents?: number };
type GameCall = { stage?: StageSize; seed?: number };

type Pending = { resolve: (v: RunResult | BlockTree) => void; reject: (e: Error) => void };
type Body<K> = K extends WorkerRequest ? Omit<K, 'id'> : never;

/**
 * One Python worker for the whole app, so Pyodide (~10 MB) loads once. stop() kills a runaway program
 * by terminating the worker; the next call starts a fresh one.
 */
export class PyClient {
  private worker: Worker | null = null;
  /** The worker the running game was started in. */
  private gameWorker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private statusValue: PyStatus = 'idle';
  private listeners = new Set<() => void>();
  private readyPromise: Promise<void> | null = null;

  constructor(
    private readonly makeWorker: () => Worker = () =>
      new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' }),
  ) {}

  /** True while Python is working on a call (Stop must then kill the worker). */
  get hasPending(): boolean {
    return this.pending.size > 0;
  }

  get status(): PyStatus {
    return this.statusValue;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private setStatus(s: PyStatus) {
    this.statusValue = s;
    for (const fn of this.listeners) fn();
  }

  /** Starts loading Python early (e.g. when a lesson opens), so ▶ Chạy is instant later. */
  warmUp(): Promise<void> {
    if (this.readyPromise !== null) return this.readyPromise;
    this.setStatus('loading');
    const worker = this.makeWorker();
    this.worker = worker;
    this.readyPromise = new Promise((resolve, reject) => {
      let ready = false;
      // A failed load forgets this worker, so the next warmUp() (the retry button) starts clean (review I2).
      const fail = (message: string) => {
        if (this.worker !== worker) return; // stopped or replaced meanwhile
        worker.terminate();
        this.worker = null;
        this.readyPromise = null;
        for (const p of this.pending.values()) p.reject(new Error(message));
        this.pending.clear();
        this.setStatus('failed');
        reject(new Error(message));
        // It had worked, so it crashed (out of memory…): a fresh one brings ▶ back. One that cannot even load
        // waits for the retry button instead.
        if (ready) void this.warmUp().catch(() => undefined);
      };
      worker.onerror = () => {
        fail('python worker could not load');
      };
      worker.onmessage = (e: MessageEvent<WorkerReply>) => {
        const msg = e.data;
        if ('kind' in msg) {
          if (msg.kind === 'ready') {
            ready = true;
            this.setStatus('ready');
            resolve();
          } else fail(msg.message);
          return;
        }
        if (!msg.ok) {
          // The child's own errors come back as results: this is Python itself broken, not to be used again.
          fail(msg.message);
          return;
        }
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (this.pending.size === 0 && this.statusValue === 'running') this.setStatus('ready');
        p?.resolve(msg.result);
      };
    });
    return this.readyPromise;
  }

  private async call(body: Body<WorkerRequest>): Promise<RunResult | BlockTree> {
    await this.warmUp();
    const worker = this.worker;
    if (worker === null) throw new Error('stopped');
    if (body.kind === 'start') this.gameWorker = worker;
    const id = this.nextId++;
    if (body.kind !== 'parse') this.setStatus('running');
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ ...body, id });
    });
  }

  /** stage: the course's stage (catalog.lessonStage), so WIDTH / HEIGHT match what is drawn. */
  run(
    files: Files,
    main: string,
    { stage = DEFAULT_STAGE, seed = 1, maxEvents = 5000 }: RunCall = {},
  ): Promise<RunResult> {
    return this.call({ kind: 'run', files, main, seed, maxEvents, stage }) as Promise<RunResult>;
  }

  startGame(
    files: Files,
    main: string,
    { stage = DEFAULT_STAGE, seed = Date.now() % 100000 }: GameCall = {},
  ): Promise<RunResult> {
    return this.call({ kind: 'start', files, main, seed, stage }) as Promise<RunResult>;
  }

  step(input: GameInput): Promise<RunResult> {
    if (this.worker !== this.gameWorker)
      return Promise.reject(new Error('the worker of this game is gone'));
    return this.call({ kind: 'step', input }) as Promise<RunResult>;
  }

  parse(source: string): Promise<BlockTree> {
    return this.call({ kind: 'parse', source }) as Promise<BlockTree>;
  }

  /** ■ Dừng: kill the worker (the only way to stop `while True: pass`), reload lazily. */
  stop(): void {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    for (const p of this.pending.values()) p.reject(new Error('stopped'));
    this.pending.clear();
    this.setStatus('idle');
  }
}

export const python = new PyClient();

export function usePyStatus(): PyStatus {
  return useSyncExternalStore(python.subscribe, () => python.status);
}
