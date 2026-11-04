import { z } from 'zod';

const base = { id: z.string().min(1), label: z.string().min(1).max(60) };

export const GoalSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('noError') }),
  z.object({ ...base, kind: z.literal('printed'), text: z.string() }),
  z.object({
    ...base,
    kind: z.literal('drew'),
    sprite: z.string().min(1),
    at: z.tuple([z.number(), z.number()]).optional(),
    tolerance: z.number().nonnegative().optional(),
    /** The sprite must be drawn with a picture chosen by use_sprite (Bài 3). */
    customImage: z.boolean().optional(),
  }),
  z.object({
    ...base,
    kind: z.literal('varEquals'),
    name: z.string().min(1),
    value: z.union([z.number(), z.string(), z.boolean()]),
  }),
  // Judged over the frames of a run (game mode: the scripted test run in LessonCode.test).
  z.object({
    ...base,
    kind: z.literal('moves'),
    sprite: z.string().min(1),
    axis: z.enum(['x', 'y']),
    dir: z.union([z.literal(1), z.literal(-1)]),
  }),
  z.object({
    ...base,
    kind: z.literal('staysWithin'),
    sprite: z.string().min(1),
    axis: z.enum(['x', 'y']),
    min: z.number().optional(),
    max: z.number().optional(),
    /** Only frames from..to (inclusive); e.g. the ready screen before the first tap. */
    frames: z.tuple([z.int().nonnegative(), z.int().nonnegative()]).optional(),
  }),
  z.object({
    ...base,
    kind: z.literal('distinctCount'),
    sprite: z.string().min(1),
    axis: z.enum(['x', 'y']),
    min: z.int().positive(),
  }),
  z.object({ ...base, kind: z.literal('drewText'), text: z.string() }),
  z.object({
    ...base,
    kind: z.literal('risesAfterTap'),
    sprite: z.string().min(1),
    taps: z.array(z.int().nonnegative()).min(1),
  }),
  z.object({
    ...base,
    kind: z.literal('speedsUp'),
    sprite: z.string().min(1),
    axis: z.enum(['x', 'y']),
  }),
  z.object({
    ...base,
    kind: z.literal('drewCount'),
    sprite: z.string().min(1),
    min: z.int().positive(),
  }),
]);

export type Goal = z.infer<typeof GoalSchema>;
