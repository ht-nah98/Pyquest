import { DEFAULT_STAGE, type StageSize } from '@pyquest/runtime';
import { useEffect, useRef, useState } from 'react';
import { problemOf } from '../../../runtime/broken';
import { usePyStatus } from '../../../runtime/client';
import { Stage, type StageHandle } from '../../../stage/Stage';
import { useGameKeys } from '../../../stage/useGameKeys';
import { useGameLoop } from '../../../stage/useGameLoop';
import { Button } from '../../../ui/Button';

export const isWide = (size: StageSize) => size.width > size.height * 1.2;

/**
 * The finished sample game, filling the slide's visual box. It starts by itself on its "ready" screen
 * (the game waits for the first flap), so the slide never shows an empty stage.
 */
export function SampleGame({
  source,
  stage: size = DEFAULT_STAGE,
  howToPlay,
}: {
  source: string;
  /** The sample game's stage (catalog.sampleStageOf); Bay Qua Khe's 400 × 600 when absent. */
  stage?: StageSize;
  /** course.howToPlay; absent: Bay Qua Khe's own words. */
  howToPlay?: string | undefined;
}) {
  const stage = useRef<StageHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  const status = usePyStatus();
  const [error, setError] = useState<string | null>(null);
  const loop = useGameLoop(stage, (r) => {
    const problem = problemOf(r);
    if (problem !== null) setError(problem);
  });
  useGameKeys(true, loop.press);

  const start = () => {
    void loop.start({ 'main.py': source }, 'main.py', size);
  };

  useEffect(() => {
    start();
    // Start once when the slide opens; ↻ restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [full, setFull] = useState(false);
  useEffect(() => {
    const changed = () => {
      const now = document.fullscreenElement !== null && document.fullscreenElement === box.current;
      setFull(now);
      // The ⛶ button is hidden now: without the focus the arrows would turn the slide behind the game.
      if (now) box.current?.focus();
    };
    document.addEventListener('fullscreenchange', changed);
    return () => {
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  const wide = isWide(size);
  const again = () => {
    setError(null);
    start();
    box.current?.focus(); // or Space would press ↻ again
  };

  return (
    <div
      ref={box}
      // Focusable, so a click on the game gives it the keys in Trình chiếu (LessonSlides).
      tabIndex={-1}
      className={`relative flex h-full w-full min-h-0 outline-none ${wide ? 'flex-col gap-3' : 'gap-4'} ${full ? 'bg-brand-deep' : 'bg-paper'}`}
      data-testid="sample-game"
      data-game-keys
    >
      <div className="relative min-h-0 flex-1 touch-none" {...loop.pointer}>
        <Stage ref={stage} className="h-full" testId="sample-stage" size={size} />
        {status === 'loading' && (
          <p className="absolute inset-0 grid place-items-center text-xl text-ink-soft">
            Đang chuẩn bị Python…
          </p>
        )}
        {error !== null && (
          <p
            className="absolute inset-x-4 bottom-4 rounded-[10px] border-2 border-oops bg-oops-soft px-4 py-2 text-center"
            data-testid="sample-error"
          >
            ⚠️ {error}
          </p>
        )}
      </div>
      {/* Fullscreen: the game takes the whole screen, the two buttons float over it. */}
      {full && (
        <div className="absolute right-3 top-[16%] z-10 flex flex-col items-end gap-2 opacity-70">
          <button
            type="button"
            className="min-h-11 rounded-[10px] bg-black/50 px-4 text-white"
            onClick={again}
            data-testid="sample-full-again"
          >
            ↻ Chơi lại
          </button>
          <button
            type="button"
            className="min-h-11 rounded-[10px] bg-black/50 px-4 text-white"
            onClick={() => void document.exitFullscreen()}
            data-testid="sample-full-exit"
          >
            ✕ Thu nhỏ
          </button>
        </div>
      )}
      <div
        className={
          full
            ? 'hidden'
            : wide
              ? 'flex shrink-0 items-center gap-3 [&>button]:shrink-0 [&>button]:whitespace-nowrap'
              : 'flex w-48 shrink-0 flex-col gap-3'
        }
      >
        <Button tone="go" onClick={again} data-testid="sample-play">
          {status === 'failed' ? '⚠️ Thử tải lại' : '↻ Chơi lại'}
        </Button>
        <Button
          onClick={() => void box.current?.requestFullscreen()}
          data-testid="sample-fullscreen"
        >
          ⛶ Toàn màn hình
        </Button>
        <p className="min-w-0 rounded-[10px] bg-brand-soft p-3 text-base">
          <b>Cách chơi:</b>{' '}
          {howToPlay ?? (
            <>
              bấm <kbd className="rounded border border-ink bg-white px-1">Space</kbd>, bấm chuột
              hoặc chạm vào sân để vỗ cánh. Bay qua khe giữa hai cột!
            </>
          )}
        </p>
      </div>
    </div>
  );
}
