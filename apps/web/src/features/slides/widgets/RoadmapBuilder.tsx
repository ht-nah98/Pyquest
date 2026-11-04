import { useRef, useState } from 'react';

type Part = { id: string; label: string; icon?: string | undefined };

/** Fixed shuffle so every child starts from the same puzzle (no Math.random in content). */
function shuffled(parts: readonly Part[]): string[] {
  const ids = parts.map((p) => p.id);
  const out: string[] = [];
  for (let i = 0; i < ids.length; i++) out.push(ids[(i * 7 + 3) % ids.length] ?? '');
  return new Set(out).size === ids.length ? out : [...ids].reverse();
}

/**
 * The child orders the game's parts into a build plan. Drag with mouse or finger (pointer events, so it
 * works on iPad), or use ↑ ↓. The order is saved in the lesson state.
 */
export function RoadmapBuilder({
  parts,
  order,
  onChange,
}: {
  parts: readonly Part[];
  order: string[] | undefined;
  onChange: (order: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>(() => order ?? shuffled(parts));
  const [dragging, setDragging] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const byId = new Map(parts.map((p) => [p.id, p]));

  const commit = (next: string[]) => {
    setIds(next);
    onChange(next);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    commit(next);
  };

  const indexAt = (clientY: number): number => {
    const items = [...(list.current?.children ?? [])];
    const i = items.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return clientY < r.top + r.height / 2;
    });
    return i === -1 ? items.length - 1 : i;
  };

  return (
    <ol
      ref={list}
      className="mx-auto flex w-full max-w-md flex-col gap-1.5 self-center"
      data-testid="roadmap-builder"
    >
      {ids.map((id, i) => {
        const p = byId.get(id);
        if (p === undefined) return null;
        return (
          <li
            key={id}
            data-id={id}
            className={`flex touch-none select-none items-center gap-2 rounded-[10px] border-2 border-ink bg-white px-3 py-1 ${dragging === id ? 'opacity-60' : ''}`}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              setDragging(id);
            }}
            onPointerMove={(e) => {
              if (dragging !== id) return;
              const to = indexAt(e.clientY);
              if (to !== i) move(i, to);
            }}
            onPointerUp={() => {
              setDragging(null);
            }}
            onPointerCancel={() => {
              setDragging(null);
            }}
          >
            <span className="font-pixel text-2xl text-brand">{i + 1}</span>
            <span className="flex-1 cursor-grab">
              {p.icon} {p.label}
            </span>
            <button
              type="button"
              aria-label="Lên"
              className="size-9 rounded border border-ink"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={() => {
                move(i, i - 1);
              }}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Xuống"
              className="size-9 rounded border border-ink"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={() => {
                move(i, i + 1);
              }}
            >
              ↓
            </button>
          </li>
        );
      })}
    </ol>
  );
}
