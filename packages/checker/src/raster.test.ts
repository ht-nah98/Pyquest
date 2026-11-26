import type { DrawEvent } from '@pyquest/runtime';
import { describe, expect, test } from 'vitest';
import { likeness } from './likeness';
import { CELL, rasterize, STAGE_SKY } from './raster';

const STAGE = { width: 400, height: 600 };
/** The colour of the cell whose centre is nearest (x, y) on the stage. */
const at = (events: DrawEvent[], x: number, y: number, sprites = {}) => {
  const g = rasterize(events, STAGE, sprites);
  return g.cells[Math.floor(y / CELL) * g.w + Math.floor(x / CELL)];
};
const inked = (events: DrawEvent[], sprites = {}) =>
  rasterize(events, STAGE, sprites).cells.filter((c) => c !== null).length;

describe('rasterize: the last picture of a run as a grid of 4 × 4 px cells', () => {
  test('the grid covers the stage; with no clear() the sky is the stage colour', () => {
    const g = rasterize([], STAGE);
    expect([g.w, g.h, g.cells.length, g.sky]).toEqual([100, 150, 15000, STAGE_SKY]);
  });

  test('a filled box paints the cells inside it, colour names compared in lower case', () => {
    const box: DrawEvent = { t: 'rect', x: 40, y: 40, w: 40, h: 20, color: 'Red' };
    expect(at([box], 50, 50)).toBe('red');
    expect(at([box], 90, 50)).toBeNull();
    expect(inked([box])).toBe(10 * 5);
  });

  test('a hollow box (color=None) paints only its outline', () => {
    const box: DrawEvent = {
      t: 'rect',
      x: 40,
      y: 40,
      w: 80,
      h: 80,
      color: 'none',
      border: 'black',
    };
    expect(at([box], 41, 80)).toBe('black');
    expect(at([box], 80, 80)).toBeNull();
  });

  test('circle, ellipse, polygon, line and arc paint where they are drawn', () => {
    expect(at([{ t: 'circle', x: 200, y: 200, r: 30, color: 'gold' }], 210, 210)).toBe('gold');
    expect(at([{ t: 'circle', x: 200, y: 200, r: 30, color: 'gold' }], 225, 225)).toBeNull();
    expect(at([{ t: 'ellipse', x: 200, y: 200, w: 100, h: 20, color: 'pink' }], 245, 200)).toBe(
      'pink',
    );
    const tri: DrawEvent = {
      t: 'polygon',
      points: [
        [100, 400],
        [200, 300],
        [300, 400],
      ],
      color: 'purple',
    };
    expect(at([tri], 200, 390)).toBe('purple');
    expect(at([tri], 110, 310)).toBeNull();
    const line: DrawEvent = {
      t: 'line',
      x1: 0,
      y1: 100,
      x2: 400,
      y2: 100,
      color: 'black',
      width: 2,
    };
    expect(at([line], 200, 101)).toBe('black');
    // An arc from 0° to 180° is the lower half (y grows downwards), like the canvas.
    const smile: DrawEvent = {
      t: 'arc',
      x: 200,
      y: 200,
      r: 40,
      start: 0,
      end: 180,
      color: 'black',
      width: 3,
    };
    expect(at([smile], 200, 240)).toBe('black');
    expect(at([smile], 200, 160)).toBeNull();
  });

  test('a shape smaller than a cell still paints one cell', () => {
    expect(inked([{ t: 'rect', x: 101, y: 101, w: 1, h: 1, color: 'red' }])).toBe(1);
  });

  test('a picture is a box of its size × scale, named by picture, frame and mirror', () => {
    const bird: DrawEvent = { t: 'sprite', sprite: 'bird', x: 0, y: 0, frame: 0, scale: 2 };
    const sizes = { bird: { width: 20, height: 12 } };
    expect(inked([bird], sizes)).toBe(10 * 6);
    expect(at([bird], 1, 1, sizes)).toBe('sprite bird 0');
    expect(at([{ ...bird, mirror: true }], 1, 1, sizes)).toBe('sprite bird 0 mirror');
  });

  test('a picture of unknown size still counts, as a 24 × 24 box', () => {
    expect(inked([{ t: 'sprite', sprite: 'x', x: 0, y: 0, frame: 0 }])).toBe(6 * 6);
  });

  test('words are a box around their centre', () => {
    const words: DrawEvent = { t: 'text', text: 'HI', x: 200, y: 200, size: 40, color: 'white' };
    expect(at([words], 200, 200)).toBe('white');
    expect(at([words], 200, 260)).toBeNull();
  });

  test('clear() wipes what came before and sets the sky; only the last frame counts', () => {
    const box: DrawEvent = { t: 'rect', x: 0, y: 0, w: 40, h: 40, color: 'red' };
    expect(rasterize([box, { t: 'clear', color: 'Navy' }], STAGE).sky).toBe('navy');
    expect(inked([box, { t: 'clear', color: 'navy' }])).toBe(0);
    expect(inked([box, { t: 'frame' }, { t: 'clear', color: 'navy' }])).toBe(0);
  });
});

describe('likeness: two grids, 0–100', () => {
  const same = (a: string, b: string) => a === b;
  const grid = (events: DrawEvent[]) => rasterize(events, STAGE);
  const box = (x: number, color = 'red'): DrawEvent => ({
    t: 'rect',
    x,
    y: 100,
    w: 40,
    h: 40,
    color,
  });

  test('the same picture is 100; nothing drawn on either side is 100', () => {
    expect(likeness(grid([box(100)]), grid([box(100)]), same)).toBe(100);
    expect(likeness(grid([]), grid([]), same)).toBe(100);
  });

  test('a few pixels off still matches; far off or another colour does not', () => {
    expect(likeness(grid([box(106)]), grid([box(100)]), same)).toBe(100);
    expect(likeness(grid([box(200)]), grid([box(100)]), same)).toBe(15);
    expect(likeness(grid([box(100, 'blue')]), grid([box(100)]), same)).toBe(15);
  });

  test('another sky colour loses its 15 points', () => {
    const sky: DrawEvent = { t: 'clear', color: 'skyblue' };
    expect(likeness(grid([sky, box(100)]), grid([box(100)]), same)).toBe(85);
  });
});
