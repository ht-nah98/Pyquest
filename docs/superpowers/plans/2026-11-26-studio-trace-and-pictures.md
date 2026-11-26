# Xưởng vẽ: vẽ theo mẫu, lệnh vẽ người, kho hình — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Children draw people and houses with new commands, trace a faint code-made template and see "Giống mẫu N%",
and pick pictures from a 🖼️ Kho hình panel that inserts the `draw_image` line for them.

**Architecture:** New commands live in the `pyquest` library (Python string in `packages/runtime`), emit two new
draw events (`ellipse`, `arc`) and an optional `border` on filled shapes; renderer, checker, blocks and Python→blocks
follow. Templates and the picture list are data in `content/studio/studio.json`, checked by `content:check`. The
likeness score is a pure function over two RGBA buffers; the web app renders the buffers. The picture panel is one
component opened from `EditorPanes`.

**Tech Stack:** TypeScript, React, Blockly, Pyodide, zod, vitest, Playwright. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-26-studio-trace-and-pictures-design.md`

## Global Constraints

- `packages/*` never touch DOM (AGENTS.md rule 1). Likeness math is pure; canvas work stays in `apps/web`.
- Deterministic: no `Math.random()` / `Date.now()` in runtime (rule 2).
- Content is data in `content/` and passes `npm run content:check` (rules 3, 4).
- Kid text Vietnamese with diacritics, short; code / names / commits English (rule 7).
- No new dependency (rule 10). Pixel pictures chosen by HLV, child-safe, not resembling existing game characters (rule 11).
- Code screen fits 1280×720 with no page scroll (§9.10); screenshot 1280×720, iPad 1080×730, 1866×966 after a run.
- Overlays on the editor use `z-[85]` (§9.12).
- Format only changed files: `npx prettier --write $(git diff --name-only)` (§9.13). Never `cd content/`.
- New files in `content/` ⇒ restart `npm run dev` (§9.3). Unit tests and e2e run one after the other (§9.4).
- Stage of the studio is 600 × 600. Angles in degrees, 0 = right, clockwise (y down).
- Studio templates and new copy: HLV must read before kids see them; never mark that done.

## Review Focus

1. A template that uses a command missing from the studio toolbox — `content:check` must refuse it (Task 4 test).
2. Kid draws the template shifted by 2–3 px or with a slightly different shade — score must stay ≥ 85% (Task 5 test).
3. Kid's code has no `clear(...)` line, or several — "➕ Thêm vào tranh" for a background still lands under every
   shape (after the first `clear`, else as line 2 after the import, else at the top) (Task 7 test).
4. Old drawings saved before today (no `template` in meta) and merging two devices' copies — open as creative drawings,
   keep `template` across `mergeLessonState` (Task 6 test).
5. `draw_circle(…, color=None)` without `border=` and negative `w`/`h` — short Vietnamese error, no crash (Task 1 test).

---

### Task 1: `draw_ellipse`, `draw_arc`, `border=`, `color=None` in the library and renderer

**Files:**
- Modify: `packages/runtime/src/pyquest/pyquest.py.ts` (add to `__all__`, new functions, `border` on rect/circle/polygon/triangle)
- Modify: `packages/runtime/src/types.ts` (DrawEvent union)
- Modify: `apps/web/src/stage/render.ts` (`drawEvent`)
- Test: `packages/runtime/src/library.test.ts`, `apps/web/src/stage/render.test.ts`

**Interfaces:**
- Produces (Python):
  - `draw_ellipse(x, y, w, h, color="pink", border=None)` → event `{t:'ellipse', x, y, w, h, color, border?}`, centre (x, y).
  - `draw_arc(x, y, r, start, end, color="black", width=3)` → event `{t:'arc', x, y, r, start, end, color, width}`.
  - `border=None` keyword on `draw_rect`, `draw_circle`, `draw_ellipse`, `draw_polygon`, `draw_triangle`; when set, event gets `border: string` (width fixed 3).
  - `color=None` → event `color: 'none'`; requires `border`.
- Produces (TS): `DrawEvent` members `{ t:'ellipse'; x; y; w; h; color: string; border?: string } & By`,
  `{ t:'arc'; x; y; r; start; end; color: string; width: number } & By`; `border?: string` on `rect`, `circle`, `polygon`.

- [ ] **Step 1: failing tests** in `library.test.ts`:
  - `draw_ellipse(300, 200, 80, 40, "pink")` → events contain `{t:'ellipse', x:300, y:200, w:80, h:40, color:'pink'}`.
  - `draw_arc(300, 300, 15, 0, 180)` → `{t:'arc', r:15, start:0, end:180, color:'black', width:3}`.
  - `draw_circle(10, 10, 5, "red", border="black")` → event has `border:'black'`; without `border` the key is absent.
  - `draw_circle(10, 10, 5, None, border="black")` → `color:'none'`.
  - Errors (`r.error.messageVi` contains): `draw_ellipse(0,0,-1,5)` → "không được nhỏ hơn 0"; `draw_circle(0,0,5,None)` →
    "cần border"; `draw_arc(0,0,5,"a",90)` → "phải là một số"; `draw_arc(0,0,5,0,90,width=0)` → "lớn hơn 0".
- [ ] **Step 2:** `npm -w packages/runtime run test -- library` → FAIL.
- [ ] **Step 3:** implement. Error copy: `"Chiều rộng w và chiều cao h không được nhỏ hơn 0"`,
  `"color=None là không tô màu, nên cần border=\"màu viền\""`. Helper `_fill(color, border)` returns the pair.
- [ ] **Step 4:** test passes.
- [ ] **Step 5: renderer test** in `render.test.ts` (existing fake-ctx style): ellipse calls `ctx.ellipse(x, y, w/2, h/2, 0, 0, 2π)` then `fill`; `color:'none'` skips `fill`; `border` sets `strokeStyle`, `lineWidth=3`, `stroke`; arc calls `ctx.arc(x, y, r, start·π/180, end·π/180)` and `stroke`, lineCap round. Run → FAIL, implement in `drawEvent`, run → PASS.
- [ ] **Step 6:** `npm run typecheck` (the `switch` in `drawEvent` must stay exhaustive) → green. Commit
  `feat(runtime): draw_ellipse, draw_arc, border= and hollow shapes`.

### Task 2: checker, blocks, Python→blocks, 📘 Thư viện, ADR 0013

**Files:**
- Modify: `packages/checker/src/check.ts` (`pieces`: ellipse `rest = "${w}x${h} ${color} ${border??''}"`, arc `rest = "${r} ${start} ${end} ${width} ${color}"`; add `border` to rect/circle/polygon rest)
- Modify: `packages/blocks/src/defs.ts`, `generator.ts`, `toolbox.ts` (defaults + Vẽ category after `pq_draw_circle`)
- Modify: `packages/runtime/src/pyquest/toblocks.py.ts` (`_CALLS`: `"draw_ellipse": ("pq_draw_ellipse", ["X","Y","W","H","COLOR"])`, `"draw_arc": ("pq_draw_arc", ["X","Y","R","START","END","COLOR"])`)
- Modify: `content/reference/pyquest.json` (entries `draw_ellipse`, `draw_arc`, no `lesson`; mention `border=` in draw_circle's `vi`)
- Modify: `content/studio/studio.json` toolbox (+`pq_draw_ellipse`, `pq_draw_arc`, `pq_draw_image_scale`)
- Create: `docs/adr/0013-drawing-people-commands.md`; Modify `docs/adr/README.md` index
- Test: `packages/checker/src/check.test.ts`, `packages/blocks/src/roundtrip.test.ts`

**Interfaces:**
- Produces: block types `pq_draw_ellipse` (inputs X, Y, W, H, COLOR; message `vẽ hình elip tâm x %1 y %2 rộng %3 cao %4 màu %5`), `pq_draw_arc` (X, Y, R, START, END, COLOR; `vẽ cung tròn tâm x %1 y %2 bán kính %3 từ góc %4 tới góc %5 màu %6`). Toolbox defaults: ellipse `300,300,160,100,'pink'`; arc `300,300,60,0,180,'black'`. `draw_arc` with `width=` and any call with `border=` stay raw-code blocks.

- [ ] **Step 1: failing tests:** roundtrip `draw_ellipse(300, 300, 160, 100, "pink")` and `draw_arc(300, 300, 60, 0, 180, "black")` survive Python→blocks→Python exactly, as `pq_draw_ellipse` / `pq_draw_arc`; `draw_circle(1, 2, 3, "red", border="black")` round-trips as raw. Checker: `matches` is true for the same ellipse/arc and false when `h` or `end` differ; `shifts` sees an ellipse moved by (10, 0).
- [ ] **Step 2:** run `npm -w packages/blocks run test` and `npm -w packages/checker run test` → FAIL.
- [ ] **Step 3:** implement all files above; ADR 0013 records: centre-based ellipse (like circle), clockwise degrees, border width 3, `color=None`, blocks without border for now.
- [ ] **Step 4:** both suites PASS; `npm run content:check` green.
- [ ] **Step 5:** commit `feat: ellipse and arc blocks, checker support, ADR 0013`.

### Task 3: e2e + screenshots for the new commands (Đợt 1 done)

**Files:** Modify `apps/web/e2e/studio.spec.ts`.

- [ ] **Step 1:** test "draws a face with ellipse, arc and border": open a new drawing, type a face (`draw_ellipse` head, two `draw_circle` eyes with `border=`, `draw_arc` smile), ▶, wait for run end, assert no `error-bubble`, `toHaveScreenshot` not required; save `page.screenshot` at 1280×720 to `test-results/`.
- [ ] **Step 2:** `npm run e2e -- studio.spec.ts` → PASS; open the screenshot and look at it (face visible, smile is the lower half).
- [ ] **Step 3:** full Định nghĩa xong: `npm run lint && npm run typecheck && npm run test && npm run content:check`, then `npm run e2e` (whole suite, after unit tests). Commit `test(e2e): drawing a face in the studio`.

### Task 4: templates in `studio.json` + `content:check` rule

**Files:**
- Modify: `packages/content-schema/src/studio.ts`, `schema.test.ts`
- Modify: `tools/content-check/src/rules.ts` (`checkStudio`), `rules.test.ts`
- Modify: `content/studio/studio.json` (6 templates)

**Interfaces:**
- Produces: `StudioTemplateSchema = { id: /^[a-z0-9-]+$/, title: string 1–40, level: 1|2|3, code: string min 1, hint: string 1–120 }`; `Studio.templates: StudioTemplate[]` (default `[]`); duplicate template ids refused. Type `StudioTemplate` exported.

- [ ] **Step 1: failing tests** in `rules.test.ts` (`describe('the drawing studio (rule 12)')`): a template that fails to run is reported `template "x" fails`; a template using a block not in the toolbox (e.g. `pq_while`) is reported `template "x" uses blocks not in the toolbox`; a template drawing fewer than 3 pieces is reported `template "x" draws fewer than 3 shapes`; a template whose code does not survive the blocks round trip is reported. Schema test: level 4 and duplicate ids are refused.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement (reuse the starter's round-trip + `blockTypes` + `runScript` with `stage`; count pieces = events with `t` not in `clear|frame|say|sound|music`). **Step 4:** PASS.
- [ ] **Step 5:** write the 6 templates (titles from spec §5.2, ⭐ = level): ☀️ Mây trời và chim (1), 🏠 Ngôi nhà (1), 👨‍👩‍👧 Gia đình ba người (2), 🌈 Cầu vồng trên đồi (2), 🏡 Nhà và cây bên hồ (3), 🏮 Phố đèn lồng (3). Only studio-toolbox blocks, integer coordinates, colours by CSS name; birds as `draw_arc` pairs (no picture needed). `npm run content:check` green. Commit `feat(studio): trace templates in studio.json, checked by content:check`.

### Task 5: likeness score (pure)

**Files:** Create `apps/web/src/features/studio/likeness.ts`, `likeness.test.ts`.

**Interfaces:**
- Produces: `likeness(mine: Picture, model: Picture): number` (0–100, integer) where
  `type Picture = { ink: Uint8ClampedArray; sky: [number, number, number]; size: number }` — `ink` is RGBA of the
  drawing **without** its `clear` (transparent where nothing drawn), `size × size` (use `LIKENESS_SIZE = 100`); `sky`
  is the RGB of its last `clear` colour.

Algorithm (not determined by the signature):
```
cells = model ink pixels (alpha > 0) ∪ mine ink pixels
near(p, A, B) = some pixel of B within 2 cells of p has ink with RGB distance to A[p] < 80
matched(p) = (mine has no ink at p or near(p, mine, model)) and (model has no ink at p or near(p, model, mine))
inkScore = |{p in cells : matched(p)}| / |cells|
skyScore = 1 if RGB distance(mine.sky, model.sky) < 80 else 0
score = round(100 * (0.85 * inkScore + 0.15 * skyScore)); empty cells set → skyScore * 100
```

- [ ] **Step 1: failing tests:** same picture → 100; empty vs model → ≤ 15; model shifted 2 cells right → ≥ 85; shade off by (20, 20, 20) → ≥ 85; totally different colour in the same place → ≤ 30; extra big shape drawn by the kid lowers the score below 70.
- [ ] **Step 2:** `npm -w apps/web run test -- likeness` → FAIL. **Step 3:** implement. **Step 4:** PASS. Commit `feat(studio): likeness score between a drawing and its template`.

### Task 6: trace drawings — create, store, merge

**Files:**
- Modify: `apps/web/src/storage/store.ts` (`StudioMeta.template?: string`)
- Modify: `apps/web/src/features/studio/drawings.ts` (`createDrawing`)
- Test: `apps/web/src/features/studio/drawings.test.ts`, `apps/web/src/storage/merge.test.ts`

**Interfaces:**
- Produces: `createDrawing(store, profileId, starter, now = Date.now(), template?: string): Promise<string | null>` — stores `studio.template` when given and the title is the template's title (`nextTitle` numbering if taken); `Drawing` gains `template?: string`.

- [ ] **Step 1: failing tests:** a drawing created with template `"ngoi-nha"` has `studio.template === "ngoi-nha"` and `drawingsOf` returns `template`; old row without `template` → `template` undefined; `mergeLessonState` of two copies keeps `template`.
- [ ] **Step 2–4:** FAIL → implement → PASS. Commit `feat(studio): drawings remember their template`.

### Task 7: picture line helpers (pure)

**Files:** Create `apps/web/src/features/studio/pictures.ts`, `pictures.test.ts`.

**Interfaces:**
- Produces:
  - `pictureLine(asset: Asset, stage: StageSize): string` — background (`asset.width === stage.width && asset.height === stage.height`) → `draw_image("images/<id>.png", 0, 0)`; `pixel` asset → `scale=4`, placed at centre: `draw_image("images/<id>.png", <(W − 4w)/2>, <(H − 4h)/2>, scale=4)`; other → scale 1, centred.
  - `isBackground(asset: Asset, stage: StageSize): boolean`.
  - `withLine(code: string, line: string, where: 'end' | 'under'): string` — `end`: append on its own line (ensure one trailing `\n`); `under`: insert right after the first top-level `clear(...)` line, else right after `from pyquest import *`, else at the top.

- [ ] **Step 1: failing tests:** the five `withLine` cases (end with/without trailing newline; under with one clear, two clears → after first, no clear → after import, no import → top) and the three `pictureLine` cases (16×16 pixel on 600×600 → `268, 268, scale=4`).
- [ ] **Step 2–4:** FAIL → implement → PASS. Commit `feat(studio): code lines for library pictures`.

### Task 8: studio data for pictures

**Files:** `packages/content-schema/src/studio.ts`, `tools/content-check/src/rules.ts` + tests, `content/studio/studio.json`, `content/assets/library/manifest.json` (labels).

**Interfaces:**
- Produces: `Studio.pictureGroups: { id: string; title: string (1–30); pictures: string[] (asset ids, min 1) }[]` (default `[]`).
- [ ] **Step 1: failing tests:** unknown asset id → `picture "x" is not in the library`; picture without `label` → `picture "x" has no label`; same id in two groups refused.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** data for now (until HLV picks pixel art): group `🐦 Chim` with `bird`, `bird-cu`, `bird-rong`, `bird-vet` (already labelled); group `🌳 Cây và hoa` with `deco-bush`, `deco-flowers`, `deco-oak`, `deco-fern`, `deco-lotus`, `deco-star-tree` — add Vietnamese `label`s to those manifest entries (Bụi cây, Hoa, Cây sồi, Dương xỉ, Hoa sen, Cây sao). `content:check` green. Commit `feat(studio): picture groups in studio.json`.

### Task 9: 👀 Mẫu + likeness in the editor; ✏️ / 📐 on the list

**Files:**
- Modify: `apps/web/src/features/studio/StudioList.tsx` (two buttons; 📐 opens a template grid in the same page: `TemplatePicker`)
- Create: `apps/web/src/features/studio/TemplatePicker.tsx` (cards: thumbnail = template rendered once into a small canvas via `drawEvent`, title, ⭐×level)
- Create: `apps/web/src/features/studio/renderPicture.ts` (`renderPicture(events, stage, size = LIKENESS_SIZE): Picture` with an offscreen canvas; skips `clear`, reads the last `clear` colour via a 1×1 canvas)
- Modify: `apps/web/src/features/studio/StudioEditor.tsx` (when `meta.template` set: 👀 Mẫu toggle, on by default, `stage.ghost(templateEvents)`; after every run `likeness(...)` → `<p data-testid="likeness">Giống mẫu {n}%</p>` + short cheer; template missing from studio.json → editor works as creative, no button)
- Test: `apps/web/e2e/studio.spec.ts`, `apps/web/e2e/studio-ipad.spec.ts`

Copy (HLV reads later): `≥ 90`: "🎉 Giống y như mẫu!"; `≥ 60`: "Gần giống rồi, chỉnh thêm chút nữa!"; else "Nhìn mẫu mờ và vẽ tiếp nhé."

- [ ] **Step 1: e2e failing:** pick 📐 → card 🏠 Ngôi nhà → editor with `data-ghost="on"`; paste the template's own code, ▶ → `likeness` shows `100%`; toggle 👀 → `data-ghost="off"`; ✏️ creates a drawing without 👀.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** PASS at 1280×720 and iPad; screenshots after run at 1280×720, 1080×730, 1866×966 — open each, check no page scroll and the % is visible.
- [ ] **Step 5:** add the 👀 Mẫu row to the screen × button table (`docs/architecture/overview.md`, Xưởng vẽ section). Commit `feat(studio): trace mode with ghost template and likeness`.

### Task 10: 🖼️ Kho hình panel

**Files:**
- Create: `apps/web/src/features/code/PicturePanel.tsx` (same frame as `LibraryPanel`: `absolute inset-y-0 right-0 z-[85] w-[min(440px,100%)]`; group chips; grid of 64×64 tiles drawn with `image-rendering: pixelated` for pixel assets; selected picture shows label, real size, code line from `pictureLine`, 📋 Chép, ➕ Thêm vào tranh; top hint "Đổi x, y để dời hình; đổi scale để phóng to.")
- Modify: `apps/web/src/features/code/EditorPanes.tsx` (prop `pictures?: { groups: Studio['pictureGroups']; stage: StageSize }`; button `🖼️ Kho hình` next to 📘 only when given; only one of the two panels open; handle method `insertLine(line: string, where: 'end' | 'under'): void` = `withLine` on the active file → `pyPane.setText` → `saveCode` → `reparse`)
- Modify: `apps/web/src/features/studio/StudioEditor.tsx` (pass `pictures`)
- Test: `apps/web/e2e/studio.spec.ts`, `studio-ipad.spec.ts`

- [ ] **Step 1: e2e failing:** open 🖼️ → click a bird tile → code line visible → ➕ → Python pane ends with that line and blocks show a `pq_draw_image` block; ▶ draws a sprite (assert via recorded events helper, §9.8); `document.elementFromPoint` at the panel's left edge hits the panel (§9.12); 📘 and 🖼️ never open together.
- [ ] **Step 2–4:** FAIL → implement → PASS; screenshots at the three sizes, open and check.
- [ ] **Step 5:** screen × button table row for 🖼️. Full Định nghĩa xong (lint, typecheck, test, content:check, then whole e2e). Commit `feat(studio): picture panel with add-to-drawing`.

### Task 11: pixel picks from Pixel Art Atlas (stops for HLV)

**Files:** Create `tools/assets/atlas-filter.py` (reads the downloaded dataset outside the repo, path as argument; filters captions by keyword lists for `people`, `house`, `plant`, `pet`, `sky`; drops captions with weapon/blood/monster/spider/skull words; writes up to 40 candidates per theme into `<out>/picks/` with `picks.json` in the format `tools/assets/pixel.py` reads, plus `sheet-<theme>.png` contact sheets with numbers). Modify `tools/assets/pixel.py` `GROUPS` (+`people`, `house`, `plant`, `pet`, `sky`).

- [ ] **Step 1:** ask HLV before the ~259 MB download (§9.14 — same source they chose on 23/11, same terms); download into the scratchpad, not the repo.
- [ ] **Step 2:** run the filter, open every contact sheet, remove anything scary or resembling a known character.
- [ ] **Step 3:** **STOP: show sheets to HLV, HLV picks 60–100.** Then `python3 tools/assets/pixel.py`, add `label`s, add groups to `studio.json` (`👪 Người`, `🏠 Nhà và đồ vật`, `🐶 Con vật`, `☁️ Trời`), record sources in `assets/pixel-sources.json`.
- [ ] **Step 4:** `npm run content:check`, `npm run build`, read bundle sizes (§9.6). Commit `feat(assets): pixel pictures for the studio (HLV picked)`.

### Task 12: 600×600 backgrounds (stops for HLV)

**Files:** Create `assets/prompts/07-studio-backgrounds.md` (6 prompts: bầu trời mây, làng quê, bãi biển, phố cổ, đêm sao, vườn hoa; style from `assets/prompts/README.md`, square, no characters, no text). Modify `tools/assets/clean.py` (group `bg`: cover-crop to 600×600, store 2×, 256-colour PNG) + its test; `assets/raw/library.json` entries.

- [ ] **Step 1:** test in `npm run assets:test`: a 1024×1536 input becomes 1200×1200 with manifest size 600×600. FAIL → implement → PASS.
- [ ] **Step 2:** `npm run assets:placeholders` for the 6 `bg-*` ids; group `🖼️ Ảnh nền` in `studio.json`; e2e: ➕ on a background inserts under `clear(...)`.
- [ ] **Step 3:** **STOP: HLV generates the images** into `assets/raw/bg/`; then `npm run assets:clean -- --all`, content:check, build sizes. Commit.

### Finish

- [ ] Roadmap `docs/roadmap/dot-2.md`: add the 26/11 line, marked **chờ HLV đọc lại mẫu và chữ**.
- [ ] Report: commands run with real results; list what waits for HLV (template copy, pixel picks, backgrounds).
