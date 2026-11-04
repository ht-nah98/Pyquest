import type { DrawEvent } from '@pyquest/runtime';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@pyquest/runtime';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { drawEvent, preloadSprites, resetStage } from './render';
import { replayDelay } from './replayDelay';

export type StageHandle = {
  /** Draw a whole frame (game mode): reset, then every event. */
  showFrame(events: readonly DrawEvent[]): void;
  /** Script mode: replay events one by one so the child sees the order things happen. */
  replay(events: readonly DrawEvent[], msPerEvent?: number): Promise<void>;
  clear(): void;
  /**
   * 📞 calls panel: keep the drawings made by these calls bright and fade the rest (null: all bright).
   * Ids are the call ids of the events on screen.
   */
  highlight(ids: ReadonlySet<number> | null): void;
  /** 👀 The picture to draw, faded over the stage so the child can compare (null: hide it). */
  ghost(events: readonly DrawEvent[] | null): void;
};

/** How strong the 👀 picture-to-draw is. */
const GHOST = 0.35;

/** How faded a drawing is when another call is picked in the 📞 calls panel. */
const FADED = 0.18;

/** One event, faded when the 📞 panel picked another call. The background (clear) never fades. */
function paintEvent(c: CanvasRenderingContext2D, e: DrawEvent, picked: ReadonlySet<number> | null) {
  const dim =
    picked !== null &&
    e.t !== 'clear' &&
    e.t !== 'frame' &&
    (e.by === undefined || !picked.has(e.by));
  c.globalAlpha = dim ? FADED : 1;
  drawEvent(c, e);
  c.globalAlpha = 1;
}

function repaintAll(
  c: CanvasRenderingContext2D,
  events: readonly DrawEvent[],
  picked: ReadonlySet<number> | null,
  ghost: readonly DrawEvent[] | null = null,
) {
  resetStage(c);
  for (const e of events) paintEvent(c, e, picked);
  if (ghost === null) return;
  // On top, faded, without its background: the child sees both pictures at once.
  c.globalAlpha = GHOST;
  for (const e of ghost) if (e.t !== 'clear') drawEvent(c, e);
  c.globalAlpha = 1;
}

/**
 * The stage: a 400 × 600 canvas scaled to fit its box, plus speech bubbles from print().
 * data-frames counts drawn frames so e2e can see that something moved (AGENTS.md §9.8).
 */
export const Stage = forwardRef<StageHandle, { className?: string; testId?: string }>(
  function Stage({ className = '', testId = 'stage' }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [bubbles, setBubbles] = useState<string[]>([]);
    const frames = useRef(0);
    const replayToken = useRef(0);
    /** What is on screen now, so a resize (new backing size) can redraw it. */
    const shown = useRef<DrawEvent[]>([]);
    const picked = useRef<ReadonlySet<number> | null>(null);
    const ghostRef = useRef<readonly DrawEvent[] | null>(null);

    const repaint = (c: CanvasRenderingContext2D) => {
      repaintAll(c, shown.current, picked.current, ghostRef.current);
    };

    const ctx = () => canvas.current?.getContext('2d') ?? null;

    useEffect(() => {
      const el = canvas.current;
      if (el === null) return;
      // Backing store = displayed size × devicePixelRatio, so pictures stay sharp when the stage is big.
      let first = true;
      const fit = () => {
        const k = Math.min(el.clientWidth / STAGE_WIDTH, el.clientHeight / STAGE_HEIGHT);
        const scale = Math.max(1, k * (window.devicePixelRatio || 1));
        const w = Math.round(STAGE_WIDTH * scale);
        if (el.width === w && !first) return;
        first = false;
        el.width = w;
        el.height = Math.round(STAGE_HEIGHT * scale);
        const c = el.getContext('2d');
        if (c === null) return;
        repaintAll(c, shown.current, picked.current, ghostRef.current);
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      void preloadSprites();
      return () => {
        ro.disconnect();
      };
    }, []);

    const bump = () => {
      frames.current += 1;
      canvas.current?.setAttribute('data-frames', String(frames.current));
    };

    useImperativeHandle(ref, () => ({
      showFrame(events) {
        const c = ctx();
        if (c === null) return;
        shown.current = [...events];
        repaint(c);
        const says = events.flatMap((e) => (e.t === 'say' ? [e.text] : []));
        if (says.length > 0) setBubbles(says.slice(-3));
        bump();
      },
      async replay(events, msPerEvent = replayDelay(events.length)) {
        const token = ++replayToken.current;
        await preloadSprites();
        const c = ctx();
        if (c === null) return;
        resetStage(c);
        setBubbles([]);
        shown.current = [];
        const says: string[] = [];
        for (const e of events) {
          if (token !== replayToken.current) return;
          if (e.t === 'say') {
            says.push(e.text);
            setBubbles(says.slice(-3));
          } else {
            paintEvent(c, e, picked.current);
            shown.current.push(e);
          }
          bump();
          if (msPerEvent > 0 && e.t !== 'frame')
            await new Promise((r) => setTimeout(r, msPerEvent));
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
      clear() {
        replayToken.current++;
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
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          data-testid={testId}
          data-frames="0"
          className="h-full w-full object-contain"
        />
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
  },
);
