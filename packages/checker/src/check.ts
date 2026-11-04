import type { Goal } from '@pyquest/content-schema';
import type { RunResult } from '@pyquest/runtime';

export type GoalResult = { id: string; ok: boolean };

/** Pure: grades a finished run against a lesson's goals. Never runs Python itself. */
export function checkGoals(goals: readonly Goal[], result: RunResult): GoalResult[] {
  return goals.map((goal) => ({ id: goal.id, ok: meets(goal, result) }));
}

function meets(goal: Goal, r: RunResult): boolean {
  switch (goal.kind) {
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
          (goal.at === undefined ||
            (Math.abs(e.x - goal.at[0]) <= tolerance && Math.abs(e.y - goal.at[1]) <= tolerance)),
      );
    }
    case 'varEquals':
      return r.vars[goal.name] === goal.value;
  }
}
