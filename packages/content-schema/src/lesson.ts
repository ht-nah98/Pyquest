import { z } from 'zod';
import { GoalSchema } from './goal';
import { SlideSchema } from './slide';

export const STEP_KINDS = ['understand', 'design', 'prepare', 'code', 'playtest'] as const;
export const StepKindSchema = z.enum(STEP_KINDS);
export type StepKind = z.infer<typeof StepKindSchema>;

/** Every lesson must teach the why before the code, and end with playing it (pedagogy/lesson-rhythm.md). */
export const REQUIRED_STEPS: readonly StepKind[] = ['understand', 'playtest'];

const FilesSchema = z.record(z.string().min(1), z.string());

/**
 * One exercise of a lesson's code step. A lesson has several, easiest first (spec foundations-first §4).
 * input: 'blocks' = drag blocks or type; 'typing' = type Python only, the blocks just mirror the code.
 */
export const ExerciseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(60),
    task: z.string().min(1).max(280),
    input: z.enum(['blocks', 'typing']),
    starter: FilesSchema,
    main: z.string().min(1),
    toolbox: z.array(z.string().min(1)),
    mode: z.enum(['script', 'game']),
    goals: z.array(GoalSchema).min(1),
    solution: FilesSchema,
    /** Game mode: how the automatic test plays it (frames, and frames where the screen is tapped). */
    test: z
      .object({ frames: z.int().positive().max(600), taps: z.array(z.int().nonnegative()) })
      .optional(),
    /** Numbered "Các bước" shown in the task card: the detailed how-to of this code step. */
    walkthrough: z.array(z.string().min(1).max(200)).max(8).optional(),
    /** Written but not yet approved by the coach: only the coach sees it (AGENTS.md §6). */
    draft: z.boolean().optional(),
    /** Revealed one at a time by 💡 Gợi ý; the last one may nearly give the answer. */
    hints: z.array(z.string().min(1).max(160)).max(5).optional(),
  })
  .superRefine((code, ctx) => {
    if (!(code.main in code.starter)) {
      ctx.addIssue({
        code: 'custom',
        message: `code.main "${code.main}" is not in starter`,
        path: ['main'],
      });
    }
    if (!(code.main in code.solution)) {
      ctx.addIssue({
        code: 'custom',
        message: `code.main "${code.main}" is not in solution`,
        path: ['main'],
      });
    }
  });

const StepSchema = z.object({ kind: StepKindSchema, slides: z.array(SlideSchema).min(1) });

const OpenLessonSchema = z
  .object({
    id: z.string().min(1),
    courseId: z.string().min(1),
    order: z.int().nonnegative(),
    title: z.string().min(1).max(60),
    hidden: z.literal(false).optional(),
    /** Written but not yet approved by the coach: only the coach sees it (AGENTS.md §9.5). */
    draft: z.boolean().optional(),
    /** One line under the title on the course map. */
    summary: z.string().min(1).max(120).optional(),
    steps: z.array(StepSchema).min(1),
    exercises: z.array(ExerciseSchema).min(1).optional(),
    unlocksRoadmap: z.array(z.string()),
    docsUnlocked: z.array(z.string()),
  })
  .superRefine((lesson, ctx) => {
    const kinds = lesson.steps.map((s) => s.kind);
    for (const required of REQUIRED_STEPS) {
      if (!kinds.includes(required)) {
        ctx.addIssue({
          code: 'custom',
          message: `lesson needs a "${required}" step`,
          path: ['steps'],
        });
      }
    }
    const order = kinds.map((k) => STEP_KINDS.indexOf(k));
    if (order.some((v, i) => i > 0 && v <= (order[i - 1] ?? -1))) {
      ctx.addIssue({
        code: 'custom',
        message: 'steps must follow understand → design → prepare → code → playtest, once each',
        path: ['steps'],
      });
    }
    if (kinds.includes('code') !== (lesson.exercises !== undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'a "code" step and its exercises go together',
        path: ['exercises'],
      });
    }
    const exerciseIds = new Set<string>();
    for (const e of lesson.exercises ?? []) {
      if (exerciseIds.has(e.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate exercise id "${e.id}"`,
          path: ['exercises'],
        });
      }
      exerciseIds.add(e.id);
    }
    const seen = new Set<string>();
    for (const step of lesson.steps) {
      for (const slide of step.slides) {
        if (seen.has(slide.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `duplicate slide id "${slide.id}"`,
            path: ['steps'],
          });
        }
        seen.add(slide.id);
      }
    }
  });

/** A lesson that exists on the roadmap but is not ready: children see its title, cannot open it. */
const HiddenLessonSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  order: z.int().nonnegative(),
  title: z.string().min(1).max(60),
  hidden: z.literal(true),
});

export const LessonSchema = z.union([HiddenLessonSchema, OpenLessonSchema]);

export type OpenLesson = z.infer<typeof OpenLessonSchema>;
export type HiddenLesson = z.infer<typeof HiddenLessonSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;

export function isOpenLesson(lesson: Lesson): lesson is OpenLesson {
  return lesson.hidden !== true;
}

/** Parses a lesson; throws a ZodError whose message names the failing path. */
export function parseLesson(json: unknown): Lesson {
  const hidden = (json as { hidden?: unknown } | null)?.hidden === true;
  return hidden ? HiddenLessonSchema.parse(json) : OpenLessonSchema.parse(json);
}
