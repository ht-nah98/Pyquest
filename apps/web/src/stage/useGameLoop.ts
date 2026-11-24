import type { Files, RunResult, StageSize } from '@pyquest/runtime';
import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import { brokenRun } from '../runtime/broken';
import { python } from '../runtime/client';
import { GameInputs } from './gameInput';
import type { StageHandle } from './Stage';
import { hear, stopMusic } from './sound';

/** A game runs 60 steps a second on every screen: the lessons say "60 khung = 1 giây". */
const STEP_MS = 1000 / 60;
/** A frame this much early still counts, so a 60 Hz screen never skips a step over timer jitter. */
const EARLY_MS = 2;

/**
 * When the step after the one at `now` may run. A screen faster than 60 Hz (120, 144…) skips frames; a slow
 * machine never gets a burst of steps to catch up.
 */
export function nextDue(now: number, due: number): number {
  return (due + STEP_MS > now ? due : now) + STEP_MS;
}

export const isDue = (now: number, due: number): boolean => now >= due - EARLY_MS;

/**
 * Runs a game-mode program: startGame, then at most 60 steps a second with what the player did
 * since the last frame (GameInputs). Spread `pointer` on the element around the stage: it makes a press flap
 * (key_pressed()) and fills mouse_x(), mouse_y(), clicked(). Only one step is in flight; a slow frame skips, it never queues up.
 * When Python itself breaks, the game ends with a brokenRun() result; after stop() nothing is reported.
 */
export function useGameLoop(
  stage: React.RefObject<StageHandle | null>,
  onResult: (r: RunResult) => void,
) {
  const running = useRef(false);
  const inputs = useRef(new GameInputs());
  const raf = useRef(0);
  /** Bumped by every start and stop: a start still awaiting Python must not run once superseded (M8). */
  const token = useRef(0);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const stop = useCallback(() => {
    token.current++;
    running.current = false;
    stopMusic(); // ■ Dừng, an error, leaving: the child's tune ends with the game
    cancelAnimationFrame(raf.current);
  }, []);

  const start = useCallback(
    async (files: Files, main: string, size: StageSize) => {
      stop();
      inputs.current.reset();
      const mine = token.current;
      const broke = (e: unknown) => {
        if (mine !== token.current) return;
        stop();
        onResultRef.current(brokenRun(e));
      };
      let first: RunResult;
      try {
        first = await python.startGame(files, main, { stage: size });
      } catch (e) {
        broke(e);
        return;
      }
      // Stopped, unmounted (stop runs on unmount) or restarted while Python was loading: do nothing.
      if (mine !== token.current) return;
      onResultRef.current(first);
      hear(first.events); // play_music("…") at the top of the file runs here, before the first frame
      if (first.error !== undefined || first.stoppedByLimit) return;
      running.current = true;
      let busy = false;
      let due = 0;
      const tick = (now: number) => {
        if (!running.current) return;
        if (!busy && isDue(now, due)) {
          busy = true;
          due = nextDue(now, due);
          python
            .step(inputs.current.take())
            .then((r) => {
              busy = false;
              if (mine !== token.current) return;
              stage.current?.showFrame(r.events);
              onResultRef.current(r);
              if (r.error !== undefined || r.stoppedByLimit) stop();
            })
            .catch(broke);
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stage, stop],
  );

  const press = useCallback((key: string, down: boolean, by: string, repeat: boolean) => {
    inputs.current.key(key, down, by, repeat);
  }, []);

  const pointer = useMemo(() => {
    const at = (e: PointerEvent) => stage.current?.pointAt(e.clientX, e.clientY) ?? null;
    return {
      onPointerDown: (e: PointerEvent) => {
        if (e.button === 0) inputs.current.pointerDown(e.pointerId, at(e));
      },
      onPointerMove: (e: PointerEvent) => {
        inputs.current.pointerMove(at(e));
      },
    };
  }, [stage]);

  // Released anywhere (dragged off the stage, taken over by the browser), or the window is left: nothing sticks.
  useEffect(() => {
    const up = (e: globalThis.PointerEvent) => {
      inputs.current.pointerUp(e.pointerId);
    };
    const leave = () => {
      inputs.current.releaseAll();
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', leave);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', leave);
      document.removeEventListener('visibilitychange', leave);
    };
  }, []);

  useEffect(() => stop, [stop]);
  return { start, stop, press, pointer, isRunning: () => running.current };
}
