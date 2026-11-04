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
    /** A picture of the group other than the group's first one, e.g. bird-rong for "bird" (Bài 5). */
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
  // Drawing from the smallest pieces (spec 2026-11-04-from-smallest-pieces).
  /** At least min boxes in one picture; a box covering the whole stage (a background) does not count. */
  z.object({
    ...base,
    kind: z.literal('drewRects'),
    min: z.int().positive(),
    /** One of the boxes has its top-left corner exactly here (Bài 1–2). */
    at: z.tuple([z.number(), z.number()]).optional(),
  }),
  /** The child's own function ran at least min times; distinct: with different arguments. */
  z.object({
    ...base,
    kind: z.literal('called'),
    name: z.string().min(1),
    min: z.int().positive().optional(),
    distinct: z.boolean().optional(),
  }),
  /** Every call of name drew the same picture, only moved: its pieces are placed from x and y. */
  z.object({ ...base, kind: z.literal('sameShape'), name: z.string().min(1) }),
  /**
   * Run again with "var = n" changed to n + by: every piece moves by exactly that much on axis.
   * Catches a bird typed with fixed numbers that only looks right.
   */
  z.object({
    ...base,
    kind: z.literal('shifts'),
    var: z.string().min(1),
    by: z.number(),
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
