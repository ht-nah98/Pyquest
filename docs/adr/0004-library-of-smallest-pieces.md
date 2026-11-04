# 0004. Thư viện chỉ giữ mảnh gốc; bé tự viết draw_bird; bảng 📞 Cuộc gọi

04/11/2026 · Chấp nhận (HLV duyệt `docs/superpowers/specs/2026-11-04-from-smallest-pieces-design.md`)

## Bối cảnh
HLV: *"làm từ scratch tức là kể cả những hàm như draw_bird(x, y) cũng cần dạy các con viết ra… cần phải dạy con hiểu
tại sao có hàm đó, hàm đó làm gì chứ không chỉ dạy cách dùng."* Thư viện cũ có sẵn `draw_bird`, `draw_sprite`,
`use_sprite`: bé gọi được mà không biết chúng từ đâu ra.

## Quyết định
- `pyquest` chỉ giữ những gì Python thường **không tự làm được**: `clear`, `draw_rect`, `draw_image(đường_dẫn, x, y,
  frame=0, flip=False)`, `draw_text`, `key_pressed`, `random_int`, `WIDTH`/`HEIGHT`, cùng `print` thành bong bóng.
  Bỏ `draw_bird`, `draw_sprite`, `use_sprite`. Ảnh chọn bằng đường dẫn trong `draw_image`.
- Bé tự viết `draw_bird` (Bài 3–5: ghép ô vuông → `def` → thay ruột bằng `draw_image`) và `draw_pipe` (Bài 12).
- Mỗi mục trong 📘 Thư viện có **Vì sao có** (`why`, bắt buộc) và **Xem bên trong**: mã thật cắt từ `pyquest.py`
  (`librarySource`), kèm câu giải thích phần lạ (`inside`).
- Runtime ghi **lời gọi hàm của bé** bằng `sys.settrace` sẵn có: `RunResult.calls` (tối đa 300 mỗi lần chạy / mỗi
  khung), mỗi lệnh vẽ mang `by` = lời gọi đã vẽ ra nó. Trang hiện cây 📞 Cuộc gọi; bấm một dòng thì phần hình của nó
  sáng, phần khác mờ, dòng gọi được tô trong code.
- Khối: `pq_draw_image`, `pq_def` có tham số, `pq_return`, và `pq_call` sinh tự động cho mỗi `def` trong code (như
  "My Blocks" của Scratch). Toolbox luôn chia nhóm.
- Chấm bài: ảnh khớp theo nhóm (`bird` khớp `bird-rong`), goal mới `drewRects`, `called`, `sameShape`, `shifts` (chạy
  lại với biến dời đi: mọi mảnh phải dời theo, nên bé gõ số cố định thì không qua).

## Hệ quả
- Khóa thành 20 bài; Bài 1–19 là bản nháp chờ HLV duyệt lại (Bài 1 đã duyệt trước đó cũng quay lại nháp).
- Code bài từ Bài 6 trở đi mang sẵn `def draw_bird` (và từ Bài 13 `def draw_pipe`) của bé ở đầu file.
- Goal `shifts` chạy chương trình hai lần (trang và `content:check` như nhau).
- Toolbox luôn chia nhóm: khay luôn mở rộng bằng khối dài nhất, và `draw_rect` dài tới mức che kín vùng ghép.
