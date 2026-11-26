import { describe, expect, test } from 'vitest';
import { LIKENESS_SIZE, likeness, type Picture } from './likeness';

type Rgb = [number, number, number];
const N = LIKENESS_SIZE;

/** A picture of filled boxes on a sky colour; box = [x, y, w, h, colour] in cells. */
function picture(
  boxes: [number, number, number, number, Rgb][],
  sky: Rgb = [135, 206, 235],
): Picture {
  const ink = new Uint8ClampedArray(N * N * 4);
  for (const [x, y, w, h, [r, g, b]] of boxes)
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        const k = (j * N + i) * 4;
        ink[k] = r;
        ink[k + 1] = g;
        ink[k + 2] = b;
        ink[k + 3] = 255;
      }
  return { ink, sky, size: N };
}

const RED: Rgb = [255, 0, 0];
const GOLD: Rgb = [255, 215, 0];
const house = picture([
  [20, 40, 40, 40, RED],
  [70, 10, 15, 15, GOLD],
]);

describe('likeness: how much a drawing looks like its template (0–100)', () => {
  test('the same picture is 100', () => {
    expect(likeness(house, house)).toBe(100);
  });

  test('nothing drawn is at most 15 (only the sky can match)', () => {
    expect(likeness(picture([]), house)).toBeLessThanOrEqual(15);
  });

  test('two empty pictures with the same sky are 100', () => {
    expect(likeness(picture([]), picture([]))).toBe(100);
  });

  test('moved 2 cells to the right still counts as a good tracing', () => {
    const moved = picture([
      [22, 40, 40, 40, RED],
      [72, 10, 15, 15, GOLD],
    ]);
    expect(likeness(moved, house)).toBeGreaterThanOrEqual(85);
  });

  test('a slightly different shade still counts', () => {
    const shade = picture([
      [20, 40, 40, 40, [235, 20, 20]],
      [70, 10, 15, 15, [235, 195, 20]],
    ]);
    expect(likeness(shade, house)).toBeGreaterThanOrEqual(85);
  });

  test('the right place in a totally different colour scores low', () => {
    const blue = picture([
      [20, 40, 40, 40, [0, 0, 255]],
      [70, 10, 15, 15, [0, 128, 0]],
    ]);
    expect(likeness(blue, house)).toBeLessThanOrEqual(30);
  });

  test('a big extra shape the template does not have lowers the score', () => {
    const extra = picture([
      [20, 40, 40, 40, RED],
      [70, 10, 15, 15, GOLD],
      [0, 85, 100, 15, [0, 128, 0]],
    ]);
    expect(likeness(extra, house)).toBeLessThan(70);
  });

  test('a different sky costs a little, not everything', () => {
    const night = picture(
      [
        [20, 40, 40, 40, RED],
        [70, 10, 15, 15, GOLD],
      ],
      [0, 0, 60],
    );
    expect(likeness(night, house)).toBe(85);
  });
});
