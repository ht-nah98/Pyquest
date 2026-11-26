import type { DrawEvent, StageSize } from '@pyquest/runtime';
import type { Grid } from './likeness';

/** One cell is CELL × CELL stage pixels: a 400 × 600 stage is 100 × 150 cells. */
export const CELL = 4;
/** The empty stage's colour (DEFAULT_SKY of apps/web/src/stage/render.ts). */
export const STAGE_SKY = '#bfe3f2';
/** The size of a picture the page could not load: the stage draws a 24 × 24 red box. */
const UNKNOWN = { width: 24, height: 24 };
/** color=None: only the outline (ADR 0013); border= is 3 px thick. */
const NONE = 'none';
const BORDER_WIDTH = 3;

/** Picture sizes on the stage at scale 1, by picture id (the library's manifest). */
export type SpriteSizes = Readonly<Record<string, { width: number; height: number }>>;

type Inside = (px: number, py: number) => boolean;
type Box = readonly [number, number, number, number];

const colorOf = (c: string) => c.trim().toLowerCase();

/** Distance from (px, py) to the segment (ax, ay)–(bx, by). */
function toSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** A stroke reaches at least ¾ of a cell each side: a band wider than a cell, so thin lines have no gaps. */
const reach = (width: number) => Math.max(width / 2, (CELL * 3) / 4);

function pointInPolygon(px: number, py: number, pts: readonly (readonly [number, number])[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i] ?? [0, 0];
    const [xj, yj] = pts[j] ?? [0, 0];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The angle of (dx, dy) in degrees, 0–360, clockwise on screen (y grows downwards) like canvas arc(). */
const degrees = (dx: number, dy: number) => ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

/**
 * The last picture of a run on a grid of CELL × CELL cells (spec 2026-11-26 lesson-likeness §3): a cell takes
 * the colour of the last shape covering its centre; pictures from the library are boxes named by picture,
 * frame and mirror. Pure, no canvas: content:check grades with it on Node.
 */
export function rasterize(
  events: readonly DrawEvent[],
  stage: StageSize,
  sprites: SpriteSizes = {},
): Grid<string> {
  const w = Math.ceil(stage.width / CELL);
  const h = Math.ceil(stage.height / CELL);
  let cells: (string | null)[] = new Array<string | null>(w * h).fill(null);
  let sky = STAGE_SKY;

  /** Paints the cells inside `box` whose centre is inside; a shape covering no centre paints its middle. */
  const paint = (color: string, box: Box, inside: Inside) => {
    const [x0, y0, x1, y1] = box;
    let hit = false;
    const cx0 = Math.max(0, Math.floor(x0 / CELL));
    const cy0 = Math.max(0, Math.floor(y0 / CELL));
    const cx1 = Math.min(w - 1, Math.floor(x1 / CELL));
    const cy1 = Math.min(h - 1, Math.floor(y1 / CELL));
    for (let cy = cy0; cy <= cy1; cy++)
      for (let cx = cx0; cx <= cx1; cx++) {
        if (!inside((cx + 0.5) * CELL, (cy + 0.5) * CELL)) continue;
        cells[cy * w + cx] = color;
        hit = true;
      }
    if (hit) return;
    const mx = Math.floor((x0 + x1) / 2 / CELL);
    const my = Math.floor((y0 + y1) / 2 / CELL);
    if (mx >= 0 && my >= 0 && mx < w && my < h) cells[my * w + mx] = color;
  };

  /** Fill (unless color=None), then the outline of width BORDER_WIDTH when the shape has a border. */
  const shape = (
    e: { color: string; border?: string },
    box: Box,
    inside: Inside,
    edge: (px: number, py: number) => number,
  ) => {
    if (colorOf(e.color) !== NONE) paint(colorOf(e.color), box, inside);
    if (e.border === undefined) return;
    const r = reach(BORDER_WIDTH);
    const [x0, y0, x1, y1] = box;
    paint(colorOf(e.border), [x0 - r, y0 - r, x1 + r, y1 + r], (px, py) => edge(px, py) <= r);
  };

  const frames: DrawEvent[][] = [[]];
  for (const e of events) {
    if (e.t === 'frame') frames.push([]);
    else frames[frames.length - 1]?.push(e);
  }
  // A game's last frame may be empty when the run ends on a 'frame'; use the last one that drew.
  const last = [...frames].reverse().find((f) => f.length > 0) ?? [];

  for (const e of last) {
    switch (e.t) {
      case 'clear':
        cells = new Array<string | null>(w * h).fill(null);
        sky = colorOf(e.color);
        break;
      case 'rect': {
        const x0 = Math.min(e.x, e.x + e.w);
        const y0 = Math.min(e.y, e.y + e.h);
        const x1 = Math.max(e.x, e.x + e.w);
        const y1 = Math.max(e.y, e.y + e.h);
        shape(
          e,
          [x0, y0, x1, y1],
          (px, py) => px >= x0 && px < x1 && py >= y0 && py < y1,
          (px, py) => {
            const ox = Math.max(x0 - px, 0, px - x1);
            const oy = Math.max(y0 - py, 0, py - y1);
            if (ox > 0 || oy > 0) return Math.hypot(ox, oy);
            return Math.min(px - x0, x1 - px, py - y0, y1 - py);
          },
        );
        break;
      }
      case 'circle': {
        const r = Math.max(0, e.r);
        const d = (px: number, py: number) => Math.hypot(px - e.x, py - e.y);
        shape(
          e,
          [e.x - r, e.y - r, e.x + r, e.y + r],
          (px, py) => d(px, py) <= r,
          (px, py) => Math.abs(d(px, py) - r),
        );
        break;
      }
      case 'ellipse': {
        const a = Math.max(0, e.w) / 2;
        const b = Math.max(0, e.h) / 2;
        const k = (px: number, py: number) =>
          a === 0 || b === 0 ? Infinity : Math.hypot((px - e.x) / a, (py - e.y) / b);
        shape(
          e,
          [e.x - a, e.y - b, e.x + a, e.y + b],
          (px, py) => k(px, py) <= 1,
          (px, py) => Math.abs(k(px, py) - 1) * Math.min(a, b),
        );
        break;
      }
      case 'polygon': {
        const pts = e.points;
        if (pts.length === 0) break;
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        shape(
          e,
          [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
          (px, py) => pointInPolygon(px, py, pts),
          (px, py) =>
            Math.min(
              ...pts.map((p, i) => {
                const q = pts[(i + 1) % pts.length] ?? p;
                return toSegment(px, py, p[0], p[1], q[0], q[1]);
              }),
            ),
        );
        break;
      }
      case 'line': {
        const r = reach(e.width);
        paint(
          colorOf(e.color),
          [
            Math.min(e.x1, e.x2) - r,
            Math.min(e.y1, e.y2) - r,
            Math.max(e.x1, e.x2) + r,
            Math.max(e.y1, e.y2) + r,
          ],
          (px, py) => toSegment(px, py, e.x1, e.y1, e.x2, e.y2) <= r,
        );
        break;
      }
      case 'arc': {
        const r = Math.max(0, e.r);
        const half = reach(e.width);
        const sweep = e.end - e.start;
        const span = sweep >= 360 ? 360 : ((sweep % 360) + 360) % 360;
        paint(
          colorOf(e.color),
          [e.x - r - half, e.y - r - half, e.x + r + half, e.y + r + half],
          (px, py) =>
            Math.abs(Math.hypot(px - e.x, py - e.y) - r) <= half &&
            (span === 360 || (((degrees(px - e.x, py - e.y) - e.start) % 360) + 360) % 360 <= span),
        );
        break;
      }
      case 'text': {
        // VT323 letters are about half as wide as they are tall; the stage centres the words on (x, y).
        const tw = Math.max(1, e.text.length) * e.size * 0.5;
        const box: Box = [e.x - tw / 2, e.y - e.size / 2, e.x + tw / 2, e.y + e.size / 2];
        paint(
          colorOf(e.color),
          box,
          (px, py) => px >= box[0] && px < box[2] && py >= box[1] && py < box[3],
        );
        break;
      }
      case 'sprite': {
        const size = sprites[e.sprite] ?? UNKNOWN;
        const k = e.scale ?? 1;
        const box: Box = [e.x, e.y, e.x + size.width * k, e.y + size.height * k];
        const name = `sprite ${e.sprite} ${String(e.frame)}${e.mirror === true ? ' mirror' : ''}${e.flip === true ? ' flip' : ''}`;
        paint(name, box, (px, py) => px >= box[0] && px < box[2] && py >= box[1] && py < box[3]);
        break;
      }
      default:
        break;
    }
  }
  return { w, h, cells, sky };
}
