import { checkGoals, runGameTest, type GoalResult } from '@pyquest/checker';
import type { RunResult } from '@pyquest/runtime';
import type * as Blockly from 'blockly/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { python, usePyStatus } from '../../runtime/client';
import { Stage, type StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { useLessonState } from '../lesson/useLessonState';
import { BlockCodeSync, type SyncError } from './blockCodeSync';
import { BlocksPane, type BlocksPaneHandle } from './BlocksPane';
import { PythonPane, type PythonPaneHandle } from './PythonPane';
import { ErrorBubble, VarWatch } from './RunPanel';
import { FileTabs } from './FileTabs';
import { LibraryPanel } from './LibraryPanel';
import { TaskCard } from './TaskCard';
import { useSession } from '../../app/session';

const PARSE_DELAY_MS = 600;

/**
 * The code screen (layout B, spec §8): blocks | Python side by side (~70%), a narrow stage column with
 * ▶ Chạy, ⛶ fullscreen, variables and goals. Below 1280 px (iPad) the stage becomes a strip at the bottom.
 */
export function CodeScreen() {
  const { lessonId = '' } = useParams();
  const lesson = catalog.openLesson(lessonId);
  if (lesson?.code === undefined) return <p className="p-8">Bài này không có phần code.</p>;
  return <CodeEditor key={lessonId} lessonId={lessonId} />;
}

function CodeEditor({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate();
  const lesson = catalog.openLesson(lessonId);
  const code = lesson?.code;
  const { state, update, flush } = useLessonState(lessonId);
  const status = usePyStatus();
  const blocks = useRef<BlocksPaneHandle>(null);
  const pyPane = useRef<PythonPaneHandle>(null);
  const stage = useRef<StageHandle>(null);
  const sync = useRef<BlockCodeSync | null>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [result, setResult] = useState<RunResult | null>(null);
  const [goals, setGoals] = useState<GoalResult[]>([]);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const [split, setSplit] = useState(50);
  const [running, setRunning] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [runs, setRuns] = useState(0);
  const { profile } = useSession();

  const main = code?.main ?? 'main.py';
  // Several files (Bài 16): one is open in both panes at a time; Run always starts from main.
  const [active, setActive] = useState(main);
  const activeRef = useRef(main);
  const files =
    state !== null && Object.keys(state.files).length > 0 ? state.files : (code?.starter ?? {});
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });

  const grade = useCallback(
    (r: RunResult) => {
      if (code === undefined || lesson === undefined) return;
      const res = checkGoals(code.goals, r);
      setGoals(res);
      if (res.every((g) => g.ok)) {
        update((s) => {
          const before = lesson.steps.map((st) => st.kind).filter((k) => k !== 'playtest');
          return { doneSteps: [...new Set([...s.doneSteps, ...before])] };
        });
      }
    },
    [code, lesson, update],
  );

  const loop = useGameLoop(stage, (r) => {
    if (r.error !== undefined) {
      setResult(r);
      pyPane.current?.highlight(r.error.line, 'error');
    }
    if (r.error !== undefined || r.stoppedByLimit) setRunning(false);
  });
  useGameKeys(running && code?.mode === 'game', loop.press);

  useEffect(() => {
    void python.warmUp().catch(() => undefined);
  }, []);

  const saveCode = useCallback(
    (text: string) => {
      update((s) => ({
        files: {
          ...(Object.keys(s.files).length > 0 ? s.files : filesRef.current),
          [activeRef.current]: text,
        },
      }));
    },
    [update],
  );

  /** Rebuild the blocks from this code; a stopped worker just leaves the blocks stale until the next try. */
  function reparse(text: string) {
    void sync.current
      ?.fromCode(text)
      .then((ok) => {
        if (ok && sync.current !== null) update({ workspace: sync.current.saveState() });
      })
      .catch(() => undefined);
  }

  const onReady = useCallback(
    (ws: Blockly.WorkspaceSvg) => {
      const s = new BlockCodeSync(ws, (src) => python.parse(src), {
        onCode: (text) => {
          pyPane.current?.setText(text);
          saveCode(text);
        },
        onError: (e) => {
          setSyncError(e);
          pyPane.current?.highlight(e?.line ?? null, 'error');
        },
      });
      sync.current = s;
      // Saved blocks are only a first paint: the code is the truth, so always re-parse it (review C1).
      if (state?.workspace !== undefined) s.loadState(state.workspace);
      reparse(filesRef.current[activeRef.current] ?? '');
    },
    // Runs once, when Blockly is injected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** Switch both panes to another file of the project. */
  const openFile = useCallback((f: string) => {
    if (f === activeRef.current) return;
    activeRef.current = f;
    setActive(f);
    sync.current?.markCodeDirty();
    reparse(filesRef.current[f] ?? '');
    // reparse only touches refs and the stable update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBlocksEdit = useCallback(() => {
    const s = sync.current;
    if (s === null || s.applying) return;
    // Blocks behind newer typed code must never overwrite it (review C1).
    if (s.fromBlocks() === null) return;
    update({ workspace: s.saveState() });
  }, [update]);

  const onCodeChange = useCallback(
    (text: string) => {
      sync.current?.markCodeDirty();
      saveCode(text);
      clearTimeout(parseTimer.current);
      parseTimer.current = setTimeout(() => {
        reparse(text);
      }, PARSE_DELAY_MS);
    },
    // reparse is stable (refs only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveCode],
  );

  useEffect(
    () => () => {
      clearTimeout(parseTimer.current);
    },
    [],
  );

  const stop = () => {
    loop.stop();
    stage.current?.clear();
    setRunning(false);
    // Only kill the worker when Python is really busy; a replaying animation needs no reload (review I3).
    if (python.hasPending) {
      python.stop();
      void python
        .warmUp()
        .then(() => {
          reparse(filesRef.current[activeRef.current] ?? '');
        })
        .catch(() => undefined);
    }
  };

  const run = async () => {
    setRuns((n) => n + 1);
    if (code === undefined) return;
    flush();
    setRunning(true);
    try {
      if (code.mode === 'game') {
        // Grade with the scripted test run first (same as content:check), then let the child play.
        const test = await runGameTest(
          {
            start: () => python.startGame(filesRef.current, main, 1),
            step: (input) => python.step(input),
          },
          code.test ?? { frames: 90, taps: [] },
        );
        grade(test);
        setResult(test);
        pyPane.current?.highlight(test.error?.line ?? null, 'error');
        if (test.error !== undefined) {
          setRunning(false);
          return;
        }
        await loop.start(filesRef.current, main);
        return;
      }
      const r = await python.run(filesRef.current, main);
      setResult(r);
      pyPane.current?.highlight(r.error?.line ?? null, 'error');
      await stage.current?.replay(r.events);
      grade(r);
    } catch {
      /* stopped */
    } finally {
      if (code.mode === 'script') setRunning(false);
    }
  };

  if (lesson === undefined || code === undefined || state === null) return null;
  const allOk = goals.length > 0 && goals.every((g) => g.ok);
  const task = lesson.steps.find((st) => st.kind === 'code')?.slides[0];
  const codeDone = state.doneSteps.includes('code');

  return (
    <div className="flex h-dvh flex-col overflow-hidden" data-testid="code-screen">
      <TopBar title={`Bài ${String(lesson.order)}: ${lesson.title}`} back={`/l/${lessonId}`} />
      <div className="flex min-h-0 flex-1 gap-2 p-2 max-[1279px]:flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 gap-0">
          <section
            className="flex min-h-0 min-w-0 flex-col rounded-[10px] border-2 border-ink bg-white"
            style={{ flexBasis: `${String(split)}%` }}
          >
            <h2 className="border-b-2 border-ink px-3 py-1 text-base">🧩 Khối</h2>
            <div className="relative min-h-0 flex-1">
              {syncError !== null && (
                <div
                  className="absolute inset-0 z-[85] flex items-center justify-center bg-white/70 p-4 text-center"
                  data-testid="blocks-locked"
                >
                  <p className="rounded-[10px] border-2 border-ink bg-paper px-4 py-3 shadow-hard">
                    ✋ Sửa lỗi ở khung Python trước, khối sẽ hiện lại.
                  </p>
                </div>
              )}
              <BlocksPane
                ref={blocks}
                toolbox={code.toolbox}
                onEdit={onBlocksEdit}
                onReady={onReady}
                onDispose={(ws) => {
                  if (sync.current?.usesWorkspace(ws) === true) {
                    sync.current.dispose();
                    sync.current = null;
                  }
                }}
                onSelectLine={(line) => pyPane.current?.highlight(line, 'select')}
              />
            </div>
          </section>
          <div
            role="separator"
            aria-orientation="vertical"
            className="w-2 shrink-0 cursor-col-resize touch-none"
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              const row = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
              setSplit(Math.min(75, Math.max(25, ((e.clientX - row.left) / row.width) * 100)));
            }}
          />
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border-2 border-ink bg-code-bg">
            <h2 className="flex items-center gap-1 border-b-2 border-ink bg-paper px-2 py-1 text-base">
              <span className="px-1">🐍</span>
              <FileTabs files={Object.keys(files)} main={main} active={active} onOpen={openFile} />
              <span className="flex-1" />
              <button
                type="button"
                className="rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-bold"
                onClick={() => {
                  setLibraryOpen((o) => !o);
                }}
                data-testid="library-toggle"
              >
                📘 Thư viện
              </button>
            </h2>
            <div className="relative min-h-0 flex-1">
              <PythonPane
                key={active}
                ref={pyPane}
                initial={files[active] ?? ''}
                onChange={onCodeChange}
                onCursorLine={(line) => blocks.current?.highlightLine(line)}
              />
              {libraryOpen && (
                <LibraryPanel
                  uptoOrder={profile?.role === 'coach' ? undefined : lesson.order}
                  onClose={() => {
                    setLibraryOpen(false);
                  }}
                />
              )}
              {syncError !== null && (
                <p
                  className="absolute inset-x-2 bottom-2 z-[85] rounded-[8px] border-2 border-oops bg-oops-soft px-3 py-1 text-ink"
                  data-testid="sync-error"
                >
                  ⚠️ {syncError.messageVi}
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="flex min-h-0 w-[28%] min-w-[340px] shrink-0 flex-col gap-2 max-[1279px]:h-[250px] max-[1279px]:w-full max-[1279px]:min-w-0 max-[1279px]:flex-row">
          <TaskCard
            title={task?.title}
            text={task?.text}
            goals={code.goals}
            results={goals}
            hints={code.hints ?? []}
            walkthrough={code.walkthrough ?? []}
            runs={runs}
          />
          <div className="flex gap-2 max-[1279px]:w-44 max-[1279px]:flex-col">
            {running ? (
              <Button tone="oops" onClick={stop} data-testid="stop" className="flex-1 text-xl">
                ■ Dừng
              </Button>
            ) : status === 'failed' ? (
              <Button
                tone="sun"
                className="flex-1"
                onClick={() => {
                  void python.warmUp().catch(() => undefined);
                }}
                data-testid="python-retry"
              >
                ⚠️ Chưa tải được Python. Thử lại
              </Button>
            ) : (
              <Button
                tone="go"
                className="flex-1 text-xl"
                onClick={() => void run()}
                disabled={status === 'loading' || status === 'idle'}
                data-testid="run"
              >
                {status === 'loading' || status === 'idle' ? 'Đang chuẩn bị Python…' : '▶ Chạy'}
              </Button>
            )}
            <Button
              title="Chơi toàn màn hình"
              onClick={() => {
                flush();
                void navigate(`/l/${lessonId}/play`);
              }}
              data-testid="fullscreen"
            >
              ⛶<span className="max-[1279px]:inline hidden"> Toàn màn hình</span>
            </Button>
          </div>
          <div
            className="relative min-h-[45%] flex-1 touch-none max-[1279px]:min-h-0"
            onPointerDown={() => {
              loop.press('space', true);
            }}
            onPointerUp={() => {
              loop.press('space', false);
            }}
          >
            <Stage ref={stage} className="h-full" />
          </div>
          <div className="flex min-w-0 flex-col gap-2 max-[1279px]:w-64">
            <ErrorBubble result={result} />
            <VarWatch result={result} />
            {(allOk || codeDone) && (
              <Link to={`/l/${lessonId}`} data-testid="code-done">
                <Button tone="sun" className="w-full">
                  🎉 Xong phần code! Quay lại bài →
                </Button>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
