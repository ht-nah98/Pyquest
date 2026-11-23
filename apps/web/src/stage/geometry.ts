import type { StageSize } from '@pyquest/runtime';

/** Where the picture sits inside a box that shows it with object-fit: contain (centred, letterboxed). */
export type PictureRect = { left: number; top: number; width: number; height: number };

export function pictureRect(boxWidth: number, boxHeight: number, size: StageSize): PictureRect {
  const k = Math.min(boxWidth / size.width, boxHeight / size.height);
  const width = size.width * k;
  const height = size.height * k;
  return { left: (boxWidth - width) / 2, top: (boxHeight - height) / 2, width, height };
}

/** The canvas backing store: the displayed size × devicePixelRatio (never below the stage size). */
export function backingSize(
  boxWidth: number,
  boxHeight: number,
  dpr: number,
  size: StageSize,
): { width: number; height: number } {
  const k = Math.min(boxWidth / size.width, boxHeight / size.height);
  const scale = Math.max(1, k * (dpr || 1));
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

/**
 * A point in the box (pixels from its top-left) in stage units, rounded; null outside the picture
 * (in the letterbox bars).
 */
export function toStagePoint(
  px: number,
  py: number,
  boxWidth: number,
  boxHeight: number,
  size: StageSize,
): { x: number; y: number } | null {
  const pic = pictureRect(boxWidth, boxHeight, size);
  if (pic.width <= 0 || pic.height <= 0) return null;
  const x = ((px - pic.left) / pic.width) * size.width;
  const y = ((py - pic.top) / pic.height) * size.height;
  if (x < 0 || y < 0 || x > size.width || y > size.height) return null;
  return {
    x: Math.min(size.width, Math.max(0, Math.round(x))),
    y: Math.min(size.height, Math.max(0, Math.round(y))),
  };
}
