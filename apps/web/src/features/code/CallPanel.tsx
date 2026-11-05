import type { Call, DrawEvent, RunResult } from '@pyquest/runtime';
import { pythonRepr } from './RunPanel';

const LEAVES_SHOWN = 8;

/** A drawing order written back as the library call that made it, with the numbers already worked out. */
export function eventAsCall(e: DrawEvent): string | null {
  const n = (v: number) => String(v);
  switch (e.t) {
    case 'rect':
      return `draw_rect(${n(e.x)}, ${n(e.y)}, ${n(e.w)}, ${n(e.h)}, "${e.color}")`;
    case 'sprite':
      return `draw_image("images/${e.sprite}.png", ${n(e.x)}, ${n(e.y)}${e.flip === true ? ', flip=True' : ''})`;
    case 'text':
      return `draw_text("${e.text}", ${n(e.x)}, ${n(e.y)})`;
    case 'clear':
      return `clear("${e.color}")`;
    case 'say':
      return `print("${e.text}")`;
    case 'sound':
      return `play_sound("${e.name}")`;
    case 'music':
      return e.name === null ? 'stop_music()' : `play_music("${e.name}")`;
    case 'frame':
      return null;
  }
}

/** A call and every call made inside it: what lights up on the stage when it is picked. */
export function familyOf(calls: readonly Call[], root: number): Set<number> {
  const ids = new Set([root]);
  for (const c of calls) if (c.parent !== null && ids.has(c.parent)) ids.add(c.id);
  return ids;
}

/**
 * 📞 Cuộc gọi: the child's own functions as a tree, each with the numbers it received and the library
 * calls it made. Picking a line lights up what that call drew. Game mode shows the last frame only
 * (calls from `from` on).
 */
export function CallPanel({
  result,
  from,
  picked,
  onPick,
}: {
  result: RunResult | null;
  from: number;
  picked: number | null;
  onPick: (call: Call | null) => void;
}) {
  const calls = (result?.calls ?? []).filter((c) => c.id >= from);
  if (calls.length === 0) {
    return (
      <p className="text-[15px] text-ink-soft" data-testid="calls-empty">
        Chưa có lời gọi nào. Khi em tự đặt lệnh bằng <code>def</code> rồi gọi nó, mỗi lần gọi sẽ
        hiện ở đây, kèm những số nó nhận được.
      </p>
    );
  }
  const drawn = new Map<number, DrawEvent[]>();
  for (const e of result?.events ?? []) {
    if (e.t === 'frame' || e.by === undefined || e.by < from) continue;
    drawn.set(e.by, [...(drawn.get(e.by) ?? []), e]);
  }
  const kids = (parent: number | null) => calls.filter((c) => c.parent === parent);

  const node = (c: Call) => {
    const args = Object.entries(c.args)
      .map(([k, v]) => `${k}=${pythonRepr(v)}`)
      .join(', ');
    const leaves = (drawn.get(c.id) ?? []).map(eventAsCall).filter((x) => x !== null);
    const on = picked === c.id;
    return (
      <li key={c.id}>
        <button
          type="button"
          className={`w-full rounded-[6px] px-1 text-left font-code text-sm ${on ? 'bg-sun' : 'hover:bg-brand-soft'}`}
          onClick={() => {
            onPick(on ? null : c);
          }}
          data-testid="call-row"
          data-call={c.id}
        >
          📞 <b>{c.name}</b>({args})
          {c.line !== null && <span className="ml-2 text-xs text-ink-soft">dòng {c.line}</span>}
        </button>
        <ul className="ml-3 border-l-2 border-ink/15 pl-2">
          {leaves.slice(0, LEAVES_SHOWN).map((l, i) => (
            <li
              key={`${String(i)}-${l}`}
              className="font-code text-[13px] text-ink-soft"
              data-testid="call-leaf"
            >
              {l}
            </li>
          ))}
          {leaves.length > LEAVES_SHOWN && (
            <li className="text-[13px] text-ink-soft">
              … và {leaves.length - LEAVES_SHOWN} lệnh vẽ nữa
            </li>
          )}
          {kids(c.id).map(node)}
        </ul>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-1" data-testid="call-panel">
      <p className="text-sm text-ink-soft">
        Bấm một lời gọi để xem nó vẽ phần nào trên sân.
        {result?.callsTruncated === true && ' (Chỉ hiện 300 lời gọi đầu.)'}
      </p>
      <ul className="flex flex-col gap-1">{kids(null).map(node)}</ul>
    </div>
  );
}
