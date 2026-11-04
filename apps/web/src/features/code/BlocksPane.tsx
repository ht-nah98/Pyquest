import { lineMap, registerBlocks, toolboxFor } from '@pyquest/blocks';
import * as Blockly from 'blockly/core';
import * as vi from 'blockly/msg/vi';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type BlocksPaneHandle = {
  workspace(): Blockly.WorkspaceSvg | null;
  /** Glow the block whose code starts on or before this line. */
  highlightLine(line: number): void;
};

let localeSet = false;

/** The block half of the editor. Reports block edits and the line of the selected block. */
export const BlocksPane = forwardRef<
  BlocksPaneHandle,
  {
    toolbox: string[];
    onEdit: () => void;
    onSelectLine: (line: number | null) => void;
    onReady: (ws: Blockly.WorkspaceSvg) => void;
  }
>(function BlocksPane({ toolbox, onEdit, onSelectLine, onReady }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const ws = useRef<Blockly.WorkspaceSvg | null>(null);
  const cb = useRef({ onEdit, onSelectLine, onReady });
  cb.current = { onEdit, onSelectLine, onReady };

  useEffect(() => {
    if (host.current === null) return;
    registerBlocks();
    if (!localeSet) {
      Blockly.setLocale(vi as unknown as Record<string, string>);
      localeSet = true;
    }
    const w = Blockly.inject(host.current, {
      toolbox: toolboxFor(toolbox),
      media: '/blockly-media/',
      renderer: 'zelos',
      trashcan: true,
      zoom: { controls: true, wheel: false, startScale: 0.9 },
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
    });
    ws.current = w;
    w.addChangeListener((e) => {
      if (e instanceof Blockly.Events.Selected) {
        const id = e.newElementId;
        cb.current.onSelectLine(id === undefined ? null : (lineMap(w).get(id) ?? null));
        return;
      }
      if (e.isUiEvent || e instanceof Blockly.Events.FinishedLoading) return;
      cb.current.onEdit();
    });
    cb.current.onReady(w);
    const resize = new ResizeObserver(() => {
      Blockly.svgResize(w);
    });
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      w.dispose();
      ws.current = null;
    };
    // The toolbox of a lesson never changes while the screen is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    workspace: () => ws.current,
    highlightLine(line) {
      const w = ws.current;
      if (w === null) return;
      let best: string | null = null;
      let bestLine = 0;
      for (const [id, l] of lineMap(w)) {
        if (l <= line && l >= bestLine) {
          best = id;
          bestLine = l;
        }
      }
      w.highlightBlock(best);
    },
  }));

  return <div ref={host} className="h-full min-h-0 w-full" data-testid="blocks-pane" />;
});
