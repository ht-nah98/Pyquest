import type { Goal } from '@pyquest/content-schema';
import type { DrawEvent, GameInput, RunResult } from '@pyquest/runtime';

export type GoalResult = { id: string; ok: boolean };

/** Pure: grades a finished run against a lesson's goals. Never runs Python itself. */
export function checkGoals(goals: readonly Goal[], result: RunResult): GoalResult[] {
  return goals.map((goal) => ({ id: goal.id, ok: meets(goal, result) }));
}

/** Splits a run into frames at each 'frame' event; a script run is one frame. */
export function framesOf(events: readonly DrawEvent[]): DrawEvent[][] {
  const frames: DrawEvent[][] = [[]];
  for (const e of events) {
    if (e.t === 'frame') frames.push([]);
    else frames[frames.length - 1]?.push(e);
  }
  if (frames.length > 1 && frames[frames.length - 1]?.length === 0) frames.pop();
  return frames;
}

/** Position of the first copy of a sprite in each frame (undefined if not drawn that frame). */
function track(r: RunResult, sprite: string, axis: 'x' | 'y'): (number | undefined)[] {
  return framesOf(r.events).map((f) => {
    const e = f.find((x) => x.t === 'sprite' && x.sprite === sprite);
    return e?.t === 'sprite' ? e[axis] : undefined;
  });
}

const defined = (xs: (number | undefined)[]): number[] => xs.filter((v) => v !== undefined);

function meets(goal: Goal, r: RunResult): boolean {
  switch (goal.kind) {
    case 'moves': {
      const pos = defined(track(r, goal.sprite, goal.axis));
      const first = pos[0];
      const last = pos[pos.length - 1];
      return first !== undefined && last !== undefined && (last - first) * goal.dir > 0;
    }
    case 'staysWithin': {
      const pos = defined(track(r, goal.sprite, goal.axis));
      return (
        pos.length > 0 &&
        pos.every(
          (v) =>
            (goal.min === undefined || v >= goal.min) && (goal.max === undefined || v <= goal.max),
        )
      );
    }
    case 'risesAfterTap': {
      const ys = track(r, goal.sprite, 'y');
      return goal.taps.some((t) => {
        const before = ys[t - 1];
        const after = ys[t + 2] ?? ys[t + 1];
        return before !== undefined && after !== undefined && after < before;
      });
    }
    case 'speedsUp': {
      // Compare the average step of the first and the last third of the movement.
      const pos = defined(track(r, goal.sprite, goal.axis));
      const steps = pos.slice(1).map((v, i) => Math.abs(v - (pos[i] ?? v)));
      if (steps.length < 3) return false;
      const third = Math.max(1, Math.floor(steps.length / 3));
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      return avg(steps.slice(-third)) > avg(steps.slice(0, third)) + 1e-9;
    }
    case 'drewCount':
      return framesOf(r.events).some(
        (f) => f.filter((e) => e.t === 'sprite' && e.sprite === goal.sprite).length >= goal.min,
      );
    case 'noError':
      return r.error === undefined && !r.stoppedByLimit;
    case 'printed':
      return r.events.some((e) => e.t === 'say' && e.text.trim() === goal.text.trim());
    case 'drew': {
      const tolerance = goal.tolerance ?? 0;
      return r.events.some(
        (e) =>
          e.t === 'sprite' &&
          e.sprite === goal.sprite &&
          (goal.customImage !== true || e.asset !== undefined) &&
          (goal.at === undefined ||
            (Math.abs(e.x - goal.at[0]) <= tolerance && Math.abs(e.y - goal.at[1]) <= tolerance)),
      );
    }
    case 'varEquals':
      return r.vars[goal.name] === goal.value;
  }
}

export type GameApi = {
  start: () => Promise<RunResult>;
  step: (input: GameInput) => RunResult | Promise<RunResult>;
};

/**
 * The automatic test of a game-mode program: start it, play the scheduled frames (tapping on the
 * listed ones) and join the frames into one result the goals can judge. Same on Node and in the page.
 */
export async function runGameTest(
  api: GameApi,
  test: { frames: number; taps: readonly number[] },
): Promise<RunResult> {
  const start = await api.start();
  if (start.error !== undefined || start.stoppedByLimit) return start;
  // Drawing done while the module loads belongs to no frame: frame 0 is the first update().
  const all: RunResult = { events: [], vars: start.vars, stoppedByLimit: false };
  for (let f = 0; f < test.frames; f++) {
    const r = await api.step({ keys: [], tapped: test.taps.includes(f) });
    all.events.push(...r.events);
    all.vars = r.vars;
    if (r.error !== undefined) return { ...all, error: r.error };
    if (r.stoppedByLimit) return { ...all, stoppedByLimit: true };
  }
  return all;
}
