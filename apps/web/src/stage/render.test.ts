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

/** Draws one shape and lists what the canvas was told: paths, fills and outlines with their colours. */
function shape(e: DrawEvent) {
  const calls: string[] = [];
  const n = (xs: number[]) => xs.map((v) => String(Math.round(v * 1000) / 1000)).join(' ');
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    beginPath: () => undefined,
    closePath: () => undefined,
    moveTo: (...xs: number[]) => calls.push(`moveTo ${n(xs)}`),
    lineTo: (...xs: number[]) => calls.push(`lineTo ${n(xs)}`),
    arc: (...xs: number[]) => calls.push(`arc ${n(xs)}`),
    ellipse: (...xs: number[]) => calls.push(`ellipse ${n(xs)}`),
    rect: (...xs: number[]) => calls.push(`rect ${n(xs)}`),
    fill: () => calls.push(`fill ${ctx.fillStyle}`),
    stroke: () => calls.push(`stroke ${ctx.strokeStyle} ${String(ctx.lineWidth)} ${ctx.lineCap}`),
  };
  drawEvent(ctx as unknown as CanvasRenderingContext2D, e, { width: 600, height: 600 });
  return calls;
}

test('an ellipse is drawn around its centre, half its width and height each way', () => {
  expect(shape({ t: 'ellipse', x: 300, y: 200, w: 80, h: 40, color: 'pink' })).toEqual([
    'ellipse 300 200 40 20 0 0 6.283',
    'fill pink',
  ]);
});

test('an arc goes clockwise from start to end in degrees, as a round-ended line', () => {
  expect(
    shape({ t: 'arc', x: 300, y: 300, r: 15, start: 0, end: 180, color: 'black', width: 3 }),
  ).toEqual(['arc 300 300 15 0 3.142', 'stroke black 3 round']);
});

test('border adds an outline 3 thick; color none leaves the inside empty', () => {
  expect(shape({ t: 'circle', x: 1, y: 2, r: 3, color: 'red', border: 'black' })).toEqual([
    'arc 1 2 3 0 6.283',
    'fill red',
    'stroke black 3 round',
  ]);
  expect(shape({ t: 'rect', x: 0, y: 0, w: 5, h: 6, color: 'none', border: 'navy' })).toEqual([
    'rect 0 0 5 6',
    'stroke navy 3 round',
  ]);
  expect(
    shape({
      t: 'polygon',
      points: [
        [0, 0],
        [4, 0],
        [0, 4],
      ],
      color: 'teal',
      border: 'white',
    }),
  ).toEqual(['moveTo 0 0', 'lineTo 4 0', 'lineTo 0 4', 'fill teal', 'stroke white 3 round']);
  expect(shape({ t: 'ellipse', x: 0, y: 0, w: 2, h: 2, color: 'none', border: 'gold' })).toEqual([
    'ellipse 0 0 1 1 0 0 6.283',
    'stroke gold 3 round',
  ]);
});
