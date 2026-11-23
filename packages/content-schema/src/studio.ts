import { z } from 'zod';

/** One "💡 Thử thách" idea in the drawing studio: no goals, no grading, just something to try. */
export const StudioChallengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(40),
  task: z.string().min(1).max(200),
  hint: z.string().min(1).max(120),
});

/** content/studio/studio.json: the free drawing studio (🎨 Xưởng vẽ, spec 2026-11-23 §6). */
export const StudioSchema = z
  .object({
    stage: z.object({
      width: z.number().int().min(100).max(1200),
      height: z.number().int().min(100).max(1200),
    }),
    /** The Python of a new drawing. */
    starter: z.string().min(1),
    /** Block ids offered in the studio. */
    toolbox: z.array(z.string().min(1)).min(1),
    challenges: z.array(StudioChallengeSchema),
  })
  .superRefine((s, ctx) => {
    const ids = s.challenges.map((c) => c.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup !== undefined)
      ctx.addIssue({
        code: 'custom',
        message: `duplicate challenge id "${dup}"`,
        path: ['challenges'],
      });
  });

export type StudioChallenge = z.infer<typeof StudioChallengeSchema>;
export type Studio = z.infer<typeof StudioSchema>;
