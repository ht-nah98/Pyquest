import { useEffect, useRef } from 'react';
import { usePyStatus } from '../../../runtime/client';
import { Stage, type StageHandle } from '../../../stage/Stage';
import { useGameKeys } from '../../../stage/useGameKeys';
import { useGameLoop } from '../../../stage/useGameLoop';
import { Button } from '../../../ui/Button';

/**
 * The finished sample game, filling the slide's visual box. It starts by itself on its "ready" screen
 * (the game waits for the first flap), so the slide never shows an empty stage.
 */
export function SampleGame({ source }: { source: string }) {
  const stage = useRef<StageHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  const status = usePyStatus();
  const loop = useGameLoop(stage, () => undefined);
  useGameKeys(true, loop.press);

  const start = () => {
    void loop.start({ 'main.py': source }, 'main.py').catch(() => undefined);
  };

  useEffect(() => {
    start();
    // Start once when the slide opens; ↻ restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={box} className="flex h-full w-full min-h-0 gap-4 bg-paper" data-testid="sample-game">
      <div
        className="relative min-h-0 flex-1 touch-none"
        onPointerDown={() => {
          loop.press('space', true);
        }}
        onPointerUp={() => {
          loop.press('space', false);
        }}
      >
        <Stage ref={stage} className="h-full" testId="sample-stage" />
        {status === 'loading' && (
          <p className="absolute inset-0 grid place-items-center text-xl text-ink-soft">
            Đang chuẩn bị Python…
          </p>
        )}
      </div>
      <div className="flex w-48 shrink-0 flex-col gap-3">
        <Button tone="go" onClick={start} data-testid="sample-play">
          {status === 'failed' ? '⚠️ Thử tải lại' : '↻ Chơi lại'}
        </Button>
        <Button
          onClick={() => void box.current?.requestFullscreen()}
          data-testid="sample-fullscreen"
        >
          ⛶ Toàn màn hình
        </Button>
        <p className="rounded-[10px] bg-brand-soft p-3 text-base">
          <b>Cách chơi:</b> bấm <kbd className="rounded border border-ink bg-white px-1">Space</kbd>
          , bấm chuột hoặc chạm vào sân để vỗ cánh. Bay qua khe giữa hai cột!
        </p>
      </div>
    </div>
  );
}
