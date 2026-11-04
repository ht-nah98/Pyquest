# PyQuest Đợt 1 (Chủ nhật 08/11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repo PyQuest mới chạy local trên laptop HLV qua LAN: Bài 0 (toàn cảnh, game mẫu, lộ trình) ở hai chế độ Trình chiếu / Tự học, và màn code của Bài 1 (khối ⇄ Python, Chạy thành hình, toàn màn hình), kèm bộ khung docs/AGENTS.md theo khuôn CodeQuest.

**Architecture:** Monorepo npm workspaces. Python thật chạy bằng Pyodide trong Web Worker; code của bé gọi thư viện `pyquest` (tên hàm tiếng Anh), thư viện này ghi **nhật ký sự kiện vẽ** (script mode) hoặc trả lệnh vẽ mỗi khung hình (game mode, `update()`/`draw()`); trang vẽ nhật ký đó lên Canvas 2D. Khối → code dùng bộ sinh Python của Blockly; code → khối dùng module `ast` của Python trong chính Pyodide. Nội dung (khóa, bài, slide, mục tiêu, kho hình) là JSON kiểm bằng zod; chấm mục tiêu và `content:check` chạy Pyodide trên Node.

**Tech Stack:** Node 22, npm workspaces, TypeScript 6.0.3, React 19, Vite 8, react-router 8, Tailwind 4, Blockly 13.4.0, CodeMirror 6 (`codemirror` 6.0.2, `@codemirror/lang-python` 6.2.1), Pyodide 314.0.7, zod 4, Dexie 4 (IndexedDB), Vitest 5, Playwright 1.63, ESLint 10, Prettier 3. Font VT323.

**Spec:** `docs/superpowers/specs/2026-11-04-pyquest-design.md` (bản 2, HLV duyệt 04/11/2026).

## Global Constraints

- Repo ở `~/Desktop/PyQuest`, git mới, nhánh `main`. **Không** đụng repo CodeQuest (chỉ đọc để chép khuôn).
- Chạy local; **không Supabase, không deploy** trong đợt này. HLV phục vụ cho 3 bé qua LAN bằng `tools/coach-dev.sh` (`PQ_HOST=1`).
- Giao diện tiếng Việt, giọng học sinh cấp 2; code, tên file, commit, comment tiếng Anh.
- Thư viện vẽ: tên tiếng Anh (`draw_bird`, `key_pressed`, `update()`, `draw()`); chữ trên khối tiếng Việt ("vẽ chim tại (x, y)").
- Font duy nhất cho chữ pixel: VT323 (có bộ `vietnamese`). Chữ thường: font hệ thống.
- Package headless (`packages/*`) không dùng DOM; chạy được trên Node.
- Mô phỏng tất định: `random` trong `pyquest` có hạt giống; chấm bài dùng hạt giống cố định; không `Date.now()` trong runtime.
- Nội dung là dữ liệu trong `content/`, kiểm bằng zod qua `npm run content:check`.
- Không thu dữ liệu cá nhân: hồ sơ local chỉ có biệt danh + avatar.
- Mọi dependency mới phải có ADR trong `docs/adr/` (đợt này: một ADR gom các lựa chọn stack, một ADR cho Pyodide, một cho code → khối).
- Laptop ≥1280×720 không cuộn trang ở màn code; iPad nằm ngang ≥1080×730 dùng được bằng cảm ứng.
- Game không dùng tên/hình "Flappy Bird"; khóa và nhân vật có tên riêng (tên tạm: khóa "Bay Qua Khe", chim "Lượn"; HLV đổi được trong JSON).
- Định nghĩa xong: `npm run lint`, `typecheck`, `test`, `content:check` xanh; e2e đi qua phần đã đổi; báo kết quả thật.

## Review Focus

1. **Code bé gõ sai cú pháp / lỗi chạy** (thiếu `)`, sai thụt lề, tên hàm sai) → sân chơi hiện bong bóng lỗi tiếng Việt chỉ đúng dòng, khung khối không bị xóa trắng. Test ở Task 3 (lỗi runtime) và Task 5 (parse lỗi giữ khối cũ).
2. **Vòng lặp vô hạn** (`while True:` không có `update`) → nút Dừng hoạt động, trang không treo, worker được dựng lại. Test ở Task 3.
3. **Code ngoài tập khối đã hỗ trợ** (`import math`, list comprehension) → hiện khối "code chữ", round-trip không mất ký tự nào. Test ở Task 5.
4. **Pyodide tải chậm / mất mạng LAN giữa chừng** → nút Chạy hiện "Đang chuẩn bị Python…" thay vì im lặng; Pyodide được phục vụ từ chính server (không CDN) nên lớp không cần Internet. Test ở Task 3 (đường dẫn `indexURL` nội bộ) và Task 9 (trạng thái nút).
5. **Tải lại trang giữa bài** → code đang viết và slide đang xem được giữ (IndexedDB), không mất bài của bé. Test ở Task 7.

---

## Task 0: Bộ prompt kho hình đợt đầu (làm NGAY, trước mọi task code)

HLV cần thời gian sinh ảnh, nên task này đi trước.

**Files:**
- Create: `assets/prompts/README.md` (phong cách chung + quy trình), `assets/prompts/01-bird.md`, `02-pipes.md`, `03-background.md`, `04-ground.md`, `05-ui.md`

- [ ] **Step 1:** Viết phong cách chung: pixel art 16-bit, nền trong suốt (hoặc nền một màu phẳng `#FF00FF` dễ tách), bảng màu tươi giới hạn, viền tối 1px, nhìn ngang (side view), không chữ, không logo, **không giống Flappy Bird** (không chim vàng mỏ cam môi dày, không ống xanh lá có nắp kiểu Mario).
- [ ] **Step 2:** Mỗi file nhóm: 3–4 lựa chọn (bé chọn), mỗi lựa chọn một prompt tiếng Anh chép-dán được, kích thước khung, số khung (chim: 3 khung vỗ cánh lên/giữa/xuống trên một hàng), tên tệp mong muốn (`bird-<tên>.png`).
- [ ] **Step 3:** Gửi HLV; ảnh về thì đặt ở `assets/raw/`. Cho tới khi có ảnh thật, Task 10 tự vẽ ảnh giữ chỗ.

## Task 1: Khung repo, công cụ, tài liệu gốc

**Files:**
- Create: `package.json` (workspaces `apps/*`, `packages/*`, `tools/*`; scripts `dev`, `build`, `typecheck`=`tsc -b`, `lint`, `test`=`vitest run --passWithNoTests`, `content:check`, `e2e`, `assets:clean`), `tsconfig.base.json`, `tsconfig.json` (references), `eslint.config.js`, `.prettierrc`, `.gitignore` (gồm `.omc/`, `.superpowers/`, `node_modules`, `dist`, `apps/web/public/pyodide/`), `vitest.workspace.ts`, `.nvmrc` (22)
- Create: `AGENTS.md`, `CLAUDE.md`, `README.md`
- Create: `docs/README.md` (bản đồ tài liệu + nguồn chuẩn), `docs/glossary.md`, `docs/architecture/overview.md`, `docs/product/vision.md`, `docs/pedagogy/lesson-rhythm.md` (nhịp 5 bước, hai chế độ), `docs/conventions/coding-standards.md`, `docs/adr/README.md`, `docs/adr/0001-stack.md`, `docs/roadmap/dot-1.md`, `docs/roadmap/dot-2.md`
- Create: `docs/superpowers/specs/2026-11-04-pyquest-design.md` (chép spec), `docs/superpowers/plans/2026-11-04-pyquest-dot1-plan.md` (chép kế hoạch này), `docs/design/mockups/layout-v2.html` (chép bản phác)
- Test: `tools/smoke/smoke.test.ts`

Chép **cấu hình** (eslint, tsconfig, prettier) từ CodeQuest rồi chỉnh; không chép code nghiệp vụ. Phiên bản lấy đúng như Tech Stack.

**AGENTS.md** theo khuôn CodeQuest: §1 dự án là gì (spec §1–2), §2 đọc gì trước, §3 quy tắc vàng (= Global Constraints), §4 bản đồ repo (spec §12), §5 lệnh, §6 Định nghĩa xong, §7 playbook, §8 khi không chắc, §9 "Sai lầm đã xảy ra": **chép có chọn lọc** từ CodeQuest các mục còn áp dụng (9.5 hỏi trước khi dời, 9.6 đếm rồi mới nói, 9.7 khởi động lại dev khi thêm tệp content, 9.8 chạy đủ bộ kiểm, 9.10 thứ chưa xong không cho bé thấy, 9.14/9.27 đo precache, 9.16 báo phần chưa làm, 9.17 không chờ giá trị sống vài khung hình, 9.22/9.23 HLV chơi thử trên bản chụp, 9.29 hỏi chỗ đặt tính năng, 9.30 không cuộn trang, 9.33 bảng màn × nút, 9.34 lớp phủ trên Blockly, 9.35 prettier chỉ trên tệp đã đổi, 9.36 không chạy unit cùng e2e). Mỗi mục ghi "(từ CodeQuest §9.x)". Thêm luật mới của PyQuest: **bài nào cũng có bước Hiểu và Chơi thử** (spec §6).

**CLAUDE.md:** `@AGENTS.md`, trả lời tiếng Việt, code/commit tiếng Anh, chạy Định nghĩa xong trước khi kết thúc.

- [ ] **Step 1:** `git init -b main`, viết các tệp cấu hình, `npm install`.
- [ ] **Step 2:** Viết `tools/smoke/smoke.test.ts`: `expect(1 + 1).toBe(2)` (chỉ để chứng minh vitest chạy; xóa ở Task 2).
- [ ] **Step 3:** Run `npm run lint && npm run typecheck && npm run test` → cả ba xanh.
- [ ] **Step 4:** Viết AGENTS.md, CLAUDE.md, docs như trên; chép spec, plan, mockup.
- [ ] **Step 5:** Commit `chore: scaffold PyQuest monorepo, agent guide and docs`.

## Task 2: `packages/content-schema` — khóa, bài, slide, mục tiêu, kho hình

**Files:**
- Create: `packages/content-schema/src/{course,lesson,slide,goal,asset}.ts`, `src/index.ts`, `package.json` (`@pyquest/content-schema`, dep `zod`)
- Test: `packages/content-schema/src/schema.test.ts`
- Delete: `tools/smoke/`

**Interfaces — Produces:**
```ts
type StepKind = 'understand' | 'design' | 'prepare' | 'code' | 'playtest';
CourseSchema: { id: string; title: string; summary: string; lessonIds: string[];
  roadmap: { id: string; label: string; icon?: string }[] }           // các phần game của lộ trình
LessonSchema: { id: string; courseId: string; order: number; title: string;
  hidden?: boolean;                                                   // chưa xong thì ẩn (luật §9.10)
  steps: { kind: StepKind; slides: Slide[] }[];                       // phải có 'understand' và 'playtest'
  code?: { starter: { [path: string]: string }; main: string;         // dự án khởi đầu, vd {"main.py": "..."}
           toolbox: string[]; mode: 'script' | 'game';
           goals: Goal[]; solution: { [path: string]: string } };
  unlocksRoadmap: string[]; docsUnlocked: string[] }
Slide = { id: string; title?: string; text?: string /* ≤ 280 ký tự */; image?: string;
  widget?: { kind: 'sampleGame' | 'gravity' | 'roadmapBuilder' | 'grid'; props?: Record<string, unknown> };
  quiz?: { question: string; choices: string[]; answer: number; explain: string };
  coachNotes?: string }
Goal = { id: string; label: string } & (
  | { kind: 'noError' }
  | { kind: 'printed'; text: string }
  | { kind: 'drew'; sprite: string; at?: [number, number]; tolerance?: number }
  | { kind: 'varEquals'; name: string; value: number | string } )
AssetSchema: { id: string; group: 'bird'|'pipe'|'background'|'ground'|'ui'; file: string;
  width: number; height: number; frames: number; credit: 'ai-generated' | 'placeholder' }
export function parseLesson(json: unknown): Lesson   // ném ZodError có đường dẫn
```

- [ ] **Step 1:** Test: lesson mẫu hợp lệ parse được; thiếu bước `understand` → lỗi có message chứa `"understand"`; `text` dài 281 ký tự → lỗi; `quiz.answer` ngoài `choices` → lỗi; `code.main` không có trong `starter` → lỗi; goal `drew` thiếu `sprite` → lỗi.
- [ ] **Step 2:** Run `npx vitest run packages/content-schema` → FAIL (chưa có module).
- [ ] **Step 3:** Implement các schema bằng zod 4 (`superRefine` cho luật chéo trường).
- [ ] **Step 4:** Run lại → PASS.
- [ ] **Step 5:** Commit `feat(content-schema): course, lesson, slide, goal and asset schemas`.

## Task 3: `packages/runtime` — Python trong worker, thư viện `pyquest`, nhật ký sự kiện

**Files:**
- Create: `packages/runtime/src/pyquest/pyquest.py` (thư viện Python của bé), `src/protocol.ts`, `src/runner.ts` (lõi chạy, dùng được cả Node lẫn worker), `src/worker.ts`, `src/client.ts` (API cho trang), `src/errors.ts` (dịch lỗi Python → tiếng Việt), `package.json` (`@pyquest/runtime`, dep `pyodide@314.0.7`)
- Create: `apps/web/scripts/copyPyodide.js` (postinstall: chép `node_modules/pyodide/*` → `apps/web/public/pyodide/`, để lớp không cần Internet)
- Create: `docs/adr/0002-pyodide-in-worker.md`
- Test: `packages/runtime/src/runner.test.ts`, `src/errors.test.ts`

**Interfaces — Produces:**
```ts
type DrawEvent =
  | { t: 'clear'; color: string }
  | { t: 'sprite'; sprite: string; x: number; y: number; frame: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; color: string }
  | { t: 'text'; text: string; x: number; y: number; size: number; color: string }
  | { t: 'say'; text: string }                       // print(...) → bong bóng
  | { t: 'frame' }                                   // ranh giới khung hình
type RunResult = { events: DrawEvent[]; vars: Record<string, number | string | boolean>;
  error?: { line: number | null; messageVi: string; raw: string }; stoppedByLimit: boolean }
interface PyRunner {                                   // runner.ts
  load(indexURL: string): Promise<void>;
  runScript(files: Record<string,string>, main: string, opts: { seed: number; maxEvents: number }): Promise<RunResult>;
  startGame(files, main, opts: { seed: number }): Promise<RunResult>;          // chạy module, kiểm có update/draw
  step(input: { keys: string[]; tapped: boolean }): RunResult;                // gọi update() rồi draw() một khung
}
// client.ts (trang web): new PyClient(workerUrl, indexURL); .run(...) ; .stop() (terminate + dựng worker mới);
// .status: 'loading' | 'ready' | 'running'
```
`pyquest.py` (bé `from pyquest import *`): `WIDTH=400`, `HEIGHT=600`, `clear(color)`, `draw_bird(x, y, frame=0)`, `draw_sprite(name, x, y, frame=0)`, `draw_rect(x, y, w, h, color)`, `draw_text(text, x, y, size=24, color="white")`, `key_pressed(key="space") -> bool` (space hoặc chạm), `random_int(a, b)` (dùng `random.Random(seed)`); `print` ghi đè để sinh `say`. Hệ tọa độ: gốc góc trên trái, y hướng xuống (spec bài 1). Sprite chim mặc định `"bird"`, đổi bằng `use_sprite("bird", "images/bird-xxx.png")` (dùng ở Bài 3, đợt 2).

- [ ] **Step 1:** Test (Pyodide trên Node, `indexURL` = thư mục `node_modules/pyodide`):
  - `draw_bird(100, 200)` → `events` chứa `{t:'sprite', sprite:'bird', x:100, y:200, frame:0}`.
  - `print("xin chào")` → `{t:'say', text:'xin chào'}`.
  - `x = 5` ở cấp module → `vars.x === 5`; biến bắt đầu bằng `_` và module/hàm không vào `vars`.
  - `draw_bird(1, 2` → `error.line === 1`, `messageVi` chứa "thiếu dấu ngoặc".
  - `drw_bird(1, 2)` → `messageVi` chứa "chưa có lệnh tên drw_bird".
  - `while True: draw_bird(0,0)` với `maxEvents: 5000` → `stoppedByLimit === true`, không treo.
  - Game mode: code có `y=0`, `def update(): global y; y+=10`, `def draw(): draw_bird(0,y)`; gọi `step` 3 lần → sprite y lần lượt 10, 20, 30.
  - `random_int(1, 100)` với cùng `seed` cho cùng kết quả qua hai lần chạy.
  - Game mode không có `update` → `messageVi` chứa "cần hàm update()".
- [ ] **Step 2:** Run `npx vitest run packages/runtime` → FAIL.
- [ ] **Step 3:** Implement. Trần sự kiện: `pyquest` đếm sự kiện và ném `_EventLimit` khi vượt `maxEvents`. Files của bé ghi vào FS của Pyodide (`/home/pyodide/project/`), `os.chdir` vào đó trước khi chạy, xóa sạch giữa hai lần chạy. Lỗi: bắt `SyntaxError`/`Exception` trong Python, trả `lineno` + tên lỗi, `errors.ts` ánh xạ sang câu tiếng Việt ≤ 12 chữ (bảng ít nhất: SyntaxError ngoặc, IndentationError, NameError, TypeError số tham số, ZeroDivisionError; còn lại "Code có lỗi ở dòng N").
- [ ] **Step 4:** Run lại → PASS. Ghi ADR 0002 (Pyodide chạy trong worker, phục vụ nội bộ, Stop = terminate).
- [ ] **Step 5:** Commit `feat(runtime): run real Python in a worker and record draw events`.

## Task 4: `packages/checker` — chấm mục tiêu bài

**Files:**
- Create: `packages/checker/src/check.ts`, `src/index.ts`, `package.json` (`@pyquest/checker`)
- Test: `packages/checker/src/check.test.ts`

**Interfaces:**
- Consumes: `Goal` (Task 2), `RunResult` (Task 3)
- Produces: `checkGoals(goals: Goal[], result: RunResult): { id: string; ok: boolean }[]` — hàm thuần, không chạy Python.

- [ ] **Step 1:** Test: `noError` sai khi có `error`; `printed` khớp nguyên văn sau khi bỏ khoảng trắng hai đầu; `drew` có `at:[100,200]`, `tolerance:0` khớp đúng điểm và trượt ở (101,200); `tolerance:5` thì khớp; `varEquals` khớp số và chuỗi.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(checker): pure goal checks over run results`.

## Task 5: `packages/blocks` — khối ⇄ Python

**Files:**
- Create: `packages/blocks/src/defs.ts` (định nghĩa khối JSON), `src/generator.ts` (Blockly → Python), `src/fromPython.py` (Python → cây JSON qua `ast`), `src/fromPython.ts` (cây JSON → Blockly serialization), `src/toolbox.ts`, `package.json` (`@pyquest/blocks`, dep `blockly@13.4.0`)
- Create: `docs/adr/0003-code-to-blocks-with-python-ast.md` (vì sao không dùng BlockMirror: nó dựa Blockly 11 + Skulpt; mình đã có Pyodide nên dùng `ast` thật)
- Test: `packages/blocks/src/roundtrip.test.ts`

**Interfaces — Produces:**
```ts
blockDefs: Blockly JSON defs, type ids:
  'pq_draw_bird' (x, y)              — "vẽ chim tại (x, y)"
  'pq_print' (value)                 — "nói ..."  → print(...)
  'pq_clear' (color)                 — "tô nền màu ..."
  'pq_draw_rect' (x, y, w, h, color) — "vẽ hình chữ nhật ..."
  'pq_assign' (name field, value)    — "đặt biến ... = ..."
  'pq_number', 'pq_text', 'pq_var_get', 'pq_arith' (+ − × ÷)
  'pq_raw' (code: multiline field)   — "code chữ", giữ nguyên dòng
toPython(workspaceJson: object): string                       // headless (Blockly chạy trên Node)
fromPython(source: string, py: PyRunner): Promise<{ ok: true; workspace: object } | { ok: false; line: number; messageVi: string }>
lineMap(workspaceJson): Map<blockId, number>                  // để sáng dòng ⇄ khối
toolboxFor(ids: string[]): object                             // toolbox chỉ gồm khối bài cho phép
```
Dòng import `from pyquest import *` do generator tự thêm ở đầu và `fromPython` bỏ qua (không thành khối).

- [ ] **Step 1:** Test round-trip `fromPython → toPython` cho đúng nguyên văn (sau chuẩn hóa xuống dòng cuối): `draw_bird(100, 200)`; `x = 100\ny = 200\ndraw_bird(x, y)`; `y = y + 2`; `print("chào")`; `import math` → một khối `pq_raw`, chuỗi ra giữ nguyên; `[i for i in range(3)]` → `pq_raw`. Test `fromPython("draw_bird(1,")` → `ok:false`, `line:1`. Test `lineMap`: workspace 3 khối nối nhau → dòng 1, 2, 3.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (`fromPython.py` duyệt `ast.Module.body`; nút nào không thuộc tập hỗ trợ thì `ast.get_source_segment` thành `pq_raw`). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(blocks): blocks to Python and Python back to blocks via ast`.

## Task 6: Nội dung Bài 0, Bài 1 và `content:check`

**Files:**
- Create: `content/courses/bay-qua-khe/course.json`, `lessons/l00-lam-game-la-lam-gi.json`, `lessons/l01-man-hinh-la-to-giay-ke-o.json`, `lessons/l02 … l17` dạng khung `hidden: true` (chỉ id, title, order) để lộ trình hiện đủ 18 bài mà bé chưa vào được
- Create: `content/courses/bay-qua-khe/sample-game/main.py` (game mẫu hoàn chỉnh, game mode)
- Create: `tools/content-check/src/main.ts`, `src/rules.ts`, `package.json`
- Create: `docs/conventions/content-authoring.md` (cách viết bài: nhịp 5 bước, ≤ 280 ký tự/slide, mỗi slide một ý, coachNotes)
- Test: `tools/content-check/src/rules.test.ts`

**Nội dung Bài 0** (spec §9 hàng 0): understand: chơi game mẫu (widget `sampleGame`), "game này có những phần nào?" (quiz), quy trình 6 bước (ý tưởng → thiết kế → chuẩn bị → code → thử → sửa); design: widget `roadmapBuilder` — bé kéo các thẻ phần game (`stage`, `bird`, `gravity`, `flap`, `pipes`, `collision`, `score`, `screens`) vào thứ tự làm; prepare: "dụng cụ của mình": PyQuest, khung khối, khung code, sân chơi; code: một dòng `print("Mình sẽ làm game!")`, goal `printed`; playtest: chạy, xem bong bóng. Mỗi slide có `coachNotes`.
**Nội dung Bài 1:** understand: widget `grid` — tọa độ, y hướng xuống, bấm vào lưới hiện (x, y); design: đoán chim ở (100, 300) nằm đâu (quiz); code: starter rỗng, toolbox `pq_draw_bird pq_print pq_number pq_clear`, goals `noError`, `drew bird at [100,300]`; playtest: đổi số, chạy lại, xem chim dời chỗ. `unlocksRoadmap: ['stage']`.
Tên khóa/nhân vật dùng tên tạm ở Global Constraints. **HLV đọc lại toàn bộ chữ trước Chủ nhật** — AI không tự đánh dấu mục này xong.

**Luật `content:check`:** (1) mọi JSON qua schema; (2) `course.lessonIds` khớp các tệp bài, `order` liên tục từ 0; (3) bài không `hidden` có code thì **lời giải chạy được và qua hết goals** (runtime + checker trên Node, seed 1); (4) starter **không** qua hết goals (bài không tự xong); (5) mọi `toolbox` id có trong `blockDefs`; (6) mọi `image` / sprite trỏ tới tệp tồn tại trong kho; (7) `sample-game/main.py` chạy game mode 300 khung không lỗi; (8) không tệp lạ trong `content/` (chặn thư mục `.omc/`).

- [ ] **Step 1:** Test rules: bài hợp lệ → 0 lỗi; lời giải sai goal → lỗi chứa id goal; starter đã thỏa goals → lỗi luật 4; toolbox id lạ → lỗi; ảnh không tồn tại → lỗi.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement tool + viết nội dung + game mẫu. **Step 4:** Run `npm run content:check` → xanh, in số bài đã kiểm (18 bài, 2 bài mở). **Thử phá có chủ đích**: sửa `at` của goal Bài 1 thành `[101,300]` → `content:check` đỏ; trả lại.
- [ ] **Step 5:** Commit `feat(content): lesson 0 and 1 of Bay Qua Khe, sample game, content:check`.

## Task 7: `apps/web` — vỏ app, hồ sơ local, lưu trữ, lộ trình khóa

**Files:**
- Create: `apps/web/` (Vite + React + Tailwind + react-router), `src/main.tsx`, `src/routes.tsx`, `src/ui/` (Button, Panel, tokens; VT323 qua `@fontsource/vt323` hoặc tệp font cục bộ — ghi vào ADR 0001)
- Create: `src/storage/store.ts` (interface), `src/storage/dexieStore.ts`, `src/features/profile/ProfilePicker.tsx`, `src/features/course/CourseMap.tsx` (lộ trình 18 bài + các phần game sáng lên)
- Create: `src/content/catalog.ts` (`import.meta.glob` content JSON, parse qua schema, bỏ bài `hidden`)
- Test: `src/storage/dexieStore.test.ts` (fake-indexeddb), `src/content/catalog.test.ts`

**Interfaces — Produces:**
```ts
interface ProgressStore {                               // Supabase cắm vào sau qua interface này
  listProfiles(): Promise<Profile[]>; createProfile(nickname: string, avatar: string): Promise<Profile>;
  getLessonState(profileId, lessonId): Promise<LessonState | undefined>;
  saveLessonState(profileId, lessonId, s: LessonState): Promise<void> }
Profile = { id: string; nickname: string; avatar: string; role: 'student' | 'coach' }
LessonState = { stepIndex: number; slideIndex: number; quizAnswers: Record<string, number>;
  files: Record<string, string>; workspace?: object; done: boolean; doneSteps: StepKind[] }
Routes: '/'  (chọn hồ sơ) · '/c/:courseId' (lộ trình) · '/l/:lessonId?mode=present|self' (slide)
        · '/l/:lessonId/code' (màn code) · '/l/:lessonId/play' (toàn màn hình)
```
Hồ sơ HLV: tạo bằng PIN đặt trong `apps/web/.env.local` (`VITE_COACH_PIN`, có `.env.example`); HLV mới thấy chế độ Trình chiếu và mở được mọi bài.

- [ ] **Step 1:** Test store: tạo hồ sơ, lưu `LessonState` có `files`, đọc lại khớp; hai hồ sơ không lẫn nhau. Test catalog: bài `hidden` không có trong danh sách mở, nhưng vẫn có trong lộ trình (tên + khóa).
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS; `npm run dev` mở được `/` và `/c/bay-qua-khe`.
- [ ] **Step 5:** Commit `feat(web): app shell, local profiles, progress store, course roadmap`.

## Task 8: Trình chiếu và Tự học

**Files:**
- Create: `src/features/slides/SlideDeck.tsx`, `PresentMode.tsx`, `SelfMode.tsx`, `CoachNotesWindow.tsx` (route `/l/:lessonId/notes`, đồng bộ bằng `BroadcastChannel('pq-present')`), `src/features/slides/widgets/{SampleGame,Gravity,RoadmapBuilder,Grid}.tsx`
- Test: `src/features/slides/SelfMode.test.tsx`

Trình chiếu: toàn màn hình, chữ to, ←/→/Space để chuyển, phím `N` mở cửa sổ ghi chú. Thanh bước (Hiểu · Thiết kế · Chuẩn bị · Code · Chơi thử) luôn hiện. Bước `code` → nút "Sang màn code". Tự học: nút Tiếp, slide có `quiz` chỉ cho Tiếp khi đã chọn đúng (chọn sai thì hiện `explain`, chọn lại được); lưu `slideIndex` mỗi lần chuyển. `Gravity`: thanh trượt trọng lực 0.1–1.0, chim rơi trên canvas nhỏ (chạy JS thuần, không cần Python). `SampleGame`: chạy `sample-game/main.py` qua `PyClient`, có nút toàn màn hình. `RoadmapBuilder`: kéo thả (pointer events, chạy cả chuột lẫn cảm ứng) các thẻ vào cột, lưu vào `LessonState`.

- [ ] **Step 1:** Test SelfMode: slide quiz chặn Tiếp; chọn sai hiện `explain`; chọn đúng mở Tiếp; tải lại (unmount/mount với cùng store) quay về đúng slide.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(slides): present and self-study modes with coach notes and widgets`.

## Task 9: Màn code (bố cục B) và toàn màn hình

**Files:**
- Create: `src/features/code/CodeScreen.tsx`, `BlocksPane.tsx`, `PythonPane.tsx` (CodeMirror 6 + lang-python), `useBlockCodeSync.ts`, `Stage.tsx` (Canvas 2D vẽ `DrawEvent[]`), `VarWatch.tsx`, `GoalList.tsx`, `PlayFullscreen.tsx`, `src/features/code/spriteAtlas.ts`
- Create: `apps/web/scripts/copyBlocklyMedia.js` (như CodeQuest)
- Test: `src/features/code/useBlockCodeSync.test.ts`

Hành vi: sửa khối → code cập nhật ngay; gõ code → sau 600 ms không gõ thì `fromPython`; parse lỗi → **giữ khối cũ**, viền đỏ dòng lỗi, bong bóng `messageVi`; chọn khối ⇄ sáng dòng (`lineMap`). Nút Chạy: `status==='loading'` → "Đang chuẩn bị Python…", đang chạy → nút thành "■ Dừng". Script mode phát lại `events` theo nhịp 30 ms/sự kiện vẽ; game mode chạy `step` mỗi `requestAnimationFrame` (60 fps), phím Space / chạm → `key_pressed`. Toàn màn hình: route `/play`, Fullscreen API, Esc/"Về code" quay lại với state giữ nguyên. Lớp phủ trên Blockly dùng `z-[85]` (bài học CodeQuest §9.34). Lưu `files` + `workspace` vào store sau mỗi thay đổi (debounce 500 ms).
Bố cục: laptop — khối | code (≈70%, có vạch ngăn kéo) | cột sân chơi (≈26%); `@media (max-width: 1279px)` — khối | code ở trên, sân chơi thành dải dưới, nút ≥ 44 px.

- [ ] **Step 1:** Test sync (Blockly headless + PyRunner trên Node): đổi số trong khối → chuỗi code mới; đặt code `draw_bird(1,` → workspace không đổi, trả lỗi dòng 1; đặt code `x = 3` → workspace có `pq_assign`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `feat(code): split blocks/Python editor, stage, variable watch, fullscreen play`.

## Task 10: Kho hình (giữ chỗ + công cụ làm sạch)

**Files:**
- Create: `tools/assets/clean.py` (chép ý tưởng `tools/sprites/clean.py` của CodeQuest: tách nền `#FF00FF`/trong suốt, cắt viền, thu nhỏ nearest-neighbor về kích thước đích, ghép khung ngang), `tools/assets/placeholders.py` (vẽ chim 3 khung, ống, nền, đất bằng Pillow, `credit:"placeholder"`)
- Create: `content/assets/library/manifest.json` + các PNG; `docs/playbooks/add-asset.md` (prompt → HLV sinh → `assets/raw/` → `npm run assets:clean` → manifest → đo precache/kích thước)
- Test: `tools/assets/test_clean.py` (chạy bằng `python3 -m pytest` — nếu repo chưa có pytest thì dùng `unittest`, không thêm dependency)

- [ ] **Step 1:** Test: ảnh 3 khung có nền magenta → ra PNG RGBA, pixel nền alpha 0, kích thước `frames*w × h` đúng.
- [ ] **Step 2–4:** FAIL → implement → PASS; chạy `placeholders.py`, `content:check` luật 6 xanh.
- [ ] **Step 5:** Commit `feat(assets): asset library manifest, cleaner and placeholders`.
- [ ] **Step 6 (khi HLV gửi ảnh):** làm sạch, thay placeholder, chạy lại `content:check`, chụp game mẫu.

## Task 11: e2e, chế độ LAN cho HLV, nghiệm thu

**Files:**
- Create: `apps/web/playwright.config.ts` (cổng 5199, dự án `laptop` 1280×720 và `ipad` 1080×730 `hasTouch`), `apps/web/e2e/lesson0.spec.ts`, `lesson1.spec.ts`, `ipad.spec.ts`, `e2e/helpers.ts` (`recordAttributes` kiểu CodeQuest — §9.17)
- Create: `tools/coach-dev.sh` (chép CodeQuest, đổi tên biến `PQ_*`, worktree `~/.cache/pq/coachwt`, `PQ_HOST=1` → `--host`), `docs/architecture/deployment-ops.md` (chạy cho lớp qua LAN; Pyodide phục vụ nội bộ)

E2e:
- `lesson0`: tạo hồ sơ → `/c/bay-qua-khe` thấy 18 bài, 2 mở → Bài 0 tự học: quiz chặn Tiếp, trả lời đúng → game mẫu chạy (canvas có vẽ: đọc `data-frames` tăng) → sang code, chạy `print` → bong bóng hiện, goal ✅. Trình chiếu (hồ sơ HLV): phím → chuyển slide, cửa sổ ghi chú đổi theo.
- `lesson1`: kéo khối "vẽ chim" → code có `draw_bird(` → sửa số trong code thành `100, 300` → khối đổi theo → Chạy → goals ✅ → toàn màn hình → Esc → code còn nguyên. Code sai cú pháp → bong bóng lỗi, khối còn. `while True:` → Dừng hoạt động trong 2 s.
- `ipad`: các trang trên chạy bằng `tap`, không cuộn ngang; màn code không cuộn trang ở 1280×720 (`document.scrollingElement.scrollHeight <= innerHeight`).
- Chạy lại sau F5 giữa bài → code còn.

- [ ] **Step 1:** Viết e2e → chạy `npm run e2e` → sửa tới khi xanh (không chạy cùng lúc với unit test — §9.36).
- [ ] **Step 2:** Chụp màn hình 1280×720, 1866×966, iPad cho Bài 0 (trình chiếu, tự học), màn code Bài 1, toàn màn hình. Mở từng ảnh kiểm.
- [ ] **Step 3:** Chạy đủ Định nghĩa xong: `npm run lint && npm run typecheck && npm run test && npm run content:check && npm run build && npm run e2e`. Đọc dòng kích thước bundle; Pyodide (~10 MB) phục vụ nội bộ, không precache.
- [ ] **Step 4:** `PQ_HOST=1 tools/coach-dev.sh` → mở từ một máy khác trong LAN (HLV thử bằng iPad).
- [ ] **Step 5:** Commit `test(e2e): lesson 0 and 1 on laptop and iPad; coach LAN dev server`. Báo HLV: kết quả thật từng lệnh, ảnh chụp, và việc còn chờ HLV (đọc chữ bài 0–1, gửi ảnh kho hình, chơi thử trên máy thật).

---

## Thứ tự và ước lượng

Task 0 (ngay) → 1 → 2 → 3 (rủi ro lớn nhất: Pyodide trên Node + worker) → 4 → 5 (rủi ro thứ hai) → 6 → 7 → 8 → 9 → 10 → 11.
Nếu tới tối thứ Sáu 06/11 Task 5 chưa xanh: màn code Bài 1 tạm chỉ có chiều khối → code (khung Python chỉ đọc), ghi rõ trong báo cáo; chiều ngược lại sang đợt 2.
