import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { python } from '../../runtime/client';
import { Stage, type StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import type { LessonState } from '../../storage/store';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { workOf } from '../code/exercises';
import { lessonsOf } from './coachApi';

/** A child's code for one exercise, read-only, with ▶ to see what it draws. The coach cannot change it. */
export function CoachCode() {
  const { userId = '', lessonId = '' } = useParams();
  const [params] = useSearchParams();
  const lesson = catalog.openLesson(lessonId);
  const all = lesson?.exercises ?? [];
  const ex = all.find((e) => e.id === params.get('ex')) ?? all[0];
  const [state, setState] = useState<LessonState | null | undefined>(undefined);
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stage = useRef<StageHandle>(null);
  const loop = useGameLoop(stage, (r) => {
    if (r.error !== undefined) setError(r.error.messageVi);
  });
  useGameKeys(ex?.mode === 'game', loop.press);

  useEffect(() => {
    void lessonsOf(userId)
      .then((rows) => {
        setState(rows.find((r) => r.lessonId === lessonId)?.state ?? null);
      })
      .catch(() => {
        setState(null);
      });
  }, [userId, lessonId]);

  if (lesson === undefined || ex === undefined)
    return <TopBar title="Không có bài này" back={`/coach/s/${userId}`} />;
  const files = state === undefined || state === null ? null : workOf(state, all, ex).files;
  const names = files === null ? [] : Object.keys(files);
  const shown = file !== null && names.includes(file) ? file : ex.main;
  const done = state?.exercisesDone?.includes(ex.id) === true;

  const run = () => {
    if (files === null) return;
    setError(null);
    loop.stop();
    if (ex.mode === 'game') void loop.start(files, ex.main);
    else
      void python.run(files, ex.main).then((r) => {
        if (r.error !== undefined) setError(r.error.messageVi);
        return stage.current?.replay(r.events);
      });
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        title={`Bài ${String(lesson.order)} · ${ex.title} ${done ? '✓' : ''}`}
        back={`/coach/s/${userId}`}
      />
      <nav className="flex gap-2 overflow-x-auto border-b-2 border-ink/10 bg-paper px-3 py-1">
        {all.map((e, i) => (
          <Link
            key={e.id}
            to={`/coach/s/${userId}/l/${lessonId}?ex=${e.id}`}
            className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm ${e.id === ex.id ? 'border-ink bg-sun font-bold' : 'border-ink/30 bg-white'}`}
          >
            {i + 1}. {e.title}
          </Link>
        ))}
      </nav>
      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[10px] border-2 border-ink bg-code-bg">
          <h2 className="flex items-center gap-2 border-b-2 border-ink bg-paper px-3 py-1 text-base">
            🐍 Code của bé (chỉ xem)
            {names.length > 1 &&
              names.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`min-h-9 rounded-full px-3 font-code text-sm ${n === shown ? 'bg-ink text-white' : ''}`}
                  onClick={() => {
                    setFile(n);
                  }}
                >
                  {n}
                </button>
              ))}
          </h2>
          {state === undefined && <p className="p-4 text-white">Đang tải…</p>}
          {state === null && <p className="p-4 text-white">Bé chưa mở bài này.</p>}
          {files !== null && (
            <pre
              className="min-h-0 flex-1 overflow-auto p-3 font-code text-[16px] leading-relaxed text-code-fg"
              data-testid="student-code"
            >
              {(files[shown] ?? '').split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-10 shrink-0 select-none pr-3 text-right text-white/30">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          )}
        </section>
        <aside className="flex w-[34%] min-w-[300px] shrink-0 flex-col gap-2">
          <Button
            tone="go"
            className="text-xl"
            disabled={files === null}
            onClick={run}
            data-testid="coach-run"
          >
            ▶ Chạy code của bé
          </Button>
          <div
            className="relative min-h-0 flex-1 touch-none"
            onPointerDown={() => {
              loop.press('space', true);
            }}
            onPointerUp={() => {
              loop.press('space', false);
            }}
          >
            <Stage ref={stage} className="h-full" />
          </div>
          {error !== null && <p className="rounded-[8px] bg-oops-soft px-3 py-2">⚠️ {error}</p>}
        </aside>
      </div>
    </div>
  );
}
