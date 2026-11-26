import { type Grid, likeness as likenessOf } from '@pyquest/checker';

/**
 * 📐 Vẽ theo mẫu: how much a drawing looks like its template, 0–100 (spec 2026-11-26 §5.2). Not grading,
 * only for the child to see. The comparison is the checker's (one for lessons and studio); here a cell is a
 * canvas pixel and colours match when their RGB is close.
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

/** How different two colours may be (RGB distance) and still count as the same. */
const CLOSE = 80;

type Rgb = readonly [number, number, number];

const close = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < CLOSE;

/** The canvas picture as the checker's grid: a cell per pixel, null where nothing was drawn. */
function gridOf(p: Picture): Grid<Rgb> {
  const cells: (Rgb | null)[] = [];
  for (let i = 0; i < p.size * p.size; i++)
    cells.push(
      (p.ink[i * 4 + 3] ?? 0) > 0
        ? [p.ink[i * 4] ?? 0, p.ink[i * 4 + 1] ?? 0, p.ink[i * 4 + 2] ?? 0]
        : null,
    );
  return { w: p.size, h: p.size, cells, sky: [p.sky[0], p.sky[1], p.sky[2]] };
}

/** 0–100: shapes in the same place and colour count 85, the same sky colour 15 (the checker's likeness). */
export function likeness(mine: Picture, model: Picture): number {
  return likenessOf(gridOf(mine), gridOf(model), close);
}
