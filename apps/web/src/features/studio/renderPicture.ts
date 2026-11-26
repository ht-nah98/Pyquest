import type { DrawEvent, StageSize } from '@pyquest/runtime';
import { DEFAULT_SKY, drawEvent } from '../../stage/render';
import { LIKENESS_SIZE, type Picture } from './likeness';

/** The RGB of a CSS colour, as the browser paints it. */
function rgbOf(color: string): [number, number, number] {
  const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (c === null) return [0, 0, 0];
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
}

/**
 * A run's picture shrunk to size × size for likeness(): the shapes on a transparent canvas (clear() wipes them,
 * as on the stage, and gives the sky its colour). Pictures must already be loaded (preloadSprites).
 */
export function renderPicture(
  events: readonly DrawEvent[],
  stage: StageSize,
  size = LIKENESS_SIZE,
): Picture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  let sky = DEFAULT_SKY;
  if (c === null) return { ink: new Uint8ClampedArray(size * size * 4), sky: rgbOf(sky), size };
  c.setTransform(size / stage.width, 0, 0, size / stage.height, 0, 0);
  for (const e of events) {
    if (e.t === 'clear') {
      sky = e.color;
      c.clearRect(0, 0, stage.width, stage.height);
    } else drawEvent(c, e, stage);
  }
  return { ink: c.getImageData(0, 0, size, size).data, sky: rgbOf(sky), size };
}
