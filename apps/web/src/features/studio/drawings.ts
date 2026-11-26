import { emptyLessonState, type LessonState, type ProgressStore } from '../../storage/store';

/**
 * Drawings of the 🎨 Xưởng vẽ live in the progress store as rows `studio:<id>` (no new table, ADR 0006):
 * the code is `files['main.py']` and `workspace`, the name and times are `state.studio`.
 */
export const STUDIO_PREFIX = 'studio:';
/** A friendly limit per child, so one device never fills up the class's free database. */
export const MAX_DRAWINGS = 50;
export const MAX_TITLE = 40;
export const MAIN = 'main.py';

export type Drawing = {
  id: string;
  title: string;
  createdAt: number;
  changedAt: number;
  /** 📐 the template it traces (studio.json id); absent: a free drawing. */
  template?: string;
};

export const rowOf = (drawingId: string) => `${STUDIO_PREFIX}${drawingId}`;
export const isStudioRow = (lessonId: string) => lessonId.startsWith(STUDIO_PREFIX);

/** A live (not deleted) drawing's state, or undefined. */
export function liveDrawing(state: LessonState | undefined): LessonState | undefined {
  return state?.studio === undefined || state.studio.deleted === true ? undefined : state;
}

/** The child's drawings, newest change first; deleted ones and lesson rows are left out. */
export function drawingsOf(states: ReadonlyMap<string, LessonState>): Drawing[] {
  const out: Drawing[] = [];
  for (const [lessonId, state] of states) {
    const meta = liveDrawing(state)?.studio;
    if (!isStudioRow(lessonId) || meta === undefined) continue;
    out.push({
      id: lessonId.slice(STUDIO_PREFIX.length),
      title: meta.title,
      createdAt: meta.createdAt,
      changedAt: meta.changedAt ?? meta.createdAt,
      ...(meta.template === undefined ? {} : { template: meta.template }),
    });
  }
  return out.sort((a, b) => b.changedAt - a.changedAt);
}

/** A name for a drawing: trimmed, at most MAX_TITLE characters, never empty. */
export function cleanTitle(title: string, fallback = 'Tranh'): string {
  const t = title.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE).trim();
  return t === '' ? fallback : t;
}

/** "Tranh N": the first number no drawing uses yet. */
export function nextTitle(drawings: readonly Drawing[]): string {
  const used = new Set(drawings.map((d) => d.title));
  let n = drawings.length + 1;
  while (used.has(`Tranh ${String(n)}`)) n += 1;
  return `Tranh ${String(n)}`;
}

/** A 📐 drawing's name: the template's title, then "… 2", "… 3" when the child traced it before. */
function templateTitle(drawings: readonly Drawing[], title: string): string {
  const used = new Set(drawings.map((d) => d.title));
  if (!used.has(title)) return title;
  let n = 2;
  while (used.has(`${title} ${String(n)}`)) n += 1;
  return `${title} ${String(n)}`;
}

/** Short and unique enough for one child (lesson_id is at most 40 characters). */
function newDrawingId(now: number): string {
  return `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Makes a new drawing with the studio's starter code; null when the child already has MAX_DRAWINGS. With a
 * template (📐 Vẽ theo mẫu) the drawing remembers it and is named after it; the child still starts from the starter.
 */
export async function createDrawing(
  store: ProgressStore,
  profileId: string,
  starter: string,
  now = Date.now(),
  template?: { id: string; title: string },
): Promise<string | null> {
  const drawings = drawingsOf(await store.allLessonStates(profileId));
  if (drawings.length >= MAX_DRAWINGS) return null;
  const id = newDrawingId(now);
  const title =
    template === undefined
      ? nextTitle(drawings)
      : templateTitle(drawings, cleanTitle(template.title));
  await store.saveLessonState(profileId, rowOf(id), {
    ...emptyLessonState(),
    files: { [MAIN]: starter },
    studio: {
      title,
      createdAt: now,
      changedAt: now,
      ...(template === undefined ? {} : { template: template.id }),
    },
  });
  return id;
}

/** Renames a drawing from the list (the editor renames through its own state). */
export async function renameDrawing(
  store: ProgressStore,
  profileId: string,
  drawingId: string,
  title: string,
  now = Date.now(),
): Promise<void> {
  const state = liveDrawing(await store.getLessonState(profileId, rowOf(drawingId)));
  if (state?.studio === undefined) return;
  await store.saveLessonState(profileId, rowOf(drawingId), {
    ...state,
    studio: { ...state.studio, title: cleanTitle(title, state.studio.title), changedAt: now },
  });
}

/** Deletes a drawing: its code goes, a tombstone stays so the delete reaches the child's other devices. */
export async function deleteDrawing(
  store: ProgressStore,
  profileId: string,
  drawingId: string,
  now = Date.now(),
): Promise<void> {
  const state = await store.getLessonState(profileId, rowOf(drawingId));
  if (state?.studio === undefined) return;
  await store.saveLessonState(profileId, rowOf(drawingId), {
    ...emptyLessonState(),
    studio: {
      title: state.studio.title,
      createdAt: state.studio.createdAt,
      changedAt: now,
      deleted: true,
    },
  });
}

/** An ASCII file name for the PNG: "Ngôi nhà đẹp!" → "ngoi-nha-dep.png". */
export function pngName(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `${base === '' ? 'tranh' : base}.png`;
}
