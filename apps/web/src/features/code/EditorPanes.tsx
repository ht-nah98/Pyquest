import type { StudioPictureGroup } from '@pyquest/content-schema';
import type { StageSize } from '@pyquest/runtime';
import type * as Blockly from 'blockly/core';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { python } from '../../runtime/client';
import { BlockCodeSync, type SyncError } from './blockCodeSync';
import { BlocksPane, type BlocksPaneHandle } from './BlocksPane';
import { FileTabs } from './FileTabs';
import { withLine } from '../studio/pictures';
import { LibraryPanel } from './LibraryPanel';
import { PicturePanel } from './PicturePanel';
import { PythonPane, type PythonPaneHandle } from './PythonPane';

const PARSE_DELAY_MS = 600;

export type EditorPanesHandle = {
  /** Light up a line of the Python pane (null: none). */
  highlight(line: number | null, kind: 'error' | 'select'): void;
  /** Rebuild the blocks from the open file (after Python restarted). */
  reparse(): void;
  /** Add one line to the open file ('end', or 'under': after the first clear()), in code and blocks. */
  insertLine(line: string, where: 'end' | 'under'): void;
};

/**
 * 🧩 Blocks | 🐍 Python, kept in sync both ways (ADR 0003), with 📘 Thư viện and the file tabs. Used by
 * the code screen and the 🎨 Xưởng vẽ, so both behave the same (AGENTS.md §9.11). Below 1280 px (iPad)
 * the blocks sit above the code. The code is the truth: saved blocks are only a first paint.
 */
export const EditorPanes = forwardRef<
  EditorPanesHandle,
  {
    toolbox: string[];
    files: Record<string, string>;
    main: string;
    /** The saved blocks, read once when Blockly is ready. */
    workspace: object | undefined;
    onCode: (file: string, text: string) => void;
    onWorkspace: (ws: object) => void;
    /** 📘 Thư viện: commands met up to this lesson id ('studio': the studio's, undefined: all), on this stage. */
    library: { upto: string | undefined; stage: StageSize };
    /** Next to the 🧩 Khối title. */
    note?: ReactNode;
    /** 🖼️ Kho hình (the studio): its shelves of library pictures; absent: no 🖼️ button. */
    pictures?: { groups: readonly StudioPictureGroup[]; stage: StageSize };
  }
>(function EditorPanes(
  { toolbox, files, main, workspace, onCode, onWorkspace, library, note, pictures },
  ref,
) {
  const blocks = useRef<BlocksPaneHandle>(null);
  const pyPane = useRef<PythonPaneHandle>(null);
  const sync = useRef<BlockCodeSync | null>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const [split, setSplit] = useState(50);
  /** 📘 or 🖼️: one panel over the code at a time. */
  const [panel, setPanel] = useState<'library' | 'pictures' | null>(null);
  // Several files (Bài 16): one is open in both panes at a time.
  const [active, setActive] = useState(main);
  const activeRef = useRef(main);
  const filesRef = useRef(files);
  const workspaceRef = useRef(workspace);
  const cb = useRef({ onCode, onWorkspace });
  useEffect(() => {
    filesRef.current = files;
    workspaceRef.current = workspace;
    cb.current = { onCode, onWorkspace };
  });

  const saveCode = (text: string) => {
    cb.current.onCode(activeRef.current, text);
  };

  /** Rebuild the blocks from this code; a stopped worker just leaves the blocks stale until the next try. */
  const reparse = useCallback((text: string) => {
    void sync.current
      ?.fromCode(text)
      .then((ok) => {
        if (ok && sync.current !== null) cb.current.onWorkspace(sync.current.saveState());
        if (ok) blocks.current?.refreshCalls();
      })
      .catch(() => undefined);
  }, []);

  useImperativeHandle(ref, () => ({
    highlight(line, kind) {
      pyPane.current?.highlight(line, kind);
    },
    reparse() {
      reparse(filesRef.current[activeRef.current] ?? '');
    },
    insertLine(line, where) {
      insertLine(line, where);
    },
  }));

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
      if (workspaceRef.current !== undefined) s.loadState(workspaceRef.current);
      blocks.current?.refreshCalls();
      reparse(filesRef.current[activeRef.current] ?? '');
    },
    // Runs once, when Blockly is injected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** Switch both panes to another file of the project. */
  const openFile = useCallback(
    (f: string) => {
      if (f === activeRef.current) return;
      activeRef.current = f;
      setActive(f);
      sync.current?.markCodeDirty();
      reparse(filesRef.current[f] ?? '');
    },
    [reparse],
  );

  const onBlocksEdit = useCallback(() => {
    const s = sync.current;
    if (s === null || s.applying) return;
    // Blocks behind newer typed code must never overwrite it (review C1).
    if (s.fromBlocks() === null) return;
    cb.current.onWorkspace(s.saveState());
  }, []);

  const onCodeChange = useCallback(
    (text: string) => {
      sync.current?.markCodeDirty();
      saveCode(text);
      clearTimeout(parseTimer.current);
      parseTimer.current = setTimeout(() => {
        reparse(text);
      }, PARSE_DELAY_MS);
    },
    // saveCode and reparse only touch refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** 🖼️ ➕: one more line in the open file; the code pane shows it and the blocks follow, like typing it. */
  const insertLine = useCallback(
    (line: string, where: 'end' | 'under') => {
      const text = withLine(filesRef.current[activeRef.current] ?? '', line, where);
      pyPane.current?.setText(text);
      onCodeChange(text);
    },
    [onCodeChange],
  );

  useEffect(
    () => () => {
      clearTimeout(parseTimer.current);
    },
    [],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-0 max-[1279px]:flex-col">
      <section
        className="flex min-h-0 min-w-0 flex-col rounded-[10px] border-2 border-ink bg-white"
        style={{ flexBasis: `${String(split)}%` }}
      >
        <h2 className="border-b-2 border-ink px-3 py-1 text-base" data-testid="blocks-title">
          🧩 Khối
          {note}
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
            toolbox={toolbox}
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
        className="w-2 shrink-0 cursor-col-resize touch-none max-[1279px]:h-2 max-[1279px]:w-auto max-[1279px]:cursor-row-resize"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          const parent = e.currentTarget.parentElement as HTMLElement;
          const row = parent.getBoundingClientRect();
          const stacked = getComputedStyle(parent).flexDirection === 'column';
          const at = stacked
            ? (e.clientY - row.top) / row.height
            : (e.clientX - row.left) / row.width;
          setSplit(Math.min(75, Math.max(25, at * 100)));
        }}
      />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border-2 border-ink bg-code-bg">
        <h2 className="flex items-center gap-1 border-b-2 border-ink bg-paper px-2 py-1 text-base">
          <span className="px-1">🐍</span>
          <FileTabs files={Object.keys(files)} main={main} active={active} onOpen={openFile} />
          <span className="flex-1" />
          {pictures !== undefined && (
            <button
              type="button"
              className="min-h-9 rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-bold"
              onClick={() => {
                setPanel((p) => (p === 'pictures' ? null : 'pictures'));
              }}
              aria-pressed={panel === 'pictures'}
              data-testid="pictures-toggle"
            >
              🖼️ Kho hình
            </button>
          )}
          <button
            type="button"
            className="min-h-9 rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-bold"
            onClick={() => {
              setPanel((p) => (p === 'library' ? null : 'library'));
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
          {panel === 'library' && (
            <LibraryPanel
              upto={library.upto}
              stage={library.stage}
              onClose={() => {
                setPanel(null);
              }}
            />
          )}
          {panel === 'pictures' && pictures !== undefined && (
            <PicturePanel
              groups={pictures.groups}
              stage={pictures.stage}
              onAdd={insertLine}
              onClose={() => {
                setPanel(null);
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
  );
});
