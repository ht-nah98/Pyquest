import { z } from 'zod';

export const AssetSchema = z.object({
  id: z.string().min(1),
  group: z.enum(['bird', 'pipe', 'background', 'ground', 'ui']),
  file: z.string().min(1),
  width: z.int().positive(),
  height: z.int().positive(),
  frames: z.int().positive(),
  credit: z.enum(['ai-generated', 'placeholder']),
  label: z.string().max(30).optional(),
});

export const AssetManifestSchema = z.object({ assets: z.array(AssetSchema) });

export type Asset = z.infer<typeof AssetSchema>;
export type AssetManifest = z.infer<typeof AssetManifestSchema>;
