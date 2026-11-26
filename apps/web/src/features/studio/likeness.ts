/**
 * 📐 Vẽ theo mẫu: how much a drawing looks like its template, 0–100 (spec 2026-11-26 §5.2). Not grading,
 * only for the child to see. Forgiving on purpose: a shape a few pixels off or a slightly different shade still
 * counts, so a child who traced well never sees a discouraging number.
 */

/** Both pictures are compared on a LIKENESS_SIZE × LIKENESS_SIZE grid. */
export const LIKENESS_SIZE = 100;

/**
 * A drawing shrunk to size × size. `ink` is RGBA of everything drawn except the sky (transparent where nothing
 * was drawn); `sky` is the colour of its last clear().
 */
export type Picture = {
  ink: Uint8ClampedArray;
  sky: readonly [number, number, number];
  size: number;
};

/** How far a match may be, in cells, and how different two colours may be (RGB distance). */
const REACH = 2;
const CLOSE = 80;
/** Shapes weigh most; the sky colour is the rest. */
const INK_WEIGHT = 0.85;

const close = (a: readonly number[], b: readonly number[]) =>
  Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0)) <
  CLOSE;

const inkAt = (p: Picture, i: number) => (p.ink[i * 4 + 3] ?? 0) > 0;
const rgbAt = (p: Picture, i: number) => [
  p.ink[i * 4] ?? 0,
  p.ink[i * 4 + 1] ?? 0,
  p.ink[i * 4 + 2] ?? 0,
];

/** True when `other` has ink of a colour close to `from`'s pixel i, within REACH cells of it. */
function near(from: Picture, other: Picture, i: number): boolean {
  const n = from.size;
  const x = i % n;
  const y = Math.floor(i / n);
  const rgb = rgbAt(from, i);
  for (let dy = -REACH; dy <= REACH; dy++)
    for (let dx = -REACH; dx <= REACH; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      const j = ny * n + nx;
      if (inkAt(other, j) && close(rgb, rgbAt(other, j))) return true;
    }
  return false;
}

/** 0–100: shapes in the same place and colour count 85, the same sky colour 15. */
export function likeness(mine: Picture, model: Picture): number {
  const sky = close(mine.sky, model.sky) ? 1 : 0;
  let cells = 0;
  let matched = 0;
  for (let i = 0; i < model.size * model.size; i++) {
    const a = inkAt(mine, i);
    const b = inkAt(model, i);
    if (!a && !b) continue;
    cells++;
    if ((!a || near(mine, model, i)) && (!b || near(model, mine, i))) matched++;
  }
  const ink = cells === 0 ? 1 : matched / cells;
  return Math.round(100 * (INK_WEIGHT * ink + (1 - INK_WEIGHT) * sky));
}
