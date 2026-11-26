import type { StudioTemplate } from '@pyquest/content-schema';
import type { StageSize } from '@pyquest/runtime';
import { useEffect, useRef } from 'react';
import { python } from '../../runtime/client';
import { drawEvent, preloadSprites, resetStage } from '../../stage/render';
import { MAIN } from './drawings';

const THUMB = 160;

/** A small picture of a template, drawn by running its code once. */
function Thumb({ code, stage }: { code: string; stage: StageSize }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void Promise.all([python.run({ [MAIN]: code }, MAIN, { stage }), preloadSprites()])
      .then(([r]) => {
        const c = canvas.current?.getContext('2d');
        if (!live || c === undefined || c === null) return;
        resetStage(c, stage);
        for (const e of r.events) drawEvent(c, e, stage);
        canvas.current?.setAttribute('data-drawn', 'true');
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [code, stage]);
  return (
    <canvas
      ref={canvas}
      width={THUMB}
      height={THUMB}
      className="aspect-square w-full rounded-[8px] border-2 border-ink/30 bg-white"
      aria-hidden
      data-testid="template-thumb"
    />
  );
}

/** 📐 Vẽ theo mẫu: the templates as cards (picture, name, ⭐ how hard). Picking one starts a new drawing. */
export function TemplatePicker({
  templates,
  stage,
  onPick,
  disabled,
}: {
  templates: readonly StudioTemplate[];
  stage: StageSize;
  onPick: (t: StudioTemplate) => void;
  disabled: boolean;
}) {
  return (
    <section className="flex flex-col gap-3" data-testid="template-picker">
      <p className="text-lg text-ink-soft">
        Chọn một tranh mẫu. Tranh mẫu hiện mờ trên sân, em vẽ đè lên cho giống nhé!
      </p>
      <ul className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3">
        {templates.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="flex w-full flex-col gap-2 h-full rounded-[12px] border-2 border-ink bg-white p-2 text-left hover:bg-brand-soft disabled:opacity-50"
              onClick={() => {
                onPick(t);
              }}
              disabled={disabled}
              data-testid={`template-${t.id}`}
            >
              <Thumb code={t.code} stage={stage} />
              <span className="font-display text-base leading-tight font-extrabold">{t.title}</span>
              <span aria-label={`Độ khó ${String(t.level)} trên 3`}>{'⭐'.repeat(t.level)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
