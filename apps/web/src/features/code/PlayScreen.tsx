import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { python } from '../../runtime/client';
import { Stage, type StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { useLessonState } from '../lesson/useLessonState';

/** ⛶ Fullscreen play of the child's own program. Esc or "Về code" goes back with the code untouched. */
export function PlayScreen() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const code = catalog.openLesson(lessonId)?.code;
  const { state } = useLessonState(lessonId);
  const stage = useRef<StageHandle>(null);
  const box = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loop = useGameLoop(stage, (r) => {
    if (r.error !== undefined) setError(r.error.messageVi);
  });
  useGameKeys(code?.mode === 'game', loop.press);

  const back = () => {
    loop.stop();
    if (document.fullscreenElement !== null) void document.exitFullscreen().catch(() => undefined);
    void navigate(`/l/${lessonId}/code`);
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

  useEffect(() => {
    if (state === null || code === undefined) return;
    const files = Object.keys(state.files).length > 0 ? state.files : code.starter;
    if (code.mode === 'game') void loop.start(files, code.main);
    else
      void python.run(files, code.main).then((r) => {
        if (r.error !== undefined) setError(r.error.messageVi);
        return stage.current?.replay(r.events);
      });
    // Restart only on load and on ↻.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null, round]);

  return (
    <div
      ref={box}
      className="relative flex h-dvh w-full items-center justify-center bg-brand-deep"
      data-testid="play-screen"
      onPointerDown={() => {
        loop.press('space', true);
      }}
      onPointerUp={() => {
        loop.press('space', false);
      }}
    >
      <Stage ref={stage} className="h-full w-full p-2" testId="play-stage" />
      <div
        className="absolute right-3 top-3 z-10 flex gap-2"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          className="min-h-11 rounded-[10px] bg-black/50 px-4 text-white"
          onClick={() => {
            setError(null);
            setRound((n) => n + 1);
          }}
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
          ✕ Về code
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
      {code?.mode === 'game' && (
        <p className="absolute bottom-2 text-sm text-white/70">
          Bấm Space hoặc chạm màn hình để vỗ cánh · Esc để về code
        </p>
      )}
    </div>
  );
}
