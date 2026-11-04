import { useRef, useState } from 'react';
import { usePyStatus } from '../../../runtime/client';
import { Stage, type StageHandle } from '../../../stage/Stage';
import { useGameLoop } from '../../../stage/useGameLoop';
import { useGameKeys } from '../../../stage/useGameKeys';
import { Button } from '../../../ui/Button';

/** The finished sample game, playable on the slide (Space, click or tap to flap). */
export function SampleGame({ source }: { source: string }) {
  const stage = useRef<StageHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const status = usePyStatus();
  const loop = useGameLoop(stage, () => undefined);
  useGameKeys(playing, loop.press);

  const play = () => {
    setPlaying(true);
    void loop.start({ 'main.py': source }, 'main.py');
  };

  return (
    <div
      ref={box}
      className="flex h-full max-h-[460px] items-stretch gap-4 bg-paper"
      data-testid="sample-game"
    >
      <div
        className="h-full min-h-60 touch-none"
        onPointerDown={() => {
          loop.press('space', true);
        }}
        onPointerUp={() => {
          loop.press('space', false);
        }}
      >
        <Stage ref={stage} className="h-full" testId="sample-stage" />
      </div>
      <div className="flex flex-col gap-3">
        <Button tone="go" onClick={play} data-testid="sample-play">
          {status === 'loading' ? 'Đang chuẩn bị Python…' : playing ? '↻ Chơi lại' : '▶ Chơi thử'}
        </Button>
        <Button
          onClick={() => void box.current?.requestFullscreen()}
          data-testid="sample-fullscreen"
        >
          ⛶ Toàn màn hình
        </Button>
        <p className="max-w-56 text-base text-ink-soft">
          Bấm Space, bấm chuột hoặc chạm vào sân để bay.
        </p>
      </div>
    </div>
  );
}
