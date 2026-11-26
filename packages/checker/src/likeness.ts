/**
 * How much one picture looks like another, 0–100: the one comparison behind 📐 Vẽ theo mẫu and the 'matches'
 * goal (spec 2026-11-26 lesson-likeness §3). Forgiving on purpose: a shape a couple of cells off still counts.
 */

/** A picture as w × h cells, each a colour or null (nothing drawn), plus the sky colour. */
export type Grid<C> = { w: number; h: number; cells: readonly (C | null)[]; sky: C };

/** How far a match may be, in cells. */
const REACH = 2;
/** Shapes weigh most; the sky colour is the rest. */
const INK_WEIGHT = 0.85;

/** True when `other` has a cell of a colour `same` as `from`'s cell i, within REACH cells of it. */
function near<C>(from: Grid<C>, other: Grid<C>, i: number, same: (a: C, b: C) => boolean): boolean {
  const color = from.cells[i];
  if (color === null || color === undefined) return false;
  const x = i % from.w;
  const y = Math.floor(i / from.w);
  for (let dy = -REACH; dy <= REACH; dy++)
    for (let dx = -REACH; dx <= REACH; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= other.w || ny >= other.h) continue;
      const c = other.cells[ny * other.w + nx];
      if (c !== null && c !== undefined && same(color, c)) return true;
    }
  return false;
}

/**
 * 0–100: shapes in the same place and colour count 85, the same sky colour 15.
 * byColor: the colour's name, when colours are names (lessons). Each colour then counts the same, whatever its
 * area, so 8 small red dots weigh as much as the big grey box around them. Without it every cell counts the
 * same (studio, where colours are canvas pixels).
 */
export function likeness<C>(
  mine: Grid<C>,
  model: Grid<C>,
  same: (a: C, b: C) => boolean,
  byColor?: (c: C) => string,
): number {
  const sky = same(mine.sky, model.sky) ? 1 : 0;
  const tally = new Map<string, { cells: number; matched: number }>();
  const count = (key: string, ok: boolean) => {
    const t = tally.get(key) ?? { cells: 0, matched: 0 };
    t.cells++;
    if (ok) t.matched++;
    tally.set(key, t);
  };
  for (let i = 0; i < model.w * model.h; i++) {
    const a = mine.cells[i] ?? null;
    const b = model.cells[i] ?? null;
    if (a === null && b === null) continue;
    const okA = a === null || near(mine, model, i, same);
    const okB = b === null || near(model, mine, i, same);
    if (byColor === undefined) count('', okA && okB);
    else {
      if (a !== null) count(byColor(a), okA);
      if (b !== null && (a === null || byColor(a) !== byColor(b))) count(byColor(b), okB);
    }
  }
  const parts = [...tally.values()];
  const ink =
    parts.length === 0 ? 1 : parts.reduce((s, t) => s + t.matched / t.cells, 0) / parts.length;
  return Math.round(100 * (INK_WEIGHT * ink + (1 - INK_WEIGHT) * sky));
}
