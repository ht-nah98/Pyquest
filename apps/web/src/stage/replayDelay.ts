const PER_EVENT_MS = 30;
const MAX_TOTAL_MS = 3000;

/** Script-mode replay speed: 30 ms per drawing so order is visible, but never longer than 3 s in all (review I3). */
export function replayDelay(events: number): number {
  if (events <= 0) return PER_EVENT_MS;
  return Math.min(PER_EVENT_MS, MAX_TOTAL_MS / events);
}
