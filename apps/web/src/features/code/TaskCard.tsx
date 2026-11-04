import type { Goal } from '@pyquest/content-schema';
import type { GoalResult } from '@pyquest/checker';
import { useState } from 'react';
import { GoalList } from './RunPanel';

/** What to do on this screen: the code step's brief, the goals (✅/⬜) and 💡 hints one at a time. */
export function TaskCard({
  title,
  text,
  goals,
  results,
  hints,
}: {
  title: string | undefined;
  text: string | undefined;
  goals: readonly Goal[];
  results: readonly GoalResult[];
  hints: readonly string[];
}) {
  const [shown, setShown] = useState(0);
  return (
    <section
      className="flex max-h-[45%] min-h-0 flex-col gap-2 overflow-y-auto rounded-[12px] border-2 border-ink bg-paper p-3 max-[1279px]:max-h-full max-[1279px]:w-80"
      data-testid="task-card"
    >
      <h2 className="font-display text-lg text-brand-deep">🎯 {title ?? 'Nhiệm vụ'}</h2>
      {text !== undefined && <p className="text-[15px] leading-snug">{text}</p>}
      <GoalList goals={goals} results={results} />
      {hints.slice(0, shown).map((h, i) => (
        <p key={h} className="rounded-[8px] bg-sun/40 px-2 py-1 text-[15px]" data-testid="hint">
          💡 {i + 1}. {h}
        </p>
      ))}
      {shown < hints.length && (
        <button
          type="button"
          className="self-start rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold"
          onClick={() => {
            setShown((n) => n + 1);
          }}
          data-testid="hint-more"
        >
          💡 Gợi ý {shown === 0 ? '' : 'tiếp'} ({shown}/{hints.length})
        </button>
      )}
    </section>
  );
}
