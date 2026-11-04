import type { BlockTree, Files, GameInput, RunResult } from '@pyquest/runtime';
import { useSyncExternalStore } from 'react';
import type { WorkerReply, WorkerRequest } from './protocol';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'running' | 'failed';

type Pending = { resolve: (v: RunResult | BlockTree) => void; reject: (e: Error) => void };
type Body<K> = K extends WorkerRequest ? Omit<K, 'id'> : never;

/**
 * One Python worker for the whole app, so Pyodide (~10 MB) loads once. stop() kills a runaway program
 * by terminating the worker; the next call starts a fresh one.
 */
class PyClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private statusValue: PyStatus = 'idle';
  private listeners = new Set<() => void>();
  private readyPromise: Promise<void> | null = null;

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
    const worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    this.readyPromise = new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<WorkerReply>) => {
        const msg = e.data;
        if ('kind' in msg) {
          if (msg.kind === 'ready') {
            this.setStatus('ready');
            resolve();
          } else {
            this.setStatus('failed');
            reject(new Error(msg.message));
          }
          return;
        }
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (this.pending.size === 0 && this.statusValue === 'running') this.setStatus('ready');
        if (msg.ok) p?.resolve(msg.result);
        else p?.reject(new Error(msg.message));
      };
    });
    return this.readyPromise;
  }

  private async call(body: Body<WorkerRequest>): Promise<RunResult | BlockTree> {
    await this.warmUp();
    const worker = this.worker;
    if (worker === null) throw new Error('stopped');
    const id = this.nextId++;
    if (body.kind !== 'parse') this.setStatus('running');
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ ...body, id });
    });
  }

  run(files: Files, main: string, seed = 1, maxEvents = 5000): Promise<RunResult> {
    return this.call({ kind: 'run', files, main, seed, maxEvents }) as Promise<RunResult>;
  }

  startGame(files: Files, main: string, seed = Date.now() % 100000): Promise<RunResult> {
    return this.call({ kind: 'start', files, main, seed }) as Promise<RunResult>;
  }

  step(input: GameInput): Promise<RunResult> {
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
