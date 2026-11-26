import { z } from 'zod';

/** One "💡 Thử thách" idea in the drawing studio: no goals, no grading, just something to try. */
export const StudioChallengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(40),
  task: z.string().min(1).max(200),
  hint: z.string().min(1).max(120),
});

/** One "📐 Vẽ theo mẫu" picture: its code draws the faint template the child traces (spec 2026-11-26 §5.2). */
export const StudioTemplateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(40),
  /** ⭐ how hard: 1 easy, 3 hard. */
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  code: z.string().min(1),
  hint: z.string().min(1).max(120),
});

/** One shelf of the 🖼️ Kho hình: library picture ids under a Vietnamese title (spec 2026-11-26 §5.3). */
export const StudioPictureGroupSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(30),
  pictures: z.array(z.string().min(1)).min(1),
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
    templates: z.array(StudioTemplateSchema).default([]),
    pictureGroups: z.array(StudioPictureGroupSchema).default([]),
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
    const tids = s.templates.map((t) => t.id);
    const tdup = tids.find((id, i) => tids.indexOf(id) !== i);
    if (tdup !== undefined)
      ctx.addIssue({
        code: 'custom',
        message: `duplicate template id "${tdup}"`,
        path: ['templates'],
      });
    const pics = s.pictureGroups.flatMap((g) => g.pictures);
    const pdup = pics.find((id, i) => pics.indexOf(id) !== i);
    if (pdup !== undefined)
      ctx.addIssue({
        code: 'custom',
        message: `duplicate picture "${pdup}"`,
        path: ['pictureGroups'],
      });
  });

export type StudioChallenge = z.infer<typeof StudioChallengeSchema>;
export type StudioPictureGroup = z.infer<typeof StudioPictureGroupSchema>;
export type StudioTemplate = z.infer<typeof StudioTemplateSchema>;
export type Studio = z.infer<typeof StudioSchema>;
