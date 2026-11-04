import { z } from 'zod';

export const CourseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(40),
    summary: z.string().min(1).max(200),
    lessonIds: z.array(z.string().min(1)).min(1),
    roadmap: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1).max(30),
        icon: z.string().optional(),
      }),
    ),
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
