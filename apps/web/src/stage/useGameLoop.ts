import type { Files, RunResult, StageSize } from '@pyquest/runtime';
import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from 'react';
import { python } from '../runtime/client';
import { GameInputs } from './gameInput';
import type { StageHandle } from './Stage';
import { hear, stopMusic } from './sound';

/**
 * Runs a game-mode program: startGame, then one step per animation frame with what the player did
 * since the last frame (GameInputs). Spread `pointer` on the element around the stage: it makes a press flap
 * (key_pressed()) and fills mouse_x(), mouse_y(), clicked(). Only one step is in flight; a slow frame skips, it never queues up.
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
      const first = await python.startGame(files, main, { stage: size });
      // Stopped, unmounted (stop runs on unmount) or restarted while Python was loading: do nothing.
      if (mine !== token.current) return;
      onResultRef.current(first);
      hear(first.events); // play_music("…") at the top of the file runs here, before the first frame
      if (first.error !== undefined) return;
      running.current = true;
      let busy = false;
      const tick = () => {
        if (!running.current) return;
        if (!busy) {
          busy = true;
          python.step(inputs.current.take()).then(
            (r) => {
              busy = false;
              if (!running.current) return;
              stage.current?.showFrame(r.events);
              onResultRef.current(r);
              if (r.error !== undefined || r.stoppedByLimit) stop();
            },
            () => {
              busy = false;
              stop();
            },
          );
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stage, stop],
  );

  const press = useCallback((key: string, down: boolean) => {
    inputs.current.key(key, down);
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
