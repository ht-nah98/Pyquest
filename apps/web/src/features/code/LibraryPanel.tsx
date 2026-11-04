import { catalog } from '../../content/catalog';

/**
 * 📘 Thư viện: every pyquest command the child has met so far, with Vietnamese words and an example.
 * It answers "where does draw_bird come from?" — from the library opened by `from pyquest import *`.
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
        Các lệnh làm sẵn. Dòng <code className="rounded bg-white px-1">from pyquest import *</code>{' '}
        ở đầu file mở hộp lệnh này ra cho em dùng.
      </p>
      <ul className="flex-1 space-y-3 overflow-y-auto p-3">
        {entries.map((e) => (
          <li key={e.name} className="rounded-[10px] border border-ink/20 bg-white p-3">
            <p className="font-code font-bold text-brand-deep">{e.signature}</p>
            <p className="mt-1 text-[15px]">{e.vi}</p>
            <pre className="mt-2 overflow-x-auto rounded bg-code-bg px-2 py-1 font-code text-sm text-code-fg">
              {e.example}
            </pre>
          </li>
        ))}
      </ul>
    </aside>
  );
}
