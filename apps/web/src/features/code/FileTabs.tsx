/** One tab per file of the project (Bài 16); a one-file project just shows its name. */
export function FileTabs({
  files,
  main,
  active,
  onOpen,
}: {
  files: readonly string[];
  main: string;
  active: string;
  onOpen: (file: string) => void;
}) {
  if (files.length <= 1) return <span>Python · {main}</span>;
  return (
    <>
      {files.map((f) => (
        <button
          key={f}
          type="button"
          data-testid={`file-tab-${f}`}
          className={`rounded-t-[8px] px-3 py-0.5 font-code text-sm ${f === active ? 'bg-code-bg text-code-fg' : 'text-ink-soft hover:bg-brand-soft'}`}
          onClick={() => {
            onOpen(f);
          }}
        >
          📄 {f}
        </button>
      ))}
    </>
  );
}
