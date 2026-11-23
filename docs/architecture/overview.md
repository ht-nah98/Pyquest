# Kiến trúc tổng thể

```
content/ (JSON) ──zod──▶ @pyquest/content-schema
                               │
apps/web ──▶ PyClient ──postMessage──▶ Web Worker ──▶ @pyquest/runtime (Pyodide + pyquest.py)
   │                                                     │ RunResult { events: DrawEvent[], vars, error }
   ├── Stage (Canvas 2D) ◀───────────────────────────────┘
   ├── @pyquest/blocks (Blockly ⇄ Python; Python → khối qua ast trong Pyodide)
   ├── @pyquest/checker (Goal[] × RunResult → ✅/⬜)
   └── ProgressStore (IndexedDB qua Dexie; Supabase sau)

tools/content-check ──▶ runtime + checker trên Node: chạy lời giải từng bài
```

## Ranh giới

- `packages/*` là **headless**: chạy trên Node, không DOM, không React (ESLint chặn).
- `@pyquest/runtime` không biết gì về worker. Phần nối worker (`self.onmessage`) nằm ở `apps/web/src/runtime/`.
- `@pyquest/checker` là hàm thuần, không chạy Python.
- Trang chỉ nói chuyện với lưu trữ qua interface `ProgressStore`; Supabase sẽ là một bản cài đặt khác của interface đó.

## Hai cách chạy

- **Kịch bản** (`script`, Bài 1–5): chạy module một lần, `pyquest` ghi các lệnh vẽ vào nhật ký, trang phát lại thành hình.
- **Game** (`game`, từ Bài 6 và game mẫu): chạy module để định nghĩa `update()` / `draw()`; mỗi khung hình trang gửi
  phím/chạm, worker gọi `update()` rồi `draw()` và trả lại lệnh vẽ của khung đó.

## Sân khấu (Stage)

- **Cỡ sân khấu theo khóa:** `course.stage` (`{ width, height }`), thiếu thì `DEFAULT_STAGE` 400 × 600 (Bay Qua Khe).
  `catalog.lessonStage(lessonId)` / `catalog.stageOf(courseId)` trả cỡ đó. Màn nào cũng đưa **cùng một cỡ** cho
  `<Stage size>` và cho mọi lần chạy (`python.run(…, { stage })`, `python.startGame(…, { stage })`,
  `loop.start(files, main, size)`), để `WIDTH` / `HEIGHT` trong Python khớp với canvas.
- `Stage` vẽ vào canvas theo đơn vị sân khấu (gốc trên-trái, y hướng xuống), co giãn giữ tỉ lệ, chừa viền
  (letterbox). Phép tính nằm ở `stage/geometry.ts` (có unit test).
- **Trợ giúp tọa độ** (`<Stage coords>`): nhãn `(0, 0)`, `x → W`, `y ↓ H` ở ba góc hình, và khi rê chuột / chạm ngón
  thì hiện `x … · y …` cùng hai đường gióng mờ. Bật ở màn code và màn xem code của HLV; tắt khi chơi toàn màn hình
  và ở slide game mẫu. Không chặn sự kiện chạm (chạm sân khấu vẫn vỗ cánh ở bài game).
- **⬇️ Tải tranh:** `StageHandle.picture()` vẽ lại hình đang có lên một canvas riêng đúng cỡ sân (1 điểm ảnh mỗi đơn vị,
  600 × 600 ở Xưởng vẽ), không có trợ giúp tọa độ, hình mẫu 👀 hay độ mờ 📞, rồi trả về PNG (data URL). Chưa vẽ gì thì
  trả `null`.

## Xưởng vẽ (🎨, đợt 2)

- **Nội dung:** `content/studio/studio.json` (schema `StudioSchema` trong `@pyquest/content-schema`): `stage` 600 × 600,
  `starter` (code của tranh mới), `toolbox` (khối được dùng), `challenges` (💡 Thử thách: `title` ≤ 40, `task` ≤ 200,
  `hint` ≤ 120). Không có mục tiêu, không chấm. `content:check` (luật 12) kiểm schema, khối trong `toolbox` có thật,
  `starter` đi qua khối rồi về lại code không đổi, `starter` chạy không lỗi trên sân của Xưởng vẽ, `toolbox` đủ khối
  `starter` dùng. Trang đọc qua `catalog.studio()`.
- **Route:** `/studio` (danh sách tranh: ＋ Tranh mới, mở, ✏️ đổi tên, 🗑️ xóa có hỏi lại), `/studio/:drawingId` (màn vẽ:
  🧩 khối | 🐍 Python | cột phải ▶ Chạy / ■ Dừng, ⬇️ Tải tranh, sân 600 × 600 có trợ giúp tọa độ, 💡 Thử thách). Chỉ chạy
  kiểu kịch bản. Thẻ "🎨 Xưởng vẽ" ở `/courses` đếm số tranh. HLV: `/coach/s/:userId` liệt kê tranh của bé,
  `/coach/s/:userId/studio/:drawingId` xem code (chỉ xem) và chạy.
- **Lưu trữ (không thêm bảng, không migration):** mỗi tranh là **một dòng tiến độ** `lessonId = "studio:<id>"` (≤ 40 ký
  tự, `lesson_states.lesson_id`) qua `ProgressStore` như bài học: code ở `files["main.py"]` + `workspace`, tên và giờ ở
  `state.studio = { title, createdAt, changedAt?, deleted? }`. Xóa = **bia mộ** `deleted: true` (code bị xóa), để lệnh xóa
  tới được máy khác của bé. `mergeLessonState`: tên và code theo bản mới hơn, `createdAt` giữ bản sớm nhất, đã xóa ở
  một máy thì luôn là đã xóa. Tối đa 50 tranh mỗi bé (`MAX_DRAWINGS`). Bản đồ khóa, `progress.ts`, trang HLV đi theo danh
  sách bài của khóa nên không bao giờ đọc dòng `studio:`. Logic ở `apps/web/src/features/studio/drawings.ts` (có unit test).

## Màn × nút (AGENTS.md §9.11)

Chức năng có ở nhiều màn là **một component**. Thêm màn mới thì thêm dòng.

| Màn | 🧩 khối ⇄ 🐍 code, 📘 Thư viện (`EditorPanes`) | ▶ Chạy / ■ Dừng (`RunButton`) | Sân (`Stage`) | Nút riêng |
|---|---|---|---|---|
| Màn code `/l/:id/code` | có | có | `coords` | ⛶ toàn màn hình, 👀 hình mẫu, 🎯 Nhiệm vụ / 📞 Cuộc gọi |
| Xưởng vẽ `/studio/:id` | có | có | `coords`, 600 × 600 | ⬇️ Tải tranh, 💡 Thử thách, ✏️ tên tranh |
| Chơi toàn màn hình `/l/:id/play` | không | không | không `coords` | Chơi lại, ← Về code |
| HLV xem code `/coach/s/…` | chỉ xem chữ | ▶ Chạy code của bé | `coords` | — |
