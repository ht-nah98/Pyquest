import type { StageSize } from '@pyquest/runtime';
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Stage, type StageHandle } from '../../stage/Stage';
import type { useGameLoop } from '../../stage/useGameLoop';
import { MuteButton } from '../../ui/MuteButton';

/** Fullscreen play: the stage on a dark page with ↻ Chơi lại and ✕ back (also Esc or leaving fullscreen). */
export function PlayFrame({
  stage,
  size,
  pointer,
  error,
  hint,
  backLabel,
  onAgain,
  onBack,
}: {
  stage: RefObject<StageHandle | null>;
  size: StageSize;
  pointer: ReturnType<typeof useGameLoop>['pointer'];
  error: string | null;
  hint?: ReactNode;
  backLabel: string;
  onAgain: () => void;
  onBack: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  const back = () => {
    if (document.fullscreenElement !== null) void document.exitFullscreen().catch(() => undefined);
    onBack();
  };

  useEffect(() => {
    void box.current?.requestFullscreen().catch(() => undefined);
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back();
    };
    const left = () => {
      if (document.fullscreenElement === null) back();
    };
    window.addEventListener('keydown', esc);
    document.addEventListener('fullscreenchange', left);
    return () => {
      window.removeEventListener('keydown', esc);
      document.removeEventListener('fullscreenchange', left);
    };
    // back() only navigates; binding once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={box}
      className="relative flex h-dvh w-full touch-none items-center justify-center bg-brand-deep"
      data-testid="play-screen"
      {...pointer}
    >
      <Stage ref={stage} className="h-full w-full p-2" testId="play-stage" size={size} />
      <div
        className="absolute right-3 top-3 z-10 flex gap-2"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        <MuteButton className="min-h-11 bg-black/50" />
        <button
          type="button"
          className="min-h-11 rounded-[10px] bg-black/50 px-4 text-white"
          onClick={onAgain}
          data-testid="play-again"
        >
          ↻ Chơi lại
        </button>
        <button
          type="button"
          className="min-h-11 rounded-[10px] bg-black/50 px-4 text-white"
          onClick={back}
          data-testid="back-to-code"
        >
          ✕ {backLabel}
        </button>
      </div>
      {error !== null && (
        <p
          className="absolute bottom-6 rounded-[10px] border-2 border-oops bg-oops-soft px-4 py-2"
          data-testid="play-error"
        >
          ⚠️ {error}
        </p>
      )}
      {hint !== undefined && <p className="absolute bottom-2 text-sm text-white/70">{hint}</p>}
    </div>
  );
}
