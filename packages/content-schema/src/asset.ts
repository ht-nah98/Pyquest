import { z } from 'zod';

export const AssetSchema = z.object({
  id: z.string().min(1),
  group: z.enum([
    'bird',
    'pipe',
    'background',
    // 🎨 Xưởng vẽ backgrounds, 600 × 600 (spec 2026-11-26 §5.4).
    'bg',
    'ground',
    'ui',
    // The roguelite's pixel art (tools/assets/pixel.py).
    'hero',
    'mob',
    'item',
    'shot',
    'skill',
    'deco',
    'fx',
  ]),
  file: z.string().min(1),
  width: z.int().positive(),
  height: z.int().positive(),
  frames: z.int().positive(),
  /** Pixel art: drawn without smoothing, so it stays crisp when scaled (ADR 0010). */
  pixel: z.literal(true).optional(),
  /** pixelfx-mit: prerendered from pixelfx, its licence ships in public/licenses/. */
  credit: z.enum(['ai-generated', 'placeholder', 'pixelfx-mit']),
  label: z.string().max(30).optional(),
});

export const AssetManifestSchema = z.object({ assets: z.array(AssetSchema) });

export type Asset = z.infer<typeof AssetSchema>;
export type AssetManifest = z.infer<typeof AssetManifestSchema>;
