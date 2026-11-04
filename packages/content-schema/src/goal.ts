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
  }),
  z.object({
    ...base,
    kind: z.literal('varEquals'),
    name: z.string().min(1),
    value: z.union([z.number(), z.string()]),
  }),
]);

export type Goal = z.infer<typeof GoalSchema>;
