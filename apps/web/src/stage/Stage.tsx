import type { DrawEvent } from '@pyquest/runtime';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@pyquest/runtime';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { drawEvent, preloadSprites, resetStage } from './render';

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

    const ctx = () => canvas.current?.getContext('2d') ?? null;

    useEffect(() => {
      const c = ctx();
      if (c !== null) resetStage(c);
      void preloadSprites();
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
        const says = events.flatMap((e) => (e.t === 'say' ? [e.text] : []));
        if (says.length > 0) setBubbles(says.slice(-3));
        bump();
      },
      async replay(events, msPerEvent = 30) {
        const token = ++replayToken.current;
        await preloadSprites();
        const c = ctx();
        if (c === null) return;
        resetStage(c);
        setBubbles([]);
        const says: string[] = [];
        for (const e of events) {
          if (token !== replayToken.current) return;
          if (e.t === 'say') {
            says.push(e.text);
            setBubbles(says.slice(-3));
          } else drawEvent(c, e);
          bump();
          if (msPerEvent > 0 && e.t !== 'frame')
            await new Promise((r) => setTimeout(r, msPerEvent));
        }
      },
      clear() {
        replayToken.current++;
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
          className="max-h-full max-w-full rounded-[10px] border-2 border-ink [image-rendering:pixelated]"
          style={{ aspectRatio: `${String(STAGE_WIDTH)} / ${String(STAGE_HEIGHT)}` }}
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
