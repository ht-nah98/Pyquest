import type { RunResult } from '@pyquest/runtime';

/**
 * Python itself failed (its worker crashed, ran out of memory, could not load): a result every screen shows
 * like any other error. Never for ■ Dừng, which is no failure.
 */
export function brokenRun(e: unknown): RunResult {
  return {
    events: [],
    vars: {},
    stoppedByLimit: false,
    calls: [],
    error: {
      line: null,
      messageVi: 'Có trục trặc khi chạy. Em thử chạy lại nhé.',
      raw: e instanceof Error ? e.message : String(e),
    },
  };
}

/** What went wrong in a run, for the child; null when nothing did. */
export function problemOf(r: RunResult): string | null {
  if (r.error !== undefined) return r.error.messageVi;
  return r.stoppedByLimit ? 'Chương trình chạy mãi không dừng, mình đã dừng giúp em.' : null;
}
