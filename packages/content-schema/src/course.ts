import { z } from 'zod';

export const CourseSchema = z.object({
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
});

export type Course = z.infer<typeof CourseSchema>;
