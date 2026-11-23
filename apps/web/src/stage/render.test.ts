import type { DrawEvent } from '@pyquest/runtime';
import { beforeAll, expect, test, vi } from 'vitest';

vi.mock('../content/catalog', () => {
  const assets = [
    { id: 'smooth', width: 10, height: 20, frames: 2 },
    { id: 'crisp', width: 10, height: 20, frames: 2, pixel: true },
  ];
  return {
    catalog: {
      assets: () => assets,
      asset: (id: string) => assets.find((a) => a.id === id),
      assetUrl: (id: string) => `${id}.png`,
    },
  };
});
const { drawEvent, preloadSprites } = await import('./render');

/** A 2 × picture of two frames, loaded at once. */
class FakeImage {
  complete = true;
  naturalWidth = 40;
  naturalHeight = 40;
  onload: () => void = () => undefined;
  set src(_: string) {
    this.onload();
  }
}

beforeAll(async () => {
  vi.stubGlobal('Image', FakeImage);
  await preloadSprites();
  vi.unstubAllGlobals();
});

/** Draws one sprite and says what the canvas was told, with the smoothing in force at the time. */
function drawn(e: Partial<Extract<DrawEvent, { t: 'sprite' }>>) {
  const calls: string[] = [];
  const saved: boolean[] = [];
  const ctx = {
    imageSmoothingEnabled: true,
    save: () => saved.push(ctx.imageSmoothingEnabled),
    restore: () => {
      ctx.imageSmoothingEnabled = saved.pop() ?? false;
    },
    translate: (x: number, y: number) => calls.push(`translate ${String(x)} ${String(y)}`),
    scale: (x: number, y: number) => calls.push(`scale ${String(x)} ${String(y)}`),
    drawImage: (_: unknown, ...n: number[]) =>
      calls.push(`${ctx.imageSmoothingEnabled ? 'smooth' : 'crisp'} ${n.join(' ')}`),
  };
  drawEvent(
    ctx as unknown as CanvasRenderingContext2D,
    { t: 'sprite', sprite: 'smooth', x: 100, y: 200, frame: 1, ...e },
    { width: 400, height: 600 },
  );
  expect(ctx.imageSmoothingEnabled).toBe(true);
  return calls;
}

test('a plain or flipped picture is drawn as before', () => {
  expect(drawn({})).toEqual(['smooth 20 0 20 40 100 200 10 20']);
  expect(drawn({ flip: true })).toEqual([
    'translate 100 220',
    'scale 1 -1',
    'smooth 20 0 20 40 0 0 10 20',
  ]);
});

test('scale keeps the top-left corner; mirror and flip turn the picture inside its own box', () => {
  expect(drawn({ scale: 3 })).toEqual(['smooth 20 0 20 40 100 200 30 60']);
  expect(drawn({ mirror: true, scale: 2 })).toEqual([
    'translate 120 200',
    'scale -1 1',
    'smooth 20 0 20 40 0 0 20 40',
  ]);
  expect(drawn({ mirror: true, flip: true })).toEqual([
    'translate 110 220',
    'scale -1 -1',
    'smooth 20 0 20 40 0 0 10 20',
  ]);
});

test('a pixel picture is drawn without smoothing, and only that one', () => {
  expect(drawn({ sprite: 'crisp' })).toEqual(['crisp 20 0 20 40 100 200 10 20']);
  expect(drawn({})).toEqual(['smooth 20 0 20 40 100 200 10 20']);
});
