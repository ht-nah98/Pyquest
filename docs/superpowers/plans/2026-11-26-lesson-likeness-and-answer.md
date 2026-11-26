# Chấm "Giống mẫu" theo % và 🔑 Xem đáp án: kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `matches` passes at ≥ 90% likeness instead of exact equality; children see the score and, after 5
failed runs, can open the solution read-only.

**Architecture:** the picture comparison moves to `packages/checker` (headless, so content:check and the page
grade alike). Studio keeps its canvas pictures and passes its own colour test to the shared `likeness()`.

**Tech Stack:** TypeScript, vitest, React, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-26-lesson-likeness-and-answer-design.md`

## Global Constraints

- `packages/*` never touch the DOM.
- No new dependency.
- Copy is in Vietnamese and short. Code and commits are in English.
- Threshold `MATCH_PASS = 90`; answer button after `ANSWER_AFTER = 5` failed runs.
- Overlays stay under z-[85].

## Review Focus

- A sprite missing from `extra.sprites` must still count (24 × 24 box), not vanish.
- A shape smaller than a cell must not vanish.
- Hollow shapes (`color='none'`) paint only their outline.
- Multi-file solutions (Bài 16) show every file in the answer panel.
- A run that errors scores 0 and never passes.

---

### Task 1: shared `likeness()` + `rasterize()` + `matchScore()` in checker

**Files:**
- Create `packages/checker/src/likeness.ts`, `packages/checker/src/raster.ts`.
- Modify `packages/checker/src/check.ts`, `packages/checker/src/index.ts`.
- Modify `apps/web/src/features/studio/likeness.ts`, so it delegates to the checker.
- Tests: `packages/checker/src/raster.test.ts`, `packages/checker/src/check.test.ts`.

**Interfaces:**

```ts
type Grid<C> = { w: number; h: number; cells: (C | null)[]; sky: C };
likeness<C>(mine: Grid<C>, model: Grid<C>, same: (a: C, b: C) => boolean): number; // 0–100
rasterize(events, stage, sprites?: Record<string, { width: number; height: number }>): Grid<string>;
matchScore(r: RunResult, expected: RunResult, extra?: CheckExtra): number; // 0 when r errored
MATCH_PASS = 90;
CheckExtra.sprites?: Record<string, { width: number; height: number }>;
```

**Tests:** spec §4 table, run on real Bài 5 code through Pyodide.
- Raster: a rect fills its cells; a circle; a hollow rect paints only its outline; a tiny shape still paints
  one cell; a sprite uses its size × scale, or 24 × 24 when its size is unknown; a later `clear` wipes.

### Task 2: content-check passes sprite sizes

- Pass manifest sizes into `gradeFiles` as `sprites`.
- Run `content:check`, print every `matches` exercise's starter score, and keep that list for the HLV report.

### Task 3: UI: score line and 🔑 Xem đáp án

**Files:**
- `apps/web/src/features/code/CodeScreen.tsx`
- `apps/web/src/features/code/TaskCard.tsx`
- New: `apps/web/src/features/code/AnswerPanel.tsx`

**What it does:**
- `score` shows as `data-testid="match-score"` with the text "Giống mẫu N% · cần 90%".
- A `failedRuns` count, reset when the exercise changes.
- The `answer-open` button shows when `failedRuns >= 5` or the user is the coach.
- `panel: 'task' | 'calls' | 'answer'`. The answer panel is `data-testid="answer-panel"`, with a `pre` per file
  and an `answer-close` button.
- Web sprite sizes come from `catalog`.

**E2E:** Bài 5 Đàn chim.
- The solution shifted by 4 px passes and shows "Giống mẫu".
- An empty run 5 times, then 🔑, then the panel shows `draw_bird(20 + i * 75, 200)`.
- Screenshots at 1280×720 and on iPad.

### Task 4: docs and full checks

- Update the goal comment in `goal.ts`, `docs/conventions/content-authoring.md` (matches), the architecture
  screen×button table, and add ADR 0014.
- Run lint, typecheck, test, content:check and the full e2e, one after another.
