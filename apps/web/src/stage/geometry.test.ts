import { describe, expect, test } from 'vitest';
import { backingSize, pictureRect, toStagePoint } from './geometry';

const TALL = { width: 400, height: 600 };
const SQUARE = { width: 600, height: 600 };

describe('stage geometry', () => {
  test('a tall stage in a wide box is centred with bars left and right', () => {
    expect(pictureRect(500, 300, TALL)).toEqual({ left: 150, top: 0, width: 200, height: 300 });
  });

  test('a square stage in a tall box is centred with bars above and below', () => {
    expect(pictureRect(300, 500, SQUARE)).toEqual({ left: 0, top: 100, width: 300, height: 300 });
  });

  test('the backing store keeps the stage aspect and follows the screen pixels', () => {
    expect(backingSize(200, 300, 2, TALL)).toEqual({ width: 400, height: 600 });
    expect(backingSize(600, 600, 2, SQUARE)).toEqual({ width: 1200, height: 1200 });
    expect(backingSize(100, 100, 1, SQUARE)).toEqual({ width: 600, height: 600 });
  });

  test('a pointer maps through the scaling and the letterbox to stage units', () => {
    // 400 × 600 shown at half size, 150 px bar on the left.
    expect(toStagePoint(150, 0, 500, 300, TALL)).toEqual({ x: 0, y: 0 });
    expect(toStagePoint(250, 150, 500, 300, TALL)).toEqual({ x: 200, y: 300 });
    expect(toStagePoint(350, 300, 500, 300, TALL)).toEqual({ x: 400, y: 600 });
    // Square stage shown at 300 px, 100 px bar on top.
    expect(toStagePoint(150, 250, 300, 500, SQUARE)).toEqual({ x: 300, y: 300 });
  });

  test('a pointer in the letterbox bars is not on the stage', () => {
    expect(toStagePoint(100, 150, 500, 300, TALL)).toBeNull();
    expect(toStagePoint(150, 50, 300, 500, SQUARE)).toBeNull();
  });
});
