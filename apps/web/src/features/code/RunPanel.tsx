import type { Goal } from '@pyquest/content-schema';
import type { RunResult } from '@pyquest/runtime';
import type { GoalResult } from '@pyquest/checker';

/** How Python itself would print the value: True/False, text in quotes. */
export function pythonRepr(v: number | string | boolean): string {
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  return typeof v === 'string' ? `"${v}"` : String(v);
}

/** Variable values from the last run: what replaces a log (spec §1). */
export function VarWatch({ result }: { result: RunResult | null }) {
  const vars = Object.entries(result?.vars ?? {});
  if (vars.length === 0) return null;
  return (
    <div className="rounded-[8px] bg-paper-2 px-2 py-1 font-code text-sm" data-testid="var-watch">
      {vars.map(([k, v]) => (
        <span key={k} className="mr-3 inline-block">
          {k} = <b>{pythonRepr(v)}</b>
        </span>
      ))}
    </div>
  );
}

export function GoalList({
  goals,
  results,
}: {
  goals: readonly Goal[];
  results: readonly GoalResult[];
}) {
  return (
    <ul className="flex flex-col gap-1 text-[15px]" data-testid="goals">
      {goals.map((g) => {
        const ok = results.find((r) => r.id === g.id)?.ok === true;
        return (
          <li key={g.id} data-ok={ok} data-testid={`goal-${g.id}`}>
            {ok ? '✅' : '⬜'} {g.label}
          </li>
        );
      })}
    </ul>
  );
}

export function ErrorBubble({ result }: { result: RunResult | null }) {
  if (result?.error === undefined) {
    if (result?.stoppedByLimit === true) {
      return (
        <p
          className="rounded-[8px] border-2 border-oops bg-oops-soft px-3 py-2"
          data-testid="run-error"
        >
          ⏹ Chương trình chạy mãi không dừng, mình đã dừng giúp em.
        </p>
      );
    }
    return null;
  }
  return (
    <p
      className="rounded-[8px] border-2 border-oops bg-oops-soft px-3 py-2"
      data-testid="run-error"
    >
      ⚠️ {result.error.messageVi}
    </p>
  );
}
