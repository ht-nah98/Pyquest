import type { BlockTree, Files, GameInput, RunResult } from '@pyquest/runtime';

export type WorkerRequest =
  | { id: number; kind: 'run'; files: Files; main: string; seed: number; maxEvents: number }
  | { id: number; kind: 'start'; files: Files; main: string; seed: number }
  | { id: number; kind: 'step'; input: GameInput }
  | { id: number; kind: 'parse'; source: string };

export type WorkerReply =
  | { kind: 'ready' }
  | { kind: 'failed'; message: string }
  | { id: number; ok: true; result: RunResult | BlockTree }
  | { id: number; ok: false; message: string };
