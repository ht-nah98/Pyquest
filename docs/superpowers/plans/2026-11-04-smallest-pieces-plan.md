# Dạy từ mảnh nhỏ nhất — kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Thư viện chỉ còn mảnh gốc, bé tự viết `draw_bird`/`draw_pipe`; bảng 📞 Cuộc gọi; 📘 Thư viện có "Vì sao có" và "Xem bên trong"; khóa 20 bài.

**Spec:** `docs/superpowers/specs/2026-11-04-from-smallest-pieces-design.md` (HLV duyệt 04/11).

**Architecture:** Runtime ghi lời gọi hàm của bé bằng `sys.settrace` (đã có) vào `RunResult.calls`; mỗi lệnh vẽ mang `by` = lời gọi cha. Checker so tên ảnh theo nhóm (`bird` khớp `bird-rong`). Khối `pq_def` có tham số; khối gọi lệnh tự đặt (`pq_call`) sinh động từ các `def` trong code.

## Global Constraints

- Không subagent khi HLV chưa cho phép. Không `pkill -f vite`. Không `cd content/`.
- AI không bỏ cờ `draft`. Bài 1 quay lại `draft: true`; Bài 0 giữ mở.
- Unit và e2e chạy lần lượt. Prettier chỉ trên tệp đổi.
- Chữ cho bé tiếng Việt, code tiếng Anh. Mọi code bài học bắt đầu bằng `from pyquest import *`.

## Review Focus

1. Code bé gõ tay kiểu `def f(x,y):` (không cách) không được bị viết lại khi đồng bộ khối → chỉ thành khối khi dòng đầu khớp đúng dạng sinh ra.
2. Vòng lặp lớn gọi hàm hàng nghìn lần → bảng Cuộc gọi có trần (300 lời gọi), sân vẫn vẽ đủ.
3. Bé gọi hàm trước khi `def` (NameError) → lỗi tiếng Việt chỉ đúng dòng.
4. `draw_image` với đường dẫn sai → vẫn gợi ý tên đúng (giữ hành vi của `use_sprite`).
5. Goal `shifts` chạy code hai lần: dòng `x = 100` không có hoặc có hai lần → goal không qua, không sập.

---

### Task 1: Runtime — mảnh gốc và ghi lời gọi

**Files:** `packages/runtime/src/pyquest/pyquest.py.ts`, `host.py.ts`, `types.ts`, `runner.ts`, `errors.ts`, `index.ts`; test `runner.test.ts`.

- [ ] Test: `draw_image("images/bird.png", 10, 20)` → event `{t:'sprite', sprite:'bird', x:10, y:20, frame:0}`; `flip=True` → `flip: true`; sai đường dẫn → gợi ý (`images/rong.png` → `images/bird-rong.png`); `draw_bird` không còn trong thư viện: gọi mà chưa `def` thì là NameError thường ("chưa có tên draw_bird"), không phải MissingImport.
- [ ] Test: `def draw_bird(x, y):` + 3 `draw_rect` + gọi 2 lần → `calls` = 2 phần tử `{id, parent:null, name:'draw_bird', args:{x:100,y:300}, line}`; 6 rect, mỗi rect có `by` đúng id; lời gọi lồng có `parent`; trần 300 lời gọi (`callsTruncated: true`).
- [ ] Implement: `draw_image(path, x, y, frame=0, flip=False)`; bỏ `draw_bird`, `draw_sprite`, `use_sprite`, `_state["alias"]`. `__all__` mới: `WIDTH, HEIGHT, clear, draw_rect, draw_image, draw_text, key_pressed, random_int, print`.
- [ ] Implement: tracer `call`/`return` cho frame trong file của bé (trừ `<module>`), ngăn xếp ở `pyquest._state["stack"]`, `_emit` gắn `by`. Args: chỉ số/chữ/bool, còn lại `repr` ≤ 30 ký tự. `step()` ghi lời gọi của khung đó.
- [ ] Export `librarySource(name): string | undefined` (cắt từ `PYQUEST_SOURCE`).
- [ ] Commit.

### Task 2: Checker và schema goal

**Files:** `packages/content-schema/src/goal.ts`, `library.ts`; `packages/checker/src/check.ts`; tests.

- [ ] Sprite khớp theo nhóm: `s === g || s.startsWith(g + '-')` ở mọi goal có `sprite`. Bỏ `customImage`; thêm `image?: string` cho `drew` (đúng một ảnh, ví dụ bé chọn không phải ảnh gốc: `notImage: "bird"`). Quyết định: `drew.customImage` đổi nghĩa thành "ảnh khác ảnh gốc `sprite`" (`e.sprite !== goal.sprite`).
- [ ] Goal `drewRects {min}`: một khung có ≥ min rect (không tính rect phủ cả sân).
- [ ] Goal `called {name, min?=1, distinct?: boolean}`: có ≥ min lời gọi `name`; `distinct` = các lời gọi có args khác nhau.
- [ ] Goal `sameShape {name}`: mọi lời gọi `name` vẽ ra cùng một bộ hình, chỉ dời theo (dx, dy) — chứng minh tọa độ tương đối.
- [ ] Goal `shifts {var, by, axis}` + `shiftSource(code, var, by): string | undefined` + `checkGoals(goals, result, shifted?)`: hình vẽ (rect/sprite) của lần chạy thứ hai dời đúng `by` theo `axis`.
- [ ] `LibraryEntry`: thêm `why` (bắt buộc, ≤ 240) và `inside?` (câu giải thích phần lạ, ≤ 200).
- [ ] Commit.

### Task 3: Khối

**Files:** `packages/blocks/src/defs.ts`, `generator.ts`, `toolbox.ts`, `state.ts`; `toblocks.py.ts`; `roundtrip.test.ts`.

- [ ] `pq_draw_image`: "vẽ ảnh %PATH tại x %X y %Y" + field checkbox `FLIP` ("lật ngược") → `draw_image(p, x, y)` hoặc `…, flip=True)`. toblocks nhận đúng 3 args, keyword duy nhất `flip=True`.
- [ ] `pq_def`: field `PARAMS` (chữ, rỗng được) → `def NAME(PARAMS):`. toblocks: chỉ args vị trí không default, và dòng đầu đúng bằng chuỗi sinh ra (Review Focus 1).
- [ ] `pq_call` (khối tùy biến, extraState `{name, params: string[]}`): một input mỗi tham số; sinh `name(a, b)`. toblocks: lời gọi câu lệnh tới tên **được def trong file** (`_DEFS` thu trước khi duyệt), số args khớp số tham số.
- [ ] `pq_return` ("trả về %1") cho `overlap` ở bài 15.
- [ ] `callBlocksFor(tree): ToolboxEntry[]` — một khối gọi cho mỗi `def` có trong code; `toolboxFor(ids, calls)` thêm vào nhóm "Lệnh tự đặt".
- [ ] Bỏ `pq_draw_bird`, `pq_draw_sprite`, `pq_use_sprite`. Round-trip test cho mọi khối mới.
- [ ] Commit.

### Task 4: Trang web

**Files:** `apps/web/src/features/code/{CodeScreen,BlocksPane,LibraryPanel,RunPanel}.tsx`, mới `CallPanel.tsx`; `apps/web/src/stage/{Stage.tsx,render.ts}`; e2e.

- [ ] `CallPanel`: cây lời gọi (khung cuối ở chế độ game), lá = lệnh vẽ dạng `draw_rect(130, 314, 8, 8, "orange")`; bấm một dòng → `Stage` nhận `highlight: Set<callId>`, vẽ phần khác mờ 25%.
- [ ] Đặt CallPanel: tab "📞 Cuộc gọi" cạnh VarWatch dưới sân; ẩn khi chưa có lời gọi nào.
- [ ] LibraryPanel: mỗi mục có "Vì sao có" và nút "Xem bên trong" (mã từ `librarySource`, chỉ đọc, kèm `inside`).
- [ ] BlocksPane: toolbox cập nhật khối gọi theo các `def` của code hiện tại.
- [ ] Goal `shifts`: trang chạy thêm một lần với `shiftSource`.
- [ ] Bỏ `draft` khỏi tầm nhìn bé vẫn như cũ. E2e: Bài 4 viết `def draw_bird`, chạy, bấm dòng Cuộc gọi → `data-highlight` trên canvas; Thư viện "Xem bên trong".
- [ ] Commit.

### Task 5: Nội dung

**Files:** `content/reference/pyquest.json`, `content/courses/bay-qua-khe/{course.json,sample-game/main.py,lessons/l00..l19.json}`; `tools/content-check` (luật `why`, luật goal mới chạy được với `shifts`).

- [ ] Thư viện mới với `why`/`inside`. Game mẫu chỉ dùng mảnh gốc.
- [ ] Bài 0–5 viết lại theo spec §5 (gửi HLV xem trước), Bài 1 `draft: true`.
- [ ] Bài 6–19 đánh số lại và sửa theo spec §5; `course.json` parts mới.
- [ ] `content:check` xanh; thử phá: lời giải Bài 3 viết số cứng → `shifts` đỏ.
- [ ] Commit.

### Task 6: Tài liệu và rà soát

- [ ] ADR 0003 sửa đoạn thư viện; ADR mới 0004 "thư viện chỉ giữ mảnh gốc; bảng Cuộc gọi"; glossary (lời gọi, tham số, mảnh gốc).
- [ ] Đủ bộ kiểm; e2e đầy đủ; chụp màn Bài 3–5 ở 1280×720 và iPad.
- [ ] Rà soát cả nhánh (tự rà; hỏi HLV nếu muốn reviewer subagent).
