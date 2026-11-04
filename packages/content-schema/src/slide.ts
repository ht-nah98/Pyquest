import { z } from 'zod';

export const WidgetSchema = z.object({
  kind: z.enum(['sampleGame', 'gravity', 'roadmapBuilder', 'grid']),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const QuizSchema = z
  .object({
    question: z.string().min(1).max(160),
    choices: z.array(z.string().min(1).max(80)).min(2).max(5),
    answer: z.int().nonnegative(),
    explain: z.string().min(1).max(200),
  })
  .refine((q) => q.answer < q.choices.length, {
    message: 'quiz.answer must index into choices',
    path: ['answer'],
  });

/** One screen of a step. Text is short on purpose: one idea per slide (AGENTS.md §3 rule 7). */
export const SlideSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(60).optional(),
  text: z.string().max(280).optional(),
  image: z.string().optional(),
  widget: WidgetSchema.optional(),
  quiz: QuizSchema.optional(),
  coachNotes: z.string().max(1000).optional(),
});

export type Slide = z.infer<typeof SlideSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
