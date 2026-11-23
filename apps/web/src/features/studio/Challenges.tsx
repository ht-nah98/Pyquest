import type { StudioChallenge } from '@pyquest/content-schema';
import { useState } from 'react';

/** 💡 Thử thách: ideas to try in the studio. Pick one to read it; the hint opens on demand. No grading. */
export function Challenges({ challenges }: { challenges: readonly StudioChallenge[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const picked = challenges.find((c) => c.id === open);
  if (challenges.length === 0) return null;
  return (
    <section
      className="flex max-h-[38%] min-h-0 shrink-0 flex-col gap-2 overflow-y-auto rounded-[12px] border-2 border-ink bg-paper p-2"
      data-testid="challenges"
    >
      <h3 className="font-display text-lg">💡 Thử thách</h3>
      {picked === undefined ? (
        <ul className="flex flex-wrap gap-1.5">
          {challenges.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="min-h-11 rounded-full border-2 border-ink/40 bg-white px-3 text-[15px] hover:bg-brand-soft"
                onClick={() => {
                  setOpen(c.id);
                  setHint(false);
                }}
                data-testid={`challenge-${c.id}`}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2" data-testid="challenge-open">
          <p className="font-display text-lg font-extrabold">{picked.title}</p>
          <p className="text-[15px]">{picked.task}</p>
          {hint ? (
            <p
              className="rounded-[8px] bg-sun/40 px-2 py-1 text-[15px]"
              data-testid="challenge-hint"
            >
              💡 {picked.hint}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {!hint && (
              <button
                type="button"
                className="min-h-11 rounded-full border-2 border-ink bg-sun px-3 text-[15px] font-bold"
                onClick={() => {
                  setHint(true);
                }}
                data-testid="challenge-show-hint"
              >
                Gợi ý
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-full border-2 border-ink bg-white px-3 text-[15px]"
              onClick={() => {
                setOpen(null);
              }}
              data-testid="challenge-back"
            >
              ← Thử thách khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
