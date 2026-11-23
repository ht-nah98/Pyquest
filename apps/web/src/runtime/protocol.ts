import type { BlockTree, Files, GameInput, RunResult, StageSize } from '@pyquest/runtime';

/** stage: the course's stage, so WIDTH / HEIGHT in the child's Python match the canvas. */
export type WorkerRequest =
  | {
      id: number;
      kind: 'run';
      files: Files;
      main: string;
      seed: number;
      maxEvents: number;
      stage: StageSize;
    }
  | { id: number; kind: 'start'; files: Files; main: string; seed: number; stage: StageSize }
  | { id: number; kind: 'step'; input: GameInput }
  | { id: number; kind: 'parse'; source: string };

export type WorkerReply =
  | { kind: 'ready' }
  | { kind: 'failed'; message: string }
  | { id: number; ok: true; result: RunResult | BlockTree }
  | { id: number; ok: false; message: string };
