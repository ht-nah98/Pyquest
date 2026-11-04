import { librarySource } from '@pyquest/runtime';
import { catalog } from '../../content/catalog';

/**
 * 📘 Thư viện: every pyquest command the child has met so far: what it does, why the library has it,
 * an example, and "Xem bên trong" — its real code, because a library is just a Python file someone wrote.
 */
export function LibraryPanel({
  uptoOrder,
  onClose,
}: {
  uptoOrder: number | undefined;
  onClose: () => void;
}) {
  const entries = catalog.library(uptoOrder);
  return (
    <aside
      className="absolute inset-y-0 right-0 z-[85] flex w-[min(440px,100%)] flex-col border-l-2 border-ink bg-paper"
      data-testid="library-panel"
    >
      <header className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <h3 className="font-display text-lg">📘 Thư viện pyquest</h3>
        <button
          type="button"
          className="rounded-full px-2 text-xl"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </header>
      <p className="px-3 pt-2 text-sm text-ink-soft">
        Mảnh gốc làm sẵn: những việc Python thường không tự làm được (tô màn hình, đọc phím, mở file
        ảnh). Dòng <code className="rounded bg-white px-1">from pyquest import *</code> ở đầu file
        mở hộp này ra. Còn <code>draw_bird</code>, <code>draw_pipe</code>… là em tự viết.
      </p>
      <ul className="flex-1 space-y-3 overflow-y-auto p-3">
        {entries.map((e) => (
          <li key={e.name} className="rounded-[10px] border border-ink/20 bg-white p-3">
            <p className="font-code font-bold text-brand-deep">{e.signature}</p>
            <p className="mt-1 text-[15px]">{e.vi}</p>
            <p className="mt-1 text-[15px]" data-testid="library-why">
              <b>Vì sao có?</b> {e.why}
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-code-bg px-2 py-1 font-code text-sm text-code-fg">
              {e.example}
            </pre>
            {librarySource(e.name) !== undefined && (
              <details className="mt-2" data-testid="library-inside">
                <summary className="cursor-pointer text-sm font-bold">🔍 Xem bên trong</summary>
                <p className="mt-1 text-sm text-ink-soft">
                  Đây là code thật trong file <code>pyquest.py</code>.
                  {e.inside === undefined ? '' : ` ${e.inside}`}
                </p>
                <pre className="mt-1 overflow-x-auto rounded bg-code-bg px-2 py-1 font-code text-xs text-code-fg">
                  {librarySource(e.name)}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
