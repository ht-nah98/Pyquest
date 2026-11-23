import { DEFAULT_STAGE, type StageSize } from '@pyquest/runtime';
import { useEffect, useRef, useState } from 'react';
import { problemOf } from '../../../runtime/broken';
import { usePyStatus } from '../../../runtime/client';
import { Stage, type StageHandle } from '../../../stage/Stage';
import { useGameKeys } from '../../../stage/useGameKeys';
import { useGameLoop } from '../../../stage/useGameLoop';
import { Button } from '../../../ui/Button';

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
  /** The course's stage (catalog.stageOf); Bay Qua Khe's 400 × 600 when absent. */
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

  return (
    <div
      ref={box}
      // Focusable, so a click on the game gives it the keys in Trình chiếu (LessonSlides).
      tabIndex={-1}
      className="flex h-full w-full min-h-0 gap-4 bg-paper outline-none"
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
      <div className="flex w-48 shrink-0 flex-col gap-3">
        <Button
          tone="go"
          onClick={() => {
            setError(null);
            start();
          }}
          data-testid="sample-play"
        >
          {status === 'failed' ? '⚠️ Thử tải lại' : '↻ Chơi lại'}
        </Button>
        <Button
          onClick={() => void box.current?.requestFullscreen()}
          data-testid="sample-fullscreen"
        >
          ⛶ Toàn màn hình
        </Button>
        <p className="rounded-[10px] bg-brand-soft p-3 text-base">
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
