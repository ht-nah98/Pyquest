/**
 * The sounds and tunes play_sound / play_music know (ADR 0007). The page makes them itself (Web Audio, 8-bit
 * style), so there are no sound files. One list for Python, the blocks and the page.
 */
export const SOUNDS = ['flap', 'point', 'hit', 'fall', 'win', 'click'] as const;
export const MUSIC = ['happy', 'adventure', 'calm'] as const;

export type SoundName = (typeof SOUNDS)[number];
export type MusicName = (typeof MUSIC)[number];
