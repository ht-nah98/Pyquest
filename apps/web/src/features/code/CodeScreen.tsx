import {
  checkGoals,
  needsExpected,
  needsShiftedRun,
  runGameTest,
  shiftSource,
  type CheckExtra,
  type GoalResult,
} from '@pyquest/checker';
import type { Exercise } from '@pyquest/content-schema';
import type { Call, DrawEvent, RunResult } from '@pyquest/runtime';
import type * as Blockly from 'blockly/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { python, usePyStatus } from '../../runtime/client';
import { Stage, type StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import type { LessonState } from '../../storage/store';
import { useLessonState } from '../lesson/useLessonState';
import { ExerciseBar } from './ExerciseBar';
import { doneSteps, pickExercise, workOf } from './exercises';
import { BlockCodeSync, type SyncError } from './blockCodeSync';
import { BlocksPane, type BlocksPaneHandle } from './BlocksPane';
import { PythonPane, type PythonPaneHandle } from './PythonPane';
import { CallPanel, familyOf } from './CallPanel';
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
  if (lesson?.exercises === undefined) return <p className="p-8">Bài này không có phần code.</p>;
  return <CodeLesson key={lessonId} lessonId={lessonId} />;
}

/** Holds the lesson's saved state (one hook for the whole screen) and picks the exercise from ?ex=. */
function CodeLesson({ lessonId }: { lessonId: string }) {
  const lesson = catalog.openLesson(lessonId);
  const { state, update, flush } = useLessonState(lessonId);
  const [params] = useSearchParams();
  const { profile } = useSession();
  const all = lesson?.exercises;
  if (all === undefined || state === null) return null;
  const isCoach = profile?.role === 'coach';
  const ex = pickExercise(all, state, params.get('ex') ?? undefined, isCoach);
  return (
    <CodeEditor
      key={ex.id}
      lessonId={lessonId}
      exercise={ex}
      state={state}
      update={update}
      flush={flush}
      isCoach={isCoach}
    />
  );
}

type Update = ReturnType<typeof useLessonState>['update'];

function CodeEditor({
  lessonId,
  exercise,
  state,
  update,
  flush,
  isCoach,
}: {
  lessonId: string;
  exercise: Exercise;
  state: LessonState;
  update: Update;
  flush: () => void;
  isCoach: boolean;
}) {
  const navigate = useNavigate();
  const lesson = catalog.openLesson(lessonId);
  const code = exercise;
  const all = useMemo(() => catalog.openLesson(lessonId)?.exercises ?? [code], [lessonId, code]);
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
  /** Right column: the task card or the 📞 calls panel. */
  const [panel, setPanel] = useState<'task' | 'calls'>('task');
  const [picked, setPicked] = useState<number | null>(null);
  /** Game mode shows the calls of the test run's last frame: ids from here on. */
  const [callFrom, setCallFrom] = useState(0);
  /** 👀 The solution's picture, faded over the stage ('matches' exercises). */
  const [ghostOn, setGhostOn] = useState(false);
  const expected = useRef<RunResult | null>(null);
  const { profile } = useSession();

  const main = code.main;
  // Several files (Bài 16): one is open in both panes at a time; Run always starts from main.
  const [active, setActive] = useState(main);
  const activeRef = useRef(main);
  const files = workOf(state, all, code).files;
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });

  const grade = useCallback(
    (r: RunResult, extra: CheckExtra = {}) => {
      if (lesson === undefined) return;
      const res = checkGoals(code.goals, r, extra);
      setGoals(res);
      if (res.every((g) => g.ok)) {
        update((s) => {
          const done = [...new Set([...(s.exercisesDone ?? []), code.id])];
          const kinds = lesson.steps.map((st) => st.kind);
          return {
            exercisesDone: done,
            doneSteps: [...new Set([...s.doneSteps, ...doneSteps(kinds, all, done)])],
          };
        });
      }
    },
    [code, lesson, all, update],
  );

  // Coming back to the lesson opens this exercise again.
  useEffect(() => {
    if (state.exercise !== code.id) update({ exercise: code.id });
    // Once, when the exercise opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Save the blocks of this exercise (a first paint next time; the code stays the truth). */
  const saveWorkspace = useCallback(
    (ws: object) => {
      update((s) => {
        const w = workOf(s, all, code);
        return { exercises: { ...s.exercises, [code.id]: { ...w, workspace: ws } } };
      });
    },
    [all, code, update],
  );

  const loop = useGameLoop(stage, (r) => {
    if (r.error !== undefined) {
      setResult(r);
      pyPane.current?.highlight(r.error.line, 'error');
    }
    if (r.error !== undefined || r.stoppedByLimit) setRunning(false);
  });
  useGameKeys(running && code.mode === 'game', loop.press);

  useEffect(() => {
    void python.warmUp().catch(() => undefined);
  }, []);

  const saveCode = useCallback(
    (text: string) => {
      update((s) => {
        const w = workOf(s, all, code);
        return {
          exercises: {
            ...s.exercises,
            [code.id]: { ...w, files: { ...w.files, [activeRef.current]: text } },
          },
        };
      });
    },
    [all, code, update],
  );

  /** Rebuild the blocks from this code; a stopped worker just leaves the blocks stale until the next try. */
  function reparse(text: string) {
    void sync.current
      ?.fromCode(text)
      .then((ok) => {
        if (ok && sync.current !== null) saveWorkspace(sync.current.saveState());
        if (ok) blocks.current?.refreshCalls();
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
      const saved = workOf(state, all, code).workspace;
      if (saved !== undefined) s.loadState(saved);
      blocks.current?.refreshCalls();
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
    saveWorkspace(s.saveState());
  }, [saveWorkspace]);

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

  /** 📞 panel: light up what this call drew, and its line in the code. */
  const pick = (call: Call | null) => {
    setPicked(call?.id ?? null);
    if (call === null || result === null) {
      stage.current?.highlight(null);
      return;
    }
    const ids = familyOf(result.calls, call.id);
    // The live game numbers each frame's calls from 0; the test run numbered them on from callFrom.
    const live = code.mode === 'game' ? new Set([...ids].map((i) => i - callFrom)) : ids;
    stage.current?.highlight(live);
    pyPane.current?.highlight(call.line, 'select');
  };

  /** The solution's run, once: the picture a 'matches' exercise compares with and 👀 shows. */
  const solutionRun = async (): Promise<RunResult> => {
    if (expected.current === null) expected.current = await python.run(code.solution, main);
    return expected.current;
  };

  const toggleGhost = async () => {
    const on = !ghostOn;
    setGhostOn(on);
    const events: DrawEvent[] | null = on ? (await solutionRun()).events : null;
    stage.current?.ghost(events);
  };

  const run = async () => {
    setRuns((n) => n + 1);
    flush();
    setRunning(true);
    setPicked(null);
    stage.current?.highlight(null);
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
        setCallFrom(test.lastFrameFrom);
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
      setCallFrom(0);
      pyPane.current?.highlight(r.error?.line ?? null, 'error');
      // A 'shifts' goal runs the program once more with its variable moved (fixed numbers stay put).
      const shift = needsShiftedRun(code.goals);
      const moved =
        shift === undefined
          ? undefined
          : shiftSource(filesRef.current[main] ?? '', shift.var, shift.by);
      const shifted =
        moved === undefined
          ? undefined
          : await python.run({ ...filesRef.current, [main]: moved }, main);
      const solution = needsExpected(code.goals) ? await solutionRun() : undefined;
      await stage.current?.replay(r.events);
      grade(r, {
        ...(shifted === undefined ? {} : { shifted }),
        ...(solution === undefined ? {} : { expected: solution }),
      });
    } catch {
      /* stopped */
    } finally {
      if (code.mode === 'script') setRunning(false);
    }
  };

  if (lesson === undefined) return null;
  const allOk = goals.length > 0 && goals.every((g) => g.ok);
  const done = state.exercisesDone ?? [];
  const exDone = done.includes(code.id);
  const next = all[all.findIndex((e) => e.id === code.id) + 1];
  const typing = code.input === 'typing';
  // The 📞 tab appears once the lesson teaches def, or the child's code made a call anyway.
  const showCalls = code.toolbox.includes('pq_def') || (result?.calls.length ?? 0) > 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden" data-testid="code-screen">
      <TopBar title={`Bài ${String(lesson.order)}: ${lesson.title}`} back={`/l/${lessonId}`} />
      {all.length > 1 && (
        <ExerciseBar lessonId={lessonId} all={all} current={code} done={done} isCoach={isCoach} />
      )}
      <div className="flex min-h-0 flex-1 gap-2 p-2 max-[1279px]:flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 gap-0">
          <section
            className="flex min-h-0 min-w-0 flex-col rounded-[10px] border-2 border-ink bg-white"
            style={{ flexBasis: `${String(split)}%` }}
          >
            <h2 className="border-b-2 border-ink px-3 py-1 text-base" data-testid="blocks-title">
              🧩 Khối
              {typing && (
                <span className="ml-2 text-sm font-normal text-ink-soft" data-testid="typing-note">
                  ✍️ Bài này em gõ code, khối chỉ để xem
                </span>
              )}
            </h2>
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
                readOnly={typing}
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
          {showCalls && (
            <div className="flex gap-1" role="tablist" data-testid="side-tabs">
              {(
                [
                  ['task', '🎯 Nhiệm vụ'],
                  [
                    'calls',
                    `📞 Cuộc gọi${result !== null && result.calls.length > 0 ? ` (${String(result.calls.filter((c) => c.id >= callFrom).length)})` : ''}`,
                  ],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={panel === id}
                  className={`rounded-t-[10px] border-2 border-b-0 border-ink px-3 py-0.5 text-sm font-bold ${panel === id ? 'bg-paper' : 'bg-white/60'}`}
                  onClick={() => {
                    setPanel(id);
                  }}
                  data-testid={`tab-${id}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {panel === 'calls' && showCalls ? (
            <section
              className="flex max-h-[38%] min-h-0 flex-col overflow-y-auto rounded-[12px] border-2 border-ink bg-paper p-3 max-[1279px]:max-h-full max-[1279px]:w-80"
              data-testid="calls-card"
            >
              <CallPanel result={result} from={callFrom} picked={picked} onPick={pick} />
            </section>
          ) : (
            <TaskCard
              title={code.title}
              text={code.task}
              goals={code.goals}
              results={goals}
              hints={code.hints ?? []}
              walkthrough={code.walkthrough ?? []}
              runs={runs}
            />
          )}
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
                void navigate(`/l/${lessonId}/play?ex=${code.id}`);
              }}
              data-testid="fullscreen"
            >
              ⛶<span className="max-[1279px]:inline hidden"> Toàn màn hình</span>
            </Button>
            {needsExpected(code.goals) && (
              <Button
                title="Hiện mờ hình cần vẽ để so"
                onClick={() => void toggleGhost()}
                data-testid="ghost-toggle"
                aria-pressed={ghostOn}
                className={ghostOn ? 'bg-sun' : ''}
              >
                👀
              </Button>
            )}
          </div>
          <div
            className="relative min-h-[48%] flex-1 touch-none max-[1279px]:min-h-0"
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
            {(allOk || exDone) &&
              (next === undefined ? (
                <Link to={`/l/${lessonId}`} data-testid="code-done">
                  <Button tone="sun" className="w-full">
                    🎉 Xong phần code! Quay lại bài →
                  </Button>
                </Link>
              ) : (
                <Link to={`/l/${lessonId}/code?ex=${next.id}`} data-testid="next-exercise">
                  <Button tone="sun" className="w-full">
                    ✅ Đạt! Sang bài tập {all.indexOf(next) + 1} →
                  </Button>
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
