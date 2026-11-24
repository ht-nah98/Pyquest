# 0009. Cỡ sân theo khóa và các lệnh vẽ tọa độ

23/11/2026 · Chấp nhận (HLV chọn 23/11)

## Bối cảnh
Các bé thích vẽ bằng code. HLV (23/11) chọn làm thẻ "🎨 Xưởng vẽ" và khóa "Họa sĩ Code"
(`superpowers/specs/2026-11-23-drawing-research.md` §6). Thư viện `pyquest` chỉ có `draw_rect`, `draw_image`,
`draw_text`: không vẽ được hình tròn, đường thẳng, tam giác. Sân cố định 400 × 600 đứng (`STAGE_WIDTH/HEIGHT`), hợp
Bay Qua Khe nhưng chật cho tranh. HLV chọn **sân vuông 600 × 600** cho phần vẽ, và **tọa độ trước, rùa sau**.

## Quyết định
- **Cỡ sân là của khóa:** `course.json` có `stage: { width, height }` (tùy chọn, số nguyên 100–1200). Không có thì
  400 × 600 (`DEFAULT_STAGE`), nên Bay Qua Khe không đổi gì. Xưởng vẽ và khóa vẽ dùng 600 × 600.
- **Mỗi lần chạy mang cỡ sân:** `RunOptions.stage` (và `startGame(…, { stage })`). Thư viện ghi `WIDTH`, `HEIGHT`
  trong `_reset` của lần chạy đó, trước khi code của bé chạy; `from pyquest import *` đọc giá trị lúc import, và file
  của bé được nạp lại mỗi lần chạy, nên hai lần chạy khác cỡ trên cùng một `PyRunner` không lẫn nhau.
- **Lệnh vẽ tọa độ mới** (mảnh gốc, ADR 0004): `draw_circle(x, y, r, color="orange")` (tâm ở (x, y)),
  `draw_line(x1, y1, x2, y2, color="black", width=3)`, `draw_triangle(x1, y1, x2, y2, x3, y3, color="purple")`,
  `draw_polygon(points, color="purple")` với `points` là danh sách cặp `(x, y)`. Sai đầu vào (bán kính âm, ít hơn 3
  góc, góc không phải cặp số…) là lỗi tiếng Việt ngắn. Lệnh vẽ mới: `circle`, `line`, `polygon` (tam giác là `polygon`).
- **Khối** (cách của ADR 0003/0008): `pq_draw_circle`, `pq_draw_line` (không ghi độ dày), `pq_draw_line_width`,
  `pq_draw_triangle`, trong nhóm Vẽ. `draw_polygon` tạm là khối "code chữ". Lời gọi thiếu màu hay dùng tên tham số
  (`draw_circle(300, 300, 50)`, `r=50`) cũng là code chữ, để viết lại đúng như bé gõ.
- **Chấm bài:** `checkGoals(…, { stage })` dùng cỡ sân của khóa (`drewRects` bỏ khối nền to bằng sân). Goal `matches`
  và `shifts` so cả hình tròn, đường thẳng, đa giác. `content:check` chạy lời giải với cỡ sân của khóa.
- **📘 Thư viện:** mục của lệnh chưa có bài dạy được bỏ trống `lesson` (bài nào cũng không liệt kê nó, cho tới khi có
  bài). `librarySource('WIDTH', stage)` hiện đúng số của khóa.
- **Rùa để sau:** module `turtle` nhỏ cùng tên lệnh với Python thật, chỉ sinh ra lệnh `line`; ADR riêng khi làm.

## Hệ quả
- `STAGE_WIDTH/HEIGHT` còn lại như bí danh cũ (deprecated) của `DEFAULT_STAGE`; chỗ nào cần cỡ sân phải lấy từ khóa.
- Trang web phải truyền `course.stage` vào mọi lần chạy, cho sân vẽ đúng tỉ lệ, và vẽ được ba loại lệnh mới.
- Lệnh vẽ mới chưa có bài dạy: thêm bài thì điền `lesson` cho các mục trong `content/reference/pyquest.json`.

## Bổ sung 24/11/2026

`course.sampleStage` (tùy chọn): sân riêng của **game mẫu**, khi nó cần màn rộng hơn sân của bài học (Hầm Ngọc: 1600 × 900 từ 24/11 tối, trước đó 960 × 540;
bài học vẫn 600 × 600). Thiếu thì game mẫu dùng `stage`. `content:check` chạy game mẫu đúng sân này.
