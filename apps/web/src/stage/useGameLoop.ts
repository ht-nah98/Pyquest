import type { Files, RunResult } from '@pyquest/runtime';
import { useCallback, useEffect, useRef } from 'react';
import { python } from '../runtime/client';
import type { StageHandle } from './Stage';
import { hear, stopMusic } from './sound';

/**
 * Runs a game-mode program: startGame, then one step per animation frame with the keys held and
 * taps since the last frame. Only one step is in flight; a slow frame skips, it never queues up.
 */
export function useGameLoop(
  stage: React.RefObject<StageHandle | null>,
  onResult: (r: RunResult) => void,
) {
  const running = useRef(false);
  const keys = useRef(new Set<string>());
  const tapped = useRef(false);
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
    async (files: Files, main: string) => {
      stop();
      const mine = token.current;
      const first = await python.startGame(files, main);
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
          const input = { keys: [...keys.current], tapped: tapped.current };
          tapped.current = false;
          python.step(input).then(
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

  /** Space or a tap flaps (key_pressed()). */
  const press = useCallback((key: string, down: boolean) => {
    if (down) {
      keys.current.add(key);
      tapped.current = true;
    } else keys.current.delete(key);
  }, []);

  useEffect(() => stop, [stop]);
  return { start, stop, press, isRunning: () => running.current };
}
