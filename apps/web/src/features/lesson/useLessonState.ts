import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../../app/session';
import { emptyLessonState, type LessonState } from '../../storage/store';

/**
 * Loads one lesson's state for the current child and saves every change (debounced 300 ms; flushed
 * on unmount), so a reload never loses a slide or a line of code (plan Review Focus 5).
 */
export function useLessonState(lessonId: string) {
  const { store, profile } = useSession();
  const [state, setState] = useState<LessonState | null>(null);
  const latest = useRef<LessonState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const profileId = profile?.id;

  useEffect(() => {
    if (profileId === undefined) return;
    let alive = true;
    void store.getLessonState(profileId, lessonId).then((s) => {
      if (!alive) return;
      const loaded = s ?? emptyLessonState();
      latest.current = loaded;
      setState(loaded);
    });
    return () => {
      alive = false;
    };
  }, [store, profileId, lessonId]);

  const flush = useCallback(() => {
    const dirty = timer.current !== undefined;
    clearTimeout(timer.current);
    timer.current = undefined;
    // Only write what changed: a screen that merely read the state must never overwrite newer saves.
    if (dirty && profileId !== undefined && latest.current !== null) {
      void store.saveLessonState(profileId, lessonId, latest.current);
    }
  }, [store, profileId, lessonId]);

  useEffect(() => flush, [flush]);

  const update = useCallback(
    (patch: Partial<LessonState> | ((s: LessonState) => Partial<LessonState>)) => {
      const base = latest.current ?? emptyLessonState();
      const next = { ...base, ...(typeof patch === 'function' ? patch(base) : patch) };
      latest.current = next;
      setState(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 300);
    },
    [flush],
  );

  return { state, update, flush };
}
