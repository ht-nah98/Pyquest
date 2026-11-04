import { z } from 'zod';

/** One command of the pyquest library, for the 📘 Thư viện panel (content/reference/pyquest.json). */
export const LibraryEntrySchema = z.object({
  name: z.string().min(1),
  signature: z.string().min(1).max(80),
  vi: z.string().min(1).max(240),
  /** Why the library has it: what would be too slow or impossible to do by hand (spec: smallest pieces). */
  why: z.string().min(1).max(240),
  /** One sentence for the odd parts of its real code shown by "Xem bên trong", e.g. what _emit does. */
  inside: z.string().min(1).max(200).optional(),
  example: z.string().min(1).max(200),
  /** The lesson that first teaches it; the panel lists only what the child has met so far. */
  lesson: z.string().min(1),
});

export const LibraryRefSchema = z.object({ entries: z.array(LibraryEntrySchema).min(1) });

export type LibraryEntry = z.infer<typeof LibraryEntrySchema>;
export type LibraryRef = z.infer<typeof LibraryRefSchema>;
