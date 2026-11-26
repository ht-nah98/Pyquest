/**
 * 🔑 Đáp án (spec 2026-11-26 lesson-likeness §3): the solution, read only, beside the child's code. No copy
 * button: the child compares, fixes their own code and runs it.
 */
export function AnswerPanel({
  files,
  main,
  onClose,
}: {
  files: Readonly<Record<string, string>>;
  main: string;
  onClose: () => void;
}) {
  const names = [main, ...Object.keys(files).filter((f) => f !== main)].filter(
    (f) => files[f] !== undefined,
  );
  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[12px] border-2 border-ink bg-paper p-3"
      data-testid="answer-panel"
    >
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg text-brand-deep">🔑 Đáp án</h2>
        <button
          type="button"
          className="min-h-9 rounded-full border-2 border-ink bg-white px-3 text-sm font-bold"
          onClick={onClose}
          aria-label="Đóng đáp án"
          data-testid="answer-close"
        >
          ✕ Đóng
        </button>
      </header>
      <p className="text-[15px] leading-snug text-ink-soft">
        So với code của em, tìm chỗ khác nhau rồi tự sửa và ▶ Chạy lại nhé.
      </p>
      {names.map((name) => (
        <div key={name} className="flex flex-col gap-1">
          {names.length > 1 && <h3 className="font-code text-sm font-bold">{name}</h3>}
          <pre
            className="rounded bg-code-bg px-2 py-1 font-code text-sm whitespace-pre-wrap text-code-fg"
            data-testid="answer-code"
          >
            {files[name]}
          </pre>
        </div>
      ))}
    </section>
  );
}
