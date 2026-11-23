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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { brokenRun } from '../../runtime/broken';
import { python } from '../../runtime/client';
import { uiSound, unlock } from '../../stage/sound';
import { Stage, type StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { changeTime, type LessonState } from '../../storage/store';
import { useLessonState } from '../lesson/useLessonState';
import { ExerciseBar } from './ExerciseBar';
import { doneSteps, pickExercise, visibleExercises, workOf } from './exercises';
import { CallPanel, familyOf } from './CallPanel';
import { EditorPanes, type EditorPanesHandle } from './EditorPanes';
import { ErrorBubble, VarWatch } from './RunPanel';
import { RunButton } from './RunButton';
import { TaskCard } from './TaskCard';
import { useSession } from '../../app/session';

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
  const isCoach = profile?.role === 'coach';
  const all =
    lesson?.exercises === undefined ? undefined : visibleExercises(lesson.exercises, isCoach);
  if (all === undefined || state === null) return null;
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
  const all = useMemo(
    () => visibleExercises(catalog.openLesson(lessonId)?.exercises ?? [code], isCoach),
    [lessonId, code, isCoach],
  );
  const panes = useRef<EditorPanesHandle>(null);
  const stage = useRef<StageHandle>(null);
  /** The course's stage: the canvas and WIDTH / HEIGHT in Python share it. */
  const size = catalog.lessonStage(lessonId);
  const [result, setResult] = useState<RunResult | null>(null);
  const [goals, setGoals] = useState<GoalResult[]>([]);
  const [running, setRunning] = useState(false);
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

  // Several files (Bài 16): Run always starts from main.
  const main = code.main;
  const work = workOf(state, all, code);
  const files = work.files;
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });

  const grade = useCallback(
    (r: RunResult, extra: CheckExtra = {}) => {
      if (lesson === undefined) return;
      const res = checkGoals(code.goals, r, { ...extra, stage: size });
      setGoals(res);
      if (r.error !== undefined) uiSound('oops');
      else if (res.every((g) => g.ok)) uiSound('ok');
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
    [code, lesson, all, update, size],
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

  /** Python starts again (■ Dừng, a crash): a parse it was working on is lost, so read the code once more. */
  const rewarm = () => {
    void python
      .warmUp()
      .then(() => {
        panes.current?.reparse();
      })
      .catch(() => undefined);
  };

  const loop = useGameLoop(stage, (r) => {
    if (r.error === undefined && !r.stoppedByLimit) return;
    if (python.status === 'loading') rewarm();
    setResult(r);
    panes.current?.highlight(r.error?.line ?? null, 'error');
    setRunning(false);
  });
  useGameKeys(running && code.mode === 'game', loop.press);

  useEffect(() => {
    void python.warmUp().catch(() => undefined);
  }, []);

  const saveCode = useCallback(
    (file: string, text: string) => {
      update((s) => {
        const w = workOf(s, all, code);
        return {
          exercises: {
            ...s.exercises,
            [code.id]: {
              ...w,
              files: { ...w.files, [file]: text },
              changedAt: changeTime(w.changedAt),
            },
          },
        };
      });
    },
    [all, code, update],
  );

  /** Bumped by every run, stop and unmount: a scripted test still stepping must leave the game to the next one. */
  const runToken = useRef(0);
  useEffect(
    () => () => {
      runToken.current++;
    },
    [],
  );

  const stop = () => {
    runToken.current++;
    loop.stop();
    stage.current?.clear();
    setRunning(false);
    // Only kill the worker when Python is really busy; a replaying animation needs no reload (review I3).
    if (python.hasPending) {
      python.stop();
      rewarm();
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
    panes.current?.highlight(call.line, 'select');
  };

  /** The solution's run, once: the picture a 'matches' exercise compares with and 👀 shows. */
  const solutionRun = async (): Promise<RunResult> => {
    if (expected.current === null)
      expected.current = await python.run(code.solution, main, { stage: size });
    return expected.current;
  };

  const toggleGhost = async () => {
    const on = !ghostOn;
    setGhostOn(on);
    const mine = runToken.current;
    try {
      const events: DrawEvent[] | null = on ? (await solutionRun()).events : null;
      stage.current?.ghost(events);
    } catch (e) {
      setGhostOn(false);
      if (mine === runToken.current) setResult(brokenRun(e));
    }
  };

  const run = async () => {
    const mine = ++runToken.current;
    unlock(); // browsers let sound start only from a click
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
            start: () => python.startGame(filesRef.current, main, { stage: size, seed: 1 }),
            step: (input) =>
              mine === runToken.current
                ? python.step(input)
                : Promise.reject(new Error('superseded')),
          },
          code.test ?? { frames: 90, taps: [] },
        );
        if (mine !== runToken.current) return;
        grade(test);
        setResult(test);
        setCallFrom(test.lastFrameFrom);
        panes.current?.highlight(test.error?.line ?? null, 'error');
        if (test.error !== undefined) {
          setRunning(false);
          return;
        }
        await loop.start(filesRef.current, main, size);
        return;
      }
      const r = await python.run(filesRef.current, main, { stage: size });
      setResult(r);
      setCallFrom(0);
      panes.current?.highlight(r.error?.line ?? null, 'error');
      // A 'shifts' goal runs the program once more with its variable moved (fixed numbers stay put).
      const shift = needsShiftedRun(code.goals);
      const moved =
        shift === undefined
          ? undefined
          : shiftSource(filesRef.current[main] ?? '', shift.var, shift.by);
      const shifted =
        moved === undefined
          ? undefined
          : await python.run({ ...filesRef.current, [main]: moved }, main, { stage: size });
      const solution = needsExpected(code.goals) ? await solutionRun() : undefined;
      await stage.current?.replay(r.events);
      grade(r, {
        ...(shifted === undefined ? {} : { shifted }),
        ...(solution === undefined ? {} : { expected: solution }),
      });
    } catch (e) {
      // ■ Dừng, leaving and a newer run bump the token; anything else is Python breaking.
      if (mine !== runToken.current) return;
      setResult(brokenRun(e));
      setRunning(false);
      rewarm();
    } finally {
      if (code.mode === 'script' && mine === runToken.current) setRunning(false);
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
      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <EditorPanes
          ref={panes}
          toolbox={code.toolbox}
          files={files}
          main={main}
          workspace={work.workspace}
          onCode={saveCode}
          onWorkspace={saveWorkspace}
          library={{ upto: profile?.role === 'coach' ? undefined : lessonId, stage: size }}
          note={
            typing && (
              <span className="ml-2 text-sm font-normal text-ink-soft" data-testid="typing-note">
                ✍️ Thử gõ code nhé, kéo khối cũng được
              </span>
            )
          }
        />

        <aside className="flex min-h-0 w-[28%] min-w-[340px] shrink-0 flex-col gap-2 max-[1279px]:w-[300px] max-[1279px]:min-w-0">
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
                  className={`min-h-9 rounded-t-[10px] border-2 border-b-0 border-ink px-3 py-0.5 text-sm font-bold ${panel === id ? 'bg-paper' : 'bg-white/60'}`}
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
              className="flex max-h-[38%] min-h-0 flex-col overflow-y-auto rounded-[12px] border-2 border-ink bg-paper p-3"
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
          <div className="flex gap-2">
            <RunButton running={running} onRun={() => void run()} onStop={stop} />
            <Button
              title="Chơi toàn màn hình"
              onClick={() => {
                flush();
                void navigate(`/l/${lessonId}/play?ex=${code.id}`);
              }}
              data-testid="fullscreen"
            >
              ⛶
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
          <div className="relative min-h-[48%] flex-1 touch-none" {...loop.pointer}>
            <Stage ref={stage} className="h-full" size={size} coords />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
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
