import type { OpenLesson, Slide, StepKind } from '@pyquest/content-schema';

export type FlatSlide = { stepIndex: number; kind: StepKind; slide: Slide; index: number };

export function flatten(lesson: OpenLesson): FlatSlide[] {
  const out: FlatSlide[] = [];
  lesson.steps.forEach((step, stepIndex) => {
    for (const slide of step.slides)
      out.push({ stepIndex, kind: step.kind, slide, index: out.length });
  });
  return out;
}

export const STEP_LABEL: Record<StepKind, string> = {
  understand: 'Hiểu',
  design: 'Thiết kế',
  prepare: 'Chuẩn bị',
  code: 'Code',
  playtest: 'Chơi thử',
};

export const STEP_ICON: Record<StepKind, string> = {
  understand: '💡',
  design: '✏️',
  prepare: '🧰',
  code: '🐍',
  playtest: '🎮',
};
