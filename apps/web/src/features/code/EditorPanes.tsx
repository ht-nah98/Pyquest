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
import { LibraryPanel } from './LibraryPanel';
import { PythonPane, type PythonPaneHandle } from './PythonPane';

const PARSE_DELAY_MS = 600;

export type EditorPanesHandle = {
  /** Light up a line of the Python pane (null: none). */
  highlight(line: number | null, kind: 'error' | 'select'): void;
  /** Rebuild the blocks from the open file (after Python restarted). */
  reparse(): void;
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
    /** 📘 Thư viện: commands met up to this lesson order (all when undefined), on this stage. */
    library: { uptoOrder: number | 'studio' | undefined; stage: StageSize };
    /** Next to the 🧩 Khối title. */
    note?: ReactNode;
  }
>(function EditorPanes(
  { toolbox, files, main, workspace, onCode, onWorkspace, library, note },
  ref,
) {
  const blocks = useRef<BlocksPaneHandle>(null);
  const pyPane = useRef<PythonPaneHandle>(null);
  const sync = useRef<BlockCodeSync | null>(null);
  const parseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [syncError, setSyncError] = useState<SyncError | null>(null);
  const [split, setSplit] = useState(50);
  const [libraryOpen, setLibraryOpen] = useState(false);
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
          <button
            type="button"
            className="min-h-9 rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-bold"
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
              uptoOrder={library.uptoOrder}
              stage={library.stage}
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
  );
});
