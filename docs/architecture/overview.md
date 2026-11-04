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
