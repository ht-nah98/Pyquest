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
      const asset = catalog.asset(e.sprite);
      const img = images.get(e.sprite);
      if (asset === undefined || img === undefined || !img.complete) {
        ctx.fillStyle = '#d9534f';
        ctx.fillRect(e.x, e.y, 24, 24);
        return;
      }
      const frame = ((e.frame % asset.frames) + asset.frames) % asset.frames;
      ctx.save();
      if (e.flip === true) {
        ctx.translate(e.x, e.y + asset.height);
        ctx.scale(1, -1);
        ctx.drawImage(
          img,
          frame * asset.width,
          0,
          asset.width,
          asset.height,
          0,
          0,
          asset.width,
          asset.height,
        );
      } else {
        ctx.drawImage(
          img,
          frame * asset.width,
          0,
          asset.width,
          asset.height,
          e.x,
          e.y,
          asset.width,
          asset.height,
        );
      }
      ctx.restore();
      return;
    }
    case 'say':
    case 'frame':
      return;
  }
}
