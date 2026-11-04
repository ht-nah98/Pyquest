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
};

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
        resetStage(c);
        for (const e of shown.current) drawEvent(c, e);
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
        resetStage(c);
        for (const e of events) drawEvent(c, e);
        shown.current = [...events];
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
            drawEvent(c, e);
            shown.current.push(e);
          }
          bump();
          if (msPerEvent > 0 && e.t !== 'frame')
            await new Promise((r) => setTimeout(r, msPerEvent));
        }
      },
      clear() {
        replayToken.current++;
        shown.current = [];
        const c = ctx();
        if (c !== null) resetStage(c);
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
