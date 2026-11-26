import type { Studio, StudioTemplate } from '@pyquest/content-schema';
import type { DrawEvent, RunResult } from '@pyquest/runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { catalog } from '../../content/catalog';
import { brokenRun } from '../../runtime/broken';
import { python } from '../../runtime/client';
import { preloadSprites } from '../../stage/render';
import { uiSound, unlock } from '../../stage/sound';
import { Stage, type StageHandle } from '../../stage/Stage';
import { changeTime, type LessonState, type StudioMeta } from '../../storage/store';
import { Button } from '../../ui/Button';
import { TopBar } from '../../ui/TopBar';
import { EditorPanes, type EditorPanesHandle } from '../code/EditorPanes';
import { RunButton } from '../code/RunButton';
import { ErrorBubble } from '../code/RunPanel';
import { useLessonState } from '../lesson/useLessonState';
import { Challenges } from './Challenges';
import { cleanTitle, liveDrawing, MAIN, MAX_TITLE, pngName, rowOf } from './drawings';
import { likeness } from './likeness';
import { renderPicture } from './renderPicture';

/** 📐 In place of 💡 Thử thách: the template's name and, on demand, its hint. */
function TemplateHint({ template }: { template: StudioTemplate }) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="flex shrink-0 flex-col gap-2 rounded-[12px] border-2 border-ink bg-paper p-2"
      data-testid="template-card"
    >
      <h3 className="font-display text-lg">
        📐 Vẽ theo mẫu: {template.title} {'⭐'.repeat(template.level)}
      </h3>
      {open ? (
        <p className="rounded-[8px] bg-sun/40 px-2 py-1 text-[15px]" data-testid="template-hint">
          💡 {template.hint}
        </p>
      ) : (
        <button
          type="button"
          className="min-h-11 self-start rounded-full border-2 border-ink bg-sun px-3 text-[15px] font-bold"
          onClick={() => {
            setOpen(true);
          }}
          data-testid="template-show-hint"
        >
          💡 Gợi ý
        </button>
      )}
    </section>
  );
}

/** A short cheer under "Giống mẫu N%" (spec 2026-11-26 §5.2). */
export function cheer(score: number): string {
  if (score >= 90) return '🎉 Giống y như mẫu!';
  if (score >= 60) return 'Gần giống rồi, chỉnh thêm chút nữa!';
  return 'Nhìn mẫu mờ và vẽ tiếp nhé.';
}

/** /studio/:drawingId: one drawing, blocks | Python | ▶ and the 600 × 600 stage. No goals, no grading. */
export function StudioEditor() {
  const { drawingId = '' } = useParams();
  // Keyed on the id: a new drawing in the URL gets a fresh state hook, never the last drawing's code.
  return <StudioDrawing key={drawingId} drawingId={drawingId} />;
}

function StudioDrawing({ drawingId }: { drawingId: string }) {
  const studio = catalog.studio();
  const { state, update, flush } = useLessonState(rowOf(drawingId));
  if (studio === undefined || state === null) return null;
  const live = liveDrawing(state);
  if (live?.studio === undefined)
    return (
      <div className="flex h-dvh flex-col">
        <TopBar title="🎨 Xưởng vẽ" back="/studio" />
        <p className="p-8 text-xl" data-testid="drawing-missing">
          Không tìm thấy tranh này. <Link to="/studio">Về Xưởng vẽ</Link>
        </p>
      </div>
    );
  return (
    <DrawingEditor studio={studio} state={live} meta={live.studio} update={update} flush={flush} />
  );
}

type Update = ReturnType<typeof useLessonState>['update'];

/** The drawing's meta with a new change time (and maybe a new name). */
const touched = (s: LessonState, patch: Partial<StudioMeta> = {}): Partial<LessonState> =>
  s.studio === undefined
    ? {}
    : { studio: { ...s.studio, ...patch, changedAt: changeTime(s.studio.changedAt) } };

function DrawingEditor({
  studio,
  state,
  meta,
  update,
  flush,
}: {
  studio: Studio;
  state: LessonState;
  meta: StudioMeta;
  update: Update;
  flush: () => void;
}) {
  const panes = useRef<EditorPanesHandle>(null);
  const stage = useRef<StageHandle>(null);
  const size = studio.stage;
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [title, setTitle] = useState(meta.title);
  const files = state.files;
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  });
  /** The code of the picture now on the stage, so ⬇️ never saves an old picture. */
  const ranFiles = useRef<string | null>(null);
  /** 📐 the template this drawing traces; a template gone from studio.json makes it a free drawing. */
  const template: StudioTemplate | undefined =
    meta.template === undefined ? undefined : studio.templates.find((t) => t.id === meta.template);
  const [ghostOn, setGhostOn] = useState(template !== undefined);
  const [score, setScore] = useState<number | null>(null);
  const modelRun = useRef<Promise<readonly DrawEvent[]> | null>(null);
  /** The template's picture, run once. */
  const modelEvents = (): Promise<readonly DrawEvent[]> => {
    if (template === undefined) return Promise.resolve([]);
    modelRun.current ??= python
      .run({ [MAIN]: template.code }, MAIN, { stage: size })
      .then((r) => r.events);
    return modelRun.current;
  };

  useEffect(() => {
    void python.warmUp().catch(() => undefined);
  }, []);

  // 📐 the template shows faintly from the start; 👀 hides or shows it again.
  useEffect(() => {
    if (template === undefined) return;
    let live = true;
    if (!ghostOn) {
      stage.current?.ghost(null);
      return;
    }
    void modelEvents()
      .then((events) => {
        if (live) stage.current?.ghost(events);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // modelEvents is stable for this drawing (one template, one stage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostOn, template]);

  const saveCode = useCallback(
    (file: string, text: string) => {
      update((s) => ({ files: { ...s.files, [file]: text }, ...touched(s) }));
    },
    [update],
  );
  const saveWorkspace = useCallback(
    (ws: object) => {
      update({ workspace: ws });
    },
    [update],
  );

  const rename = (text: string) => {
    setTitle(text);
    update((s) => touched(s, { title: cleanTitle(text, s.studio?.title) }));
  };

  /** Bumped by every run, stop and unmount: the answer of an older run must not end the newer one. */
  const runToken = useRef(0);
  useEffect(
    () => () => {
      runToken.current++;
    },
    [],
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

  const run = async () => {
    const mine = ++runToken.current;
    unlock(); // browsers let sound start only from a click
    flush();
    setRunning(true);
    stage.current?.highlight(null);
    try {
      const ran = filesRef.current;
      const r = await python.run(ran, MAIN, { stage: size });
      ranFiles.current = JSON.stringify(ran);
      setResult(r);
      panes.current?.highlight(r.error?.line ?? null, 'error');
      await stage.current?.replay(r.events);
      if (r.error !== undefined) uiSound('oops');
      if (template !== undefined && mine === runToken.current) {
        const [model] = await Promise.all([modelEvents(), preloadSprites()]);
        if (mine === runToken.current)
          setScore(likeness(renderPicture(r.events, size), renderPicture(model, size)));
      }
    } catch (e) {
      // Not ■ Dừng (that bumps the token): Python broke.
      if (mine === runToken.current) {
        setResult(brokenRun(e));
        rewarm();
      }
    } finally {
      if (mine === runToken.current) setRunning(false);
    }
  };

  const stop = () => {
    runToken.current++;
    stage.current?.clear();
    setRunning(false);
    // Only kill the worker when Python is really busy.
    if (python.hasPending) {
      python.stop();
      rewarm();
    }
  };

  /** ⬇️ Tải tranh: the picture at 600 × 600; runs the code first when the stage does not show it yet. */
  const download = async () => {
    const stale = ranFiles.current !== JSON.stringify(filesRef.current);
    if (stale || stage.current?.picture() === null) await run();
    const url = stage.current?.picture();
    if (url === null || url === undefined) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = pngName(cleanTitle(title, meta.title));
    a.click();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden" data-testid="studio-screen">
      <TopBar
        title="🎨 Xưởng vẽ"
        back="/studio"
        right={
          <label className="flex min-w-0 items-center gap-1">
            <span aria-hidden>✏️</span>
            <input
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => {
                rename(e.target.value);
              }}
              onBlur={() => {
                setTitle(cleanTitle(title, meta.title));
              }}
              aria-label="Tên tranh"
              className="min-h-11 w-72 rounded-[10px] border-2 border-white/60 bg-white/15 px-3 text-lg text-white max-[1279px]:w-52"
              data-testid="drawing-title"
            />
          </label>
        }
      />
      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <EditorPanes
          ref={panes}
          toolbox={studio.toolbox}
          files={files}
          main={MAIN}
          workspace={state.workspace}
          onCode={saveCode}
          onWorkspace={saveWorkspace}
          library={{ upto: 'studio', stage: size }}
        />
        <aside className="flex min-h-0 w-[32%] min-w-[340px] shrink-0 flex-col gap-2 max-[1279px]:w-[300px] max-[1279px]:min-w-0">
          <div className="flex gap-2">
            <RunButton running={running} onRun={() => void run()} onStop={stop} />
            <Button
              tone="sun"
              title="Tải tranh về máy (ảnh PNG)"
              onClick={() => void download()}
              disabled={running}
              data-testid="download"
            >
              ⬇️ Tải tranh
            </Button>
            {template !== undefined && (
              <Button
                title="Hiện mờ tranh mẫu để vẽ theo"
                onClick={() => {
                  setGhostOn((on) => !on);
                }}
                aria-pressed={ghostOn}
                className={ghostOn ? 'bg-sun' : ''}
                data-testid="ghost-toggle"
              >
                👀 Mẫu
              </Button>
            )}
          </div>
          <div className="relative min-h-[45%] flex-1 max-[1279px]:aspect-square max-[1279px]:min-h-0 max-[1279px]:flex-none">
            <Stage ref={stage} className="h-full" size={size} coords />
          </div>
          {template !== undefined && score !== null && (
            <p
              className="rounded-[10px] border-2 border-ink bg-paper px-3 py-1 text-lg"
              role="status"
              data-testid="likeness"
            >
              <b className="font-display">Giống mẫu {score}%</b> · {cheer(score)}
            </p>
          )}
          <ErrorBubble result={result} />
          {template === undefined ? (
            <Challenges challenges={studio.challenges} />
          ) : (
            <TemplateHint template={template} />
          )}
        </aside>
      </div>
    </div>
  );
}
