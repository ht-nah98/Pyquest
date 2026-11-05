# PyQuest

Nền tảng học **Python thật** cho học sinh cấp 2. Bé không học thuộc lý thuyết: bé học cách **làm ra một sản phẩm**,
từ bức tranh toàn cảnh tới một game chơi được, do chính mình viết.

Khóa đầu: **Bay Qua Khe**, game luồn khe (cơ chế kiểu Flappy, tên và hình là của mình), 26 bài, 54 bài tập.

## Có gì bên trong

- **Python thật trong trình duyệt** (Pyodide trong Web Worker): không cần cài gì, không cần Internet khi học trên lớp.
- **Khối ⇄ code hai chiều**: kéo khối thì code đổi, gõ code thì khối đổi (Blockly + CodeMirror).
- **Kết quả thành hình**: bấm ▶ Chạy là thấy hình vẽ, game chạy; bảng 📞 Cuộc gọi cho thấy hàm nào vẽ ra phần nào.
- **Học từ mảnh nhỏ nhất**: thư viện `pyquest` chỉ có `draw_rect`, `draw_image`, `clear`… Bé tự viết `draw_bird`,
  `draw_pipe` bằng `def`.
- **Nền tảng trước, game sau**: biến, `for`, `if/elif/else`, `and/or/not`, `return`, list, `while` (Bài 1–13), rồi
  dựng game (Bài 14–24) và ra mắt (Bài 25).
- **Một nội dung, hai chế độ**: Trình chiếu (HLV giảng trên lớp, có cửa sổ ghi chú) và Tự học (bé tự làm ở nhà).
- **Chấm tự động**: mỗi bài tập có mục tiêu (giống hình mẫu 👀, gọi hàm đủ lần, chim không chìm qua đất…).
- Chạy trên **laptop ≥1280×720** và **iPad nằm ngang ≥1080×730**.

## Bắt đầu

Cần Node 22 (`.nvmrc`) và Python 3 (chỉ cho công cụ ảnh).

```bash
npm install          # cũng chép Pyodide và media của Blockly vào apps/web/public
cp apps/web/.env.example apps/web/.env.local   # rồi đặt VITE_COACH_PIN
npm run dev          # http://localhost:5173
```

Cho cả lớp dùng qua Wi-Fi: `PQ_HOST=1 tools/coach-dev.sh` (cổng 5174, chạy từ một bản chụp của HEAD). Chi tiết:
[`docs/architecture/deployment-ops.md`](docs/architecture/deployment-ops.md).

## Lệnh

| Lệnh | Làm gì |
|---|---|
| `npm run dev` | chạy app ở cổng 5173 |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc -b` |
| `npm run test` | unit test (Vitest, headless) |
| `npm run content:check` | kiểm mọi bài: lời giải đạt, code khởi đầu chưa đạt, khối ⇄ code khớp, hình tồn tại |
| `npm run e2e` | Playwright, laptop 1280×720 + iPad 1080×730, server riêng cổng 5199 |
| `npm run build` | build production vào `apps/web/dist` |

CI trên GitHub chạy đủ các lệnh trên mỗi lần đẩy (`.github/workflows/ci.yml`).

## Cấu trúc

```
apps/web/              app React: hồ sơ, lộ trình, slide, màn code, chơi toàn màn hình
packages/runtime/      chạy Python (Pyodide), thư viện pyquest, code → khối
packages/blocks/       khối Blockly, sinh code, toolbox
packages/checker/      chấm mục tiêu bài tập (headless)
packages/content-schema/  schema zod cho khóa, bài, bài tập, mục tiêu
content/               nội dung bài học (JSON) và kho hình đã xử lý
assets/                ảnh gốc và prompt vẽ ảnh
tools/                 content-check, xử lý ảnh, coach-dev.sh
docs/                  tài liệu: bản đồ ở docs/README.md
```

## Tài liệu

- Người mới và AI agent: đọc [`AGENTS.md`](AGENTS.md) trước.
- Bản đồ tài liệu (tài liệu nào là nguồn chuẩn cho chủ đề nào): [`docs/README.md`](docs/README.md).
- Thêm bài mới: [`docs/conventions/content-authoring.md`](docs/conventions/content-authoring.md).
- Quyết định kiến trúc: [`docs/adr/`](docs/adr/).

## Dữ liệu của trẻ

App chỉ lưu biệt danh, avatar, tiến độ và code bé viết. Không analytics, không quảng cáo. Hiện tiến độ nằm trong
trình duyệt của từng máy; đồng bộ qua Supabase đang làm (`docs/roadmap/dot-2.md`).
