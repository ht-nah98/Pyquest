import type { DrawEvent, StageSize } from '@pyquest/runtime';
import { DEFAULT_STAGE } from '@pyquest/runtime';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { backingSize, pictureRect, toStagePoint, type PictureRect } from './geometry';
import { drawEvent, preloadSprites, resetStage } from './render';
import { replayDelay } from './replayDelay';
import { currentMusic, hear, soundsPlayed, stopMusic } from './sound';

export type StageHandle = {
  /** Draw a whole frame (game mode): reset, then every event. */
  showFrame(events: readonly DrawEvent[]): void;
  /** Script mode: replay events one by one so the child sees the order things happen. */
  replay(events: readonly DrawEvent[], msPerEvent?: number): Promise<void>;
  clear(): void;
  /** A point on the page in stage units, or null outside the picture (game screens: mouse_x, mouse_y). */
  pointAt(clientX: number, clientY: number): { x: number; y: number } | null;
  /**
   * 📞 calls panel: keep the drawings made by these calls bright and fade the rest (null: all bright).
   * Ids are the call ids of the events on screen.
   */
  highlight(ids: ReadonlySet<number> | null): void;
  /** 👀 The picture to draw, faded over the stage so the child can compare (null: hide it). */
  ghost(events: readonly DrawEvent[] | null): void;
  /**
   * ⬇️ Tải tranh: what is drawn now, as a PNG data URL at the real stage size (one pixel per stage unit),
   * without the coordinates help, the 👀 picture or a 📞 fade. Null before anything was drawn.
   */
  picture(): string | null;
};

/** How strong the 👀 picture-to-draw is. */
const GHOST = 0.35;

/** How faded a drawing is when another call is picked in the 📞 calls panel. */
const FADED = 0.18;

/** One event, faded when the 📞 panel picked another call. The background (clear) never fades. */
function paintEvent(
  c: CanvasRenderingContext2D,
  e: DrawEvent,
  picked: ReadonlySet<number> | null,
  size: StageSize,
) {
  const dim =
    picked !== null &&
    e.t !== 'clear' &&
    e.t !== 'frame' &&
    (e.by === undefined || !picked.has(e.by));
  c.globalAlpha = dim ? FADED : 1;
  drawEvent(c, e, size);
  c.globalAlpha = 1;
}

function repaintAll(
  c: CanvasRenderingContext2D,
  events: readonly DrawEvent[],
  picked: ReadonlySet<number> | null,
  ghost: readonly DrawEvent[] | null,
  size: StageSize,
) {
  resetStage(c, size);
  for (const e of events) paintEvent(c, e, picked, size);
  if (ghost === null) return;
  // On top, faded, without its background: the child sees both pictures at once.
  c.globalAlpha = GHOST;
  for (const e of ghost) if (e.t !== 'clear') drawEvent(c, e, size);
  c.globalAlpha = 1;
}

export type StageProps = {
  className?: string;
  testId?: string;
  /** The course's stage in stage units; DEFAULT_STAGE (400 × 600) when absent. */
  size?: StageSize;
  /**
   * Coordinates help for coding screens: the size labels on the picture's corners and, under the
   * mouse or a finger, an "x · y" readout with faint crosshair lines. Off for playing (fullscreen, slides).
   */
  coords?: boolean;
};

/** A badge on the picture: small, pixel font, never catches the pointer. */
const BADGE =
  'pointer-events-none absolute rounded-[4px] px-1 font-pixel text-[17px] leading-[18px]';
const LABEL = `${BADGE} bg-ink/65 text-white`;

/**
 * The stage: a canvas of the course's stage size, scaled to fit its box, plus speech bubbles from
 * print(). data-frames counts drawn frames so e2e can see that something moved (AGENTS.md §9.8).
 */
export const Stage = forwardRef<StageHandle, StageProps>(function Stage(
  { className = '', testId = 'stage', size = DEFAULT_STAGE, coords = false },
  ref,
) {
  const { width: W, height: H } = size;
  const sizeRef = useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  });
  const canvas = useRef<HTMLCanvasElement>(null);
  /** Where the picture is drawn inside this component (the canvas letterboxes it). */
  const [pic, setPic] = useState<PictureRect | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [bubbles, setBubbles] = useState<string[]>([]);
  const frames = useRef(0);
  const replayToken = useRef(0);
  /** What is on screen now, so a resize (new backing size) can redraw it. */
  const shown = useRef<DrawEvent[]>([]);
  const picked = useRef<ReadonlySet<number> | null>(null);
  const ghostRef = useRef<readonly DrawEvent[] | null>(null);

  const repaint = (c: CanvasRenderingContext2D) => {
    repaintAll(c, shown.current, picked.current, ghostRef.current, sizeRef.current);
  };

  const ctx = () => canvas.current?.getContext('2d') ?? null;

  useEffect(() => {
    const el = canvas.current;
    if (el === null) return;
    // Backing store = displayed size × devicePixelRatio, so pictures stay sharp when the stage is big.
    let first = true;
    const fit = () => {
      const s = { width: W, height: H };
      const r = pictureRect(el.clientWidth, el.clientHeight, s);
      // Only the coordinates help reads it; skip the re-render on screens without it.
      if (coords) setPic({ ...r, left: el.offsetLeft + r.left, top: el.offsetTop + r.top });
      const b = backingSize(el.clientWidth, el.clientHeight, window.devicePixelRatio, s);
      if (el.width === b.width && el.height === b.height && !first) return;
      first = false;
      el.width = b.width;
      el.height = b.height;
      const c = el.getContext('2d');
      if (c === null) return;
      repaintAll(c, shown.current, picked.current, ghostRef.current, s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [W, H, coords]);

  useEffect(() => {
    void preloadSprites();
    return () => {
      stopMusic(); // leaving the screen ends the child's tune
    };
  }, []);

  const pointAt = (clientX: number, clientY: number) => {
    const r = canvas.current?.getBoundingClientRect();
    return r === undefined
      ? null
      : toStagePoint(clientX - r.left, clientY - r.top, r.width, r.height, size);
  };
  /** Coordinates help: the stage point under the mouse or finger (null outside the picture). */
  const track = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setPointer(pointAt(e.clientX, e.clientY));
  };
  const untrack = () => {
    setPointer(null);
  };

  const bump = () => {
    frames.current += 1;
    const el = canvas.current;
    el?.setAttribute('data-frames', String(frames.current));
    // What the child's code made you hear, for e2e (headless browsers have no speakers).
    el?.setAttribute('data-music', currentMusic() ?? '');
    el?.setAttribute('data-sounds', String(soundsPlayed()));
  };

  useImperativeHandle(ref, () => ({
    pointAt,
    showFrame(events) {
      const c = ctx();
      if (c === null) return;
      shown.current = [...events];
      repaint(c);
      hear(events); // play_sound / play_music are heard, not drawn
      const says = events.flatMap((e) => (e.t === 'say' ? [e.text] : []));
      if (says.length > 0) setBubbles(says.slice(-3));
      bump();
    },
    async replay(events, msPerEvent = replayDelay(events.length)) {
      const token = ++replayToken.current;
      await preloadSprites();
      const c = ctx();
      if (c === null) return;
      resetStage(c, sizeRef.current);
      setBubbles([]);
      shown.current = [];
      const says: string[] = [];
      for (const e of events) {
        if (token !== replayToken.current) return;
        if (e.t === 'say') {
          says.push(e.text);
          setBubbles(says.slice(-3));
        } else if (e.t === 'sound' || e.t === 'music') {
          hear([e]);
        } else {
          paintEvent(c, e, picked.current, sizeRef.current);
          shown.current.push(e);
        }
        bump();
        if (msPerEvent > 0 && e.t !== 'frame') await new Promise((r) => setTimeout(r, msPerEvent));
      }
      // The 👀 picture stays on top once the child's picture is complete.
      if (ghostRef.current !== null) repaint(c);
    },
    highlight(ids) {
      picked.current = ids;
      canvas.current?.setAttribute(
        'data-highlight',
        ids === null ? '' : [...ids].sort((a, b) => a - b).join(','),
      );
      const c = ctx();
      if (c !== null) repaint(c);
    },
    ghost(events) {
      ghostRef.current = events;
      canvas.current?.setAttribute('data-ghost', events === null ? 'off' : 'on');
      const c = ctx();
      if (c !== null) repaint(c);
    },
    picture() {
      if (shown.current.length === 0) return null;
      const out = document.createElement('canvas');
      out.width = W;
      out.height = H;
      const c = out.getContext('2d');
      if (c === null) return null;
      resetStage(c, sizeRef.current);
      for (const e of shown.current) drawEvent(c, e, sizeRef.current);
      return out.toDataURL('image/png');
    },
    clear() {
      replayToken.current++;
      stopMusic();
      canvas.current?.setAttribute('data-music', '');
      shown.current = [];
      const c = ctx();
      // repaint, not resetStage: the 👀 picture stays while its button is on (review M5).
      if (c !== null) repaint(c);
      setBubbles([]);
    },
  }));

  return (
    <div className={`relative flex min-h-0 items-center justify-center ${className}`}>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        data-testid={testId}
        data-frames="0"
        data-stage={`${String(W)}x${String(H)}`}
        className="h-full w-full object-contain"
        {...(coords
          ? {
              onPointerMove: track,
              onPointerDown: track,
              onPointerLeave: untrack,
              onPointerCancel: untrack,
            }
          : {})}
      />
      {coords && pic !== null && (
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={{ left: pic.left, top: pic.top, width: pic.width, height: pic.height }}
          data-testid="stage-coords"
        >
          {pointer !== null && (
            <>
              <div
                className="absolute inset-y-0 w-px bg-ink/35"
                style={{ left: (pointer.x / W) * pic.width }}
              />
              <div
                className="absolute inset-x-0 h-px bg-ink/35"
                style={{ top: (pointer.y / H) * pic.height }}
              />
            </>
          )}
          <span className={`${LABEL} left-0.5 top-0.5`} data-testid="stage-origin">
            (0, 0)
          </span>
          <span className={`${LABEL} right-0.5 top-0.5`} data-testid="stage-size-x">
            x → {W}
          </span>
          <span className={`${LABEL} bottom-0.5 left-0.5`} data-testid="stage-size-y">
            y ↓ {H}
          </span>
          {pointer !== null && (
            <span
              className={`${BADGE} bottom-0.5 right-0.5 bg-sun text-ink`}
              data-testid="stage-pointer"
              data-x={pointer.x}
              data-y={pointer.y}
            >
              x {pointer.x} · y {pointer.y}
            </span>
          )}
        </div>
      )}
      {bubbles.length > 0 && (
        <div
          className="pointer-events-none absolute inset-x-2 top-2 flex flex-col items-center gap-1"
          data-testid="bubbles"
        >
          {bubbles.map((b, i) => (
            <p
              key={`${String(i)}-${b}`}
              className="max-w-[90%] rounded-[12px] border-2 border-ink bg-white px-3 py-1 text-center text-[15px] shadow-hard"
              data-testid="bubble"
            >
              {b}
            </p>
          ))}
        </div>
      )}
    </div>
  );
});
