import type { DrawEvent } from '@pyquest/runtime';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@pyquest/runtime';
import { catalog } from '../content/catalog';

const images = new Map<string, HTMLImageElement>();

/** Loads every library picture once; resolves when all are decoded (so the first frame is complete). */
export function preloadSprites(): Promise<void> {
  return Promise.all(
    catalog.assets().map(
      (a) =>
        new Promise<void>((resolve) => {
          const url = catalog.assetUrl(a.id);
          if (url === undefined || images.has(a.id)) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => {
            resolve();
          };
          img.onerror = () => {
            resolve();
          };
          img.src = url;
          images.set(a.id, img);
        }),
    ),
  ).then(() => undefined);
}

export const DEFAULT_SKY = '#bfe3f2';

/** Clears the canvas to the empty stage (sky blue, like a fresh sheet). */
export function resetStage(ctx: CanvasRenderingContext2D): void {
  // The backing store matches the screen (Stage sizes it); draw in 400 × 600 stage units.
  const k = ctx.canvas.width / STAGE_WIDTH;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = DEFAULT_SKY;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
}

/** Draws one event in stage coordinates (400 × 600, y down). 'say' and 'frame' are not drawn here. */
export function drawEvent(ctx: CanvasRenderingContext2D, e: DrawEvent): void {
  switch (e.t) {
    case 'clear':
      ctx.fillStyle = e.color;
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      return;
    case 'rect':
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      return;
    case 'text':
      ctx.font = `${String(e.size)}px VT323, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2, e.size / 10);
      ctx.strokeStyle = '#1b2233';
      ctx.strokeText(e.text, e.x, e.y);
      ctx.fillStyle = e.color;
      ctx.fillText(e.text, e.x, e.y);
      return;
    case 'sprite': {
      const id = e.asset ?? e.sprite;
      const asset = catalog.asset(id);
      const img = images.get(id);
      if (asset === undefined || img === undefined || !img.complete) {
        ctx.fillStyle = '#d9534f';
        ctx.fillRect(e.x, e.y, 24, 24);
        return;
      }
      const frame = ((e.frame % asset.frames) + asset.frames) % asset.frames;
      // The file may be stored larger than its game size (2× for sharp screens): read the source
      // frame from the real pixels, draw it at the game size.
      const sw = img.naturalWidth / asset.frames;
      const sh = img.naturalHeight;
      ctx.save();
      if (e.flip === true) {
        ctx.translate(e.x, e.y + asset.height);
        ctx.scale(1, -1);
        ctx.drawImage(img, frame * sw, 0, sw, sh, 0, 0, asset.width, asset.height);
      } else {
        ctx.drawImage(img, frame * sw, 0, sw, sh, e.x, e.y, asset.width, asset.height);
      }
      ctx.restore();
      return;
    }
    case 'say':
    case 'frame':
      return;
  }
}
