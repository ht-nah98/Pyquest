# 0013. Lệnh vẽ người: hình elip, cung tròn, viền

26/11/2026 · Chấp nhận (HLV duyệt thiết kế 26/11)

## Bối cảnh
Các bé muốn vẽ gia đình và ngôi nhà (`superpowers/specs/2026-11-26-studio-trace-and-pictures-design.md`). Với
`draw_rect`, `draw_circle`, `draw_line`, `draw_polygon` (ADR 0009) bé vẽ được mặt tròn, nhưng không vẽ được mặt dẹt,
thân người, miệng cười, và không có viền.

## Quyết định
- `draw_ellipse(x, y, w, h, color="pink", border=None)`: hình elip **tâm (x, y)**, rộng `w`, cao `h`. Lấy tâm như
  `draw_circle` (không lấy góc trên trái như `draw_rect`), vì bé hay ghép elip với hình tròn: mặt, mắt, đám mây.
- `draw_arc(x, y, r, start, end, color="black", width=3)`: một phần đường tròn. Góc tính bằng **độ**, 0 là bên phải,
  **tăng theo chiều kim đồng hồ** (y hướng xuống, giống canvas), nên `draw_arc(x, y, 15, 0, 180)` là nụ cười.
- `border="màu"` (tùy chọn) ở `draw_rect`, `draw_circle`, `draw_ellipse`, `draw_triangle`, `draw_polygon`: viền dày 3.
  `color=None` là không tô, chỉ có viền; thiếu `border` thì báo lỗi tiếng Việt.
- Nhật ký lệnh vẽ: thêm `ellipse`, `arc`; trường `border?` trên `rect`, `circle`, `ellipse`, `polygon`; `color: "none"`
  cho hình rỗng. Hàm `_paint` trong `pyquest.py` thêm màu tô và viền rồi gửi đi.
- Chấm bài `matches` / `shifts` so cả hình elip, cung tròn và màu viền.
- Khối: `pq_draw_ellipse`, `pq_draw_arc` (không có độ dày) trong nhóm Vẽ. Lời gọi có `border=`, `None`, độ dày cung, hay
  thiếu màu là khối "code chữ", viết lại đúng như bé gõ (như ADR 0009). Khối có viền để sau.

## Hệ quả
- Lệnh mới chưa có bài dạy: mục 📘 không có `lesson`, chỉ hiện ở Xưởng vẽ và với HLV.
- "Xem bên trong" của `draw_rect` (Bài 1) giờ có `_paint`, không còn `_emit` trực tiếp; câu `inside` đã đổi theo.
