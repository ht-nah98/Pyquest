import type { OpenLesson, StepKind } from '@pyquest/content-schema';
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
    <ol className={`flex flex-wrap gap-2 ${big ? 'text-xl' : 'text-sm'}`} data-testid="step-bar">
      {lesson.steps.map((s, i) => (
        <li
          key={s.kind}
          data-current={i === current}
          className={`rounded-full border-2 px-3 py-1 ${i === current ? 'border-ink bg-sun' : done.includes(s.kind) ? 'border-go bg-white' : 'border-ink-soft/40 text-ink-soft'}`}
        >
          {done.includes(s.kind) ? '✓' : STEP_ICON[s.kind]} {STEP_LABEL[s.kind]}
        </li>
      ))}
    </ol>
  );
}
