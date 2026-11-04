import { catalog } from '../../../content/catalog';

/**
 * Bước Chuẩn bị (Bài 3): pick a picture from the library and see where it lives in the project —
 * a folder tree and the path the code will use. Teaches file, folder and path before the code.
 */
export function AssetPicker({
  group,
  picked,
  onPick,
}: {
  group: string;
  picked: string | undefined;
  onPick: (id: string) => void;
}) {
  const options = catalog.assets().filter((a) => a.group === group);
  const chosen = options.find((a) => a.id === picked);
  const path = chosen === undefined ? undefined : `images/${chosen.id}.png`;
  return (
    <div
      className="grid h-full w-full grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4"
      data-testid="asset-picker"
    >
      <ul className="grid content-start gap-3 overflow-y-auto sm:grid-cols-2">
        {options.map((a) => {
          const url = catalog.assetUrl(a.id);
          const on = a.id === picked;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(a.id);
                }}
                data-testid={`pick-${a.id}`}
                className={`flex w-full flex-col items-center gap-1 rounded-[12px] border-2 p-3 ${on ? 'border-ink bg-sun' : 'border-ink/30 bg-white hover:border-ink'}`}
              >
                <span
                  className="block h-16 w-24 bg-contain bg-left bg-no-repeat"
                  style={{
                    backgroundImage: url === undefined ? undefined : `url(${url})`,
                    backgroundSize: `${String(a.frames * 100)}% 100%`,
                  }}
                />
                <span className="font-display font-bold">{a.label ?? a.id}</span>
                <code className="text-xs text-ink-soft">{a.id}.png</code>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-3 rounded-[12px] bg-code-bg p-4 font-code text-code-fg">
        <p className="font-body text-sm text-white/70">Dự án của em</p>
        <pre className="text-[15px] leading-7">
          {'📁 du-an-cua-em/\n'}
          {'   📄 main.py\n'}
          {'   📁 images/\n'}
          {options.map((a) => `      ${a.id === picked ? '👉' : '🖼️'} ${a.id}.png\n`).join('')}
        </pre>
        <p className="font-body text-sm text-white/70">Đường dẫn tới ảnh em chọn:</p>
        <p className="rounded bg-black/40 px-2 py-1 text-lg text-sun" data-testid="picked-path">
          {path ?? '(chưa chọn)'}
        </p>
      </div>
    </div>
  );
}
