import { python } from '@codemirror/lang-python';
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type PythonPaneHandle = {
  setText(text: string): void;
  /** Light one line (1-based) — the line of the selected block; null clears. */
  highlight(line: number | null, kind: 'select' | 'error'): void;
};

const setMark = StateEffect.define<{ line: number | null; kind: 'select' | 'error' }>();

const marks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    let next = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setMark)) continue;
      const cls = e.value.kind === 'error' ? 'pq-line-error' : 'pq-line-select';
      next = next.update({ filter: (_f, _t, d) => (d.spec as { class?: string }).class !== cls });
      const n = e.value.line;
      if (n !== null && n >= 1 && n <= tr.state.doc.lines) {
        const line = tr.state.doc.line(n);
        next = next.update({ add: [Decoration.line({ class: cls }).range(line.from)] });
      }
    }
    return next;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const theme: Extension = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '17px',
      backgroundColor: 'var(--color-code-bg)',
      color: 'var(--color-code-fg)',
    },
    '.cm-content': { fontFamily: 'var(--font-code)', caretColor: '#ffd43b' },
    '.cm-gutters': { backgroundColor: '#181825', color: '#6c7086', border: 'none' },
    '.cm-activeLine': { backgroundColor: '#ffffff0d' },
    '.cm-activeLineGutter': { backgroundColor: '#ffffff14' },
    '.pq-line-select': { backgroundColor: '#ffd43b2e', outline: '1px solid #ffd43b' },
    '.pq-line-error': { backgroundColor: '#d9534f40', outline: '1px solid #d9534f' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#ffd43b' },
  },
  { dark: true },
);

/** The Python half of the editor (CodeMirror 6). Calls onChange only for the child's own typing. */
export const PythonPane = forwardRef<
  PythonPaneHandle,
  { initial: string; onChange: (text: string) => void; onCursorLine: (line: number) => void }
>(function PythonPane({ initial, onChange, onCursorLine }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const programmatic = useRef(false);
  const cb = useRef({ onChange, onCursorLine });
  useEffect(() => {
    cb.current = { onChange, onCursorLine };
  });

  useEffect(() => {
    if (host.current === null) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial,
        extensions: [
          basicSetup,
          python(),
          theme,
          marks,
          EditorState.tabSize.of(4),
          EditorView.updateListener.of((u) => {
            if (u.docChanged && !programmatic.current) cb.current.onChange(u.state.doc.toString());
            if (u.selectionSet && !programmatic.current) {
              cb.current.onCursorLine(u.state.doc.lineAt(u.state.selection.main.head).number);
            }
          }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // initial is only the first document; later text arrives through setText.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    setText(text) {
      const v = view.current;
      if (v === null || v.state.doc.toString() === text) return;
      programmatic.current = true;
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
      programmatic.current = false;
    },
    highlight(line, kind) {
      view.current?.dispatch({ effects: setMark.of({ line, kind }) });
    },
  }));

  return <div ref={host} className="h-full min-h-0 overflow-hidden" data-testid="python-pane" />;
});
