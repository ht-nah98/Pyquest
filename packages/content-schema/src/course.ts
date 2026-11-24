import { z } from 'zod';

export const CourseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(40),
    summary: z.string().min(1).max(200),
    /** The whole course is not approved yet: only the coach sees its card and opens its lessons (ADR 0011). */
    draft: z.boolean().optional(),
    /** The course taught before this one: 📘 Thư viện counts all its commands as known (ADR 0011). */
    after: z.string().min(1).optional(),
    /** How the course's game is played: next to the sample game and under the fullscreen play. */
    howToPlay: z.string().min(1).max(160).optional(),
    lessonIds: z.array(z.string().min(1)).min(1),
    roadmap: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1).max(30),
        icon: z.string().optional(),
      }),
    ),
    /** The stage size of every lesson in this course; absent = 400 × 600 (Bay Qua Khe). ADR 0009. */
    stage: z
      .object({
        width: z.number().int().min(100).max(1200),
        height: z.number().int().min(100).max(1200),
      })
      .optional(),
    /** The sample game's own stage, when it is not the lessons' one (a wide screen to play on). */
    sampleStage: z
      .object({
        width: z.number().int().min(100).max(1600),
        height: z.number().int().min(100).max(1200),
      })
      .optional(),
    /** Sections of the course map (A. Bức tranh toàn cảnh, B. Dựng sân khấu…). */
    parts: z
      .array(
        z.object({
          title: z.string().min(1).max(40),
          lessonIds: z.array(z.string().min(1)).min(1),
        }),
      )
      .optional(),
  })
  .superRefine((c, ctx) => {
    if (c.parts === undefined) return;
    const flat = c.parts.flatMap((p) => p.lessonIds);
    if (flat.join(',') !== c.lessonIds.join(',')) {
      ctx.addIssue({
        code: 'custom',
        message: 'parts must list every lesson of lessonIds, in order',
        path: ['parts'],
      });
    }
  });

export type Course = z.infer<typeof CourseSchema>;
