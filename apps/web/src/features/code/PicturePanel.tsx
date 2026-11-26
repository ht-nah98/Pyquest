import type { Asset, StudioPictureGroup } from '@pyquest/content-schema';
import type { StageSize } from '@pyquest/runtime';
import { useState } from 'react';
import { catalog } from '../../content/catalog';
import { isBackground, PIXEL_SCALE, pictureLine } from '../studio/pictures';

const TILE = 56;

/** One library picture, its first frame fitted in a size × size box; pixel art keeps its hard edges. */
function PictureTile({ asset, size = TILE }: { asset: Asset; size?: number }) {
  const k = size / Math.max(asset.width, asset.height);
  return (
    <span
      aria-hidden
      className="block"
      style={{
        width: Math.round(asset.width * k),
        height: Math.round(asset.height * k),
        backgroundImage: `url(${catalog.assetUrl(asset.id) ?? ''})`,
        backgroundSize: `${String(asset.frames * 100)}% 100%`,
        backgroundPosition: '0 0',
        backgroundRepeat: 'no-repeat',
        imageRendering: asset.pixel === true ? 'pixelated' : 'auto',
      }}
    />
  );
}

/**
 * 🖼️ Kho hình (spec 2026-11-26 §5.3): the studio's pictures by shelf. Picking one shows its name, its size and the
 * line of code that draws it; ➕ adds that line to the drawing (a background right after clear(), so it lies under
 * every shape). Opens over the code like 📘 Thư viện.
 */
export function PicturePanel({
  groups,
  stage,
  onAdd,
  onClose,
}: {
  groups: readonly StudioPictureGroup[];
  stage: StageSize;
  onAdd: (line: string, where: 'end' | 'under') => void;
  onClose: () => void;
}) {
  const [shelf, setShelf] = useState(groups[0]?.id ?? '');
  const [picked, setPicked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const group = groups.find((g) => g.id === shelf) ?? groups[0];
  const assets = (group?.pictures ?? [])
    .map((id) => catalog.asset(id))
    .filter((a): a is Asset => a !== undefined);
  const asset = picked === null ? undefined : catalog.asset(picked);
  const line = asset === undefined ? '' : pictureLine(asset, stage);
  const bg = asset !== undefined && isBackground(asset, stage);

  return (
    <aside
      className="absolute inset-y-0 right-0 z-[85] flex w-[min(440px,100%)] flex-col overflow-y-auto border-l-2 border-ink bg-paper"
      data-testid="picture-panel"
    >
      <header className="flex items-center justify-between border-b-2 border-ink px-3 py-2">
        <h3 className="font-display text-lg">🖼️ Kho hình</h3>
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
        Bấm một hình để xem dòng code lấy nó ra. Đổi x, y để dời hình; đổi scale để phóng to.
      </p>
      <div className="flex flex-wrap gap-1.5 px-3 pt-2">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`min-h-11 rounded-full border-2 px-3 text-[15px] ${
              g.id === group?.id ? 'border-ink bg-sun font-bold' : 'border-ink/40 bg-white'
            }`}
            onClick={() => {
              setShelf(g.id);
              setPicked(null);
            }}
            aria-pressed={g.id === group?.id}
            data-testid={`picture-group-${g.id}`}
          >
            {g.title}
          </button>
        ))}
      </div>
      <ul className="flex shrink-0 flex-wrap content-start gap-2 p-3">
        {assets.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              title={a.label}
              className={`flex h-[72px] w-[72px] items-center justify-center rounded-[10px] border-2 bg-white ${
                a.id === picked ? 'border-brand-deep ring-2 ring-sun' : 'border-ink/30'
              }`}
              onClick={() => {
                setPicked(a.id);
                setCopied(false);
              }}
              aria-label={a.label}
              data-testid={`picture-${a.id}`}
            >
              <PictureTile asset={a} />
            </button>
          </li>
        ))}
      </ul>
      {asset !== undefined && (
        <section
          className="mt-auto flex shrink-0 flex-col gap-2 border-t-2 border-ink p-3"
          data-testid="picture-picked"
        >
          <p className="text-[15px]" data-testid="picture-name">
            <b>{asset.label}</b> · cỡ thật {asset.width} × {asset.height}
            {asset.pixel === true &&
              `, scale=${String(PIXEL_SCALE)} thành ${String(asset.width * PIXEL_SCALE)} × ${String(asset.height * PIXEL_SCALE)}`}
            {bg && ' · ảnh nền: đặt ngay sau clear() để nằm dưới mọi hình'}
          </p>
          <pre
            className="overflow-x-auto rounded bg-code-bg px-2 py-1 font-code text-sm text-code-fg"
            data-testid="picture-code"
          >
            {line}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-full border-2 border-ink bg-go px-3 text-[15px] font-bold text-white"
              onClick={() => {
                onAdd(line, bg ? 'under' : 'end');
              }}
              data-testid="picture-add"
            >
              ➕ Thêm vào tranh
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border-2 border-ink bg-white px-3 text-[15px]"
              onClick={() => {
                void navigator.clipboard
                  .writeText(line)
                  .then(() => {
                    setCopied(true);
                  })
                  .catch(() => undefined);
              }}
              data-testid="picture-copy"
            >
              {copied ? '✓ Đã chép' : '📋 Chép'}
            </button>
          </div>
        </section>
      )}
    </aside>
  );
}
