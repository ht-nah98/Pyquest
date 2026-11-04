import type { OpenLesson, StepKind } from '@pyquest/content-schema';
import type { FlatSlide } from './flatten';
import { STEP_ICON, STEP_LABEL } from './flatten';

/** The lesson rhythm, always visible: Hiểu · Thiết kế · Chuẩn bị · Code · Chơi thử (pedagogy/lesson-rhythm.md). */
export function StepBar({
  lesson,
  current,
  done,
  big = false,
}: {
  lesson: OpenLesson;
  current: number;
  done: readonly StepKind[];
  big?: boolean;
}) {
  return (
    <ol
      className={`flex flex-wrap items-center gap-1 ${big ? 'text-xl' : 'text-base'}`}
      data-testid="step-bar"
    >
      {lesson.steps.map((s, i) => (
        <li key={s.kind} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink-soft/50">›</span>}
          <span
            data-current={i === current}
            className={`rounded-full border-2 px-3 py-1 font-display font-bold ${i === current ? 'border-ink bg-sun' : done.includes(s.kind) || i < current ? 'border-go/60 bg-white text-go-deep' : 'border-transparent text-ink-soft'}`}
          >
            {done.includes(s.kind) ? '✓' : STEP_ICON[s.kind]} {STEP_LABEL[s.kind]}
          </span>
        </li>
      ))}
    </ol>
  );
}

const STEP_COLOR: Record<StepKind, string> = {
  understand: 'bg-sun',
  design: 'bg-[#f4a261]',
  prepare: 'bg-[#8ecae6]',
  code: 'bg-brand',
  playtest: 'bg-go',
};

/** One pill per slide, coloured by step. The coach can click any; a child can go back to seen ones. */
export function SlideProgress({
  flat,
  index,
  reachable,
  onJump,
}: {
  flat: readonly FlatSlide[];
  index: number;
  reachable: (i: number) => boolean;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1" aria-label="Tiến độ bài">
      {flat.map((f) => {
        const here = f.index === index;
        const ok = reachable(f.index);
        return (
          <li key={f.slide.id}>
            <button
              type="button"
              disabled={!ok}
              title={f.slide.title ?? f.slide.quiz?.question ?? STEP_LABEL[f.kind]}
              onClick={() => {
                onJump(f.index);
              }}
              className={`block h-3 rounded-full border border-ink/40 transition-all ${here ? 'w-8 border-ink' : 'w-3'} ${f.index <= index || here ? STEP_COLOR[f.kind] : 'bg-white'} ${ok ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
            />
          </li>
        );
      })}
    </ol>
  );
}
