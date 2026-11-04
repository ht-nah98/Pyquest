import { checkGoals, type GoalResult } from '@pyquest/checker';
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
import { ErrorBubble, GoalList, VarWatch } from './RunPanel';

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

  const main = code?.main ?? 'main.py';
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
    setResult(r);
    grade(r);
    if (r.error !== undefined || r.stoppedByLimit) setRunning(false);
  });
  useGameKeys(running && code?.mode === 'game', loop.press);

  useEffect(() => {
    void python.warmUp().catch(() => undefined);
  }, []);

  const saveCode = useCallback(
    (text: string) => {
      update((s) => ({
        files: { ...(Object.keys(s.files).length > 0 ? s.files : filesRef.current), [main]: text },
      }));
    },
    [update, main],
  );

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
      if (state?.workspace !== undefined) s.loadState(state.workspace);
      else void s.fromCode(filesRef.current[main] ?? '');
    },
    // Runs once, when Blockly is injected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onBlocksEdit = useCallback(() => {
    const s = sync.current;
    if (s === null || s.applying) return;
    s.fromBlocks();
    update({ workspace: s.saveState() });
  }, [update]);

  const onCodeChange = useCallback(
    (text: string) => {
      saveCode(text);
      clearTimeout(parseTimer.current);
      parseTimer.current = setTimeout(() => {
        void sync.current?.fromCode(text).then((ok) => {
          if (ok && sync.current !== null) update({ workspace: sync.current.saveState() });
        });
      }, PARSE_DELAY_MS);
    },
    [saveCode, update],
  );

  useEffect(
    () => () => {
      clearTimeout(parseTimer.current);
    },
    [],
  );

  const stop = () => {
    loop.stop();
    python.stop();
    setRunning(false);
    void python.warmUp().catch(() => undefined);
  };

  const run = async () => {
    if (code === undefined) return;
    flush();
    setRunning(true);
    try {
      if (code.mode === 'game') {
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
            <div className="min-h-0 flex-1">
              <BlocksPane
                ref={blocks}
                toolbox={code.toolbox}
                onEdit={onBlocksEdit}
                onReady={onReady}
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
            <h2 className="border-b-2 border-ink bg-paper px-3 py-1 text-base">
              🐍 Python · {main}
            </h2>
            <div className="relative min-h-0 flex-1">
              <PythonPane
                ref={pyPane}
                initial={files[main] ?? ''}
                onChange={onCodeChange}
                onCursorLine={(line) => blocks.current?.highlightLine(line)}
              />
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

        <aside className="flex min-h-0 w-[26%] shrink-0 flex-col gap-2 max-[1279px]:h-[240px] max-[1279px]:w-full max-[1279px]:flex-row">
          <div className="flex flex-wrap gap-2 max-[1279px]:w-40 max-[1279px]:flex-col">
            {running ? (
              <Button tone="oops" onClick={stop} data-testid="stop">
                ■ Dừng
              </Button>
            ) : (
              <Button
                tone="go"
                onClick={() => void run()}
                disabled={status === 'loading'}
                data-testid="run"
              >
                {status === 'loading' || status === 'idle' ? 'Đang chuẩn bị Python…' : '▶ Chạy'}
              </Button>
            )}
            <Button
              onClick={() => {
                flush();
                void navigate(`/l/${lessonId}/play`);
              }}
              data-testid="fullscreen"
            >
              ⛶ Chơi toàn màn hình
            </Button>
          </div>
          <div
            className="min-h-0 flex-1 touch-none"
            onPointerDown={() => {
              loop.press('space', true);
            }}
            onPointerUp={() => {
              loop.press('space', false);
            }}
          >
            <Stage ref={stage} className="h-full" />
          </div>
          <div className="flex min-w-0 flex-col gap-2 max-[1279px]:w-72">
            <ErrorBubble result={result} />
            <VarWatch result={result} />
            <GoalList goals={code.goals} results={goals} />
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
