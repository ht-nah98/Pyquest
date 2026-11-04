import type { Goal } from '@pyquest/content-schema';
import type { DrawEvent, GameInput, RunResult } from '@pyquest/runtime';

// Same as STAGE_WIDTH/HEIGHT in @pyquest/runtime; importing a value from there would pull Pyodide in.
const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 600;

export type GoalResult = { id: string; ok: boolean };

/**
 * Pure: grades a finished run against a lesson's goals. Never runs Python itself.
 * shifted: the same program run again through shiftSource, for 'shifts' goals.
 */
export function checkGoals(
  goals: readonly Goal[],
  result: RunResult,
  shifted?: RunResult,
): GoalResult[] {
  return goals.map((goal) => ({ id: goal.id, ok: meets(goal, result, shifted) }));
}

/** Goals that need a second run of the program (see shiftSource). */
export function needsShiftedRun(
  goals: readonly Goal[],
): Extract<Goal, { kind: 'shifts' }> | undefined {
  return goals.find((g) => g.kind === 'shifts');
}

/**
 * The program with its one "name = number" line changed to number + by, or undefined when there is not
 * exactly one such line. Used to check the drawing really follows the variable.
 */
export function shiftSource(code: string, name: string, by: number): string | undefined {
  const re = new RegExp(`^${name} = (-?\\d+(?:\\.\\d+)?)[ \\t]*$`, 'gm');
  const hits = [...code.matchAll(re)];
  const hit = hits[0];
  if (hits.length !== 1 || hit?.[1] === undefined) return undefined;
  const at = hit.index;
  return `${code.slice(0, at)}${name} = ${String(Number(hit[1]) + by)}${code.slice(at + hit[0].length)}`;
}

/** "bird" matches the picture bird and every picture of its group: bird-cu, bird-rong… */
const inGroup = (picture: string, group: string) =>
  picture === group || picture.startsWith(`${group}-`);

type Shape = { t: string; x: number; y: number; rest: string };

/** The visible pieces of a run (boxes, pictures, words) with their place, for comparing two drawings. */
function pieces(events: readonly DrawEvent[]): Shape[] {
  const out: Shape[] = [];
  for (const e of events) {
    if (e.t === 'rect')
      out.push({ t: e.t, x: e.x, y: e.y, rest: `${String(e.w)}x${String(e.h)} ${e.color}` });
    else if (e.t === 'sprite')
      out.push({
        t: e.t,
        x: e.x,
        y: e.y,
        rest: `${e.sprite} ${String(e.frame)} ${String(e.flip ?? false)}`,
      });
    else if (e.t === 'text')
      out.push({ t: e.t, x: e.x, y: e.y, rest: `${e.text} ${String(e.size)}` });
  }
  return out;
}

/** The ids of a call and every call made inside it. */
function family(r: RunResult, root: number): Set<number> {
  const ids = new Set([root]);
  for (const c of r.calls) if (c.parent !== null && ids.has(c.parent)) ids.add(c.id);
  return ids;
}

/** One call's drawing, moved so its first piece sits at (0, 0). */
function shapeOf(r: RunResult, callId: number): string | undefined {
  const ids = family(r, callId);
  const own = pieces(
    r.events.filter((e) => e.t !== 'frame' && e.by !== undefined && ids.has(e.by)),
  );
  const first = own[0];
  if (first === undefined) return undefined;
  return own
    .map((p) => `${p.t} ${String(p.x - first.x)} ${String(p.y - first.y)} ${p.rest}`)
    .join('|');
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
    const e = f.find((x) => x.t === 'sprite' && inGroup(x.sprite, sprite));
    return e?.t === 'sprite' ? e[axis] : undefined;
  });
}

const defined = (xs: (number | undefined)[]): number[] => xs.filter((v) => v !== undefined);

function meets(goal: Goal, r: RunResult, shifted: RunResult | undefined): boolean {
  switch (goal.kind) {
    case 'drewRects':
      return framesOf(r.events).some(
        (f) =>
          f.filter((e) => e.t === 'rect' && !(e.w >= STAGE_WIDTH && e.h >= STAGE_HEIGHT)).length >=
          goal.min,
      );
    case 'called': {
      const calls = r.calls.filter((c) => c.name === goal.name);
      const count =
        goal.distinct === true
          ? new Set(calls.map((c) => JSON.stringify(c.args))).size
          : calls.length;
      return count >= (goal.min ?? 1);
    }
    case 'sameShape': {
      const shapes = r.calls.filter((c) => c.name === goal.name).map((c) => shapeOf(r, c.id));
      return shapes.length >= 2 && shapes.every((s) => s !== undefined && s === shapes[0]);
    }
    case 'shifts': {
      if (shifted === undefined || shifted.error !== undefined) return false;
      const a = pieces(r.events);
      const b = pieces(shifted.events);
      if (a.length === 0 || a.length !== b.length) return false;
      let moved = 0;
      for (const [i, p] of a.entries()) {
        const q = b[i];
        if (q === undefined || q.t !== p.t || q.rest !== p.rest) return false;
        const d = goal.axis === 'x' ? q.x - p.x : q.y - p.y;
        const other = goal.axis === 'x' ? q.y - p.y : q.x - p.x;
        if (other !== 0 || (d !== 0 && d !== goal.by)) return false;
        if (d === goal.by) moved++;
      }
      return moved > 0;
    }
    case 'moves': {
      const pos = defined(track(r, goal.sprite, goal.axis));
      const first = pos[0];
      const last = pos[pos.length - 1];
      return first !== undefined && last !== undefined && (last - first) * goal.dir > 0;
    }
    case 'staysWithin': {
      const all = track(r, goal.sprite, goal.axis);
      const pos = defined(
        goal.frames === undefined ? all : all.slice(goal.frames[0], goal.frames[1] + 1),
      );
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
    case 'distinctCount': {
      const values = new Set<number>();
      for (const e of r.events)
        if (e.t === 'sprite' && inGroup(e.sprite, goal.sprite)) values.add(e[goal.axis]);
      return values.size >= goal.min;
    }
    case 'drewText':
      return r.events.some((e) => e.t === 'text' && e.text === goal.text);
    case 'drewCount':
      return framesOf(r.events).some(
        (f) =>
          f.filter((e) => e.t === 'sprite' && inGroup(e.sprite, goal.sprite)).length >= goal.min,
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
          inGroup(e.sprite, goal.sprite) &&
          (goal.customImage !== true || e.sprite !== goal.sprite) &&
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

/** A game test run: every frame joined; lastFrameFrom = id of the first call made in the last frame. */
export type GameTestResult = RunResult & { lastFrameFrom: number };

/**
 * The automatic test of a game-mode program: start it, play the scheduled frames (tapping on the
 * listed ones) and join the frames into one result the goals can judge. Same on Node and in the page.
 * Each frame numbers its calls from 0, so they are renumbered here to stay unique across frames.
 */
export async function runGameTest(
  api: GameApi,
  test: { frames: number; taps: readonly number[] },
): Promise<GameTestResult> {
  const start = await api.start();
  if (start.error !== undefined || start.stoppedByLimit) return { ...start, lastFrameFrom: 0 };
  // Drawing done while the module loads belongs to no frame: frame 0 is the first update().
  const all: GameTestResult = {
    events: [],
    vars: start.vars,
    stoppedByLimit: false,
    calls: [],
    lastFrameFrom: 0,
  };
  for (let f = 0; f < test.frames; f++) {
    const r = await api.step({ keys: [], tapped: test.taps.includes(f) });
    const offset = all.calls.length;
    all.lastFrameFrom = offset;
    for (const c of r.calls)
      all.calls.push({
        ...c,
        id: c.id + offset,
        parent: c.parent === null ? null : c.parent + offset,
      });
    for (const e of r.events)
      all.events.push(e.t !== 'frame' && e.by !== undefined ? { ...e, by: e.by + offset } : e);
    if (r.callsTruncated === true) all.callsTruncated = true;
    all.vars = r.vars;
    if (r.error !== undefined) return { ...all, error: r.error };
    if (r.stoppedByLimit) return { ...all, stoppedByLimit: true };
  }
  return all;
}
