# 0008. Mọi bài tập đều kéo khối được, song song với code

23/11/2026 · Chấp nhận (HLV chọn 23/11) · Sửa một phần ADR 0005

## Bối cảnh
ADR 0005 cho bài tập `input: "typing"` khóa khung khối (Blockly `readOnly`, khay rỗng). Có 34/55 bài tập như vậy, gồm
toàn bộ phần game (Bài 14–24). HLV (23/11): *"nhiều màn chỉ code mà không kéo thả. Tôi muốn thiết kế tất cả màn đều có
thẻ kéo thả và code song song."* Phần game còn nhiều đoạn chưa có khối thật, hiện thành khối "code chữ".

## Quyết định
- **Bài tập nào cũng kéo khối được và gõ được.** Bỏ `readOnly`; khay khối luôn có.
- `input` giữ nguyên trong schema, nhưng `"typing"` giờ chỉ là **gợi ý**: hàng trên khung khối ghi "✍️ Thử gõ code nhé,
  kéo khối cũng được", thanh bài tập vẫn có dấu ✍️. HLV chọn hướng này thay cho bỏ hẳn trường `input` hay thu gọn khay.
- **Khối mới** cho các đoạn phần game hay dùng: số thập phân trong khối số (`0.5`), `xs[i] = …` (`pq_index_set`),
  `return` trống (khối `trả về` để trống ô), `draw_text(chữ, x, y, cỡ)` (`pq_draw_text_size`), `str(…)` (`pq_str`), và
  chuỗi `a and b and c` thành các khối `và` lồng nhau.
- `class`, `bird.y`, `bird.update()`, `from bird import Bird` (Bài 23–24) **vẫn là khối "code chữ"**: kéo, di chuyển
  được, sửa bằng cách gõ (HLV chọn).
- **Luật 11 của `content:check`:** khay của mỗi bài tập phải có mọi khối mà code khởi đầu và lời giải dùng (trừ code chữ
  và khối gọi lệnh tự đặt, vì chúng tự sinh ra từ code).

## Hệ quả
- 34 bài tập được điền khay; bài tập gõ ở phần nền tảng dùng chung khay với các bài tập trước trong cùng bài.
- Số thập phân chỉ thành khối khi viết lại ra đúng như bé gõ (`0.5`, `-2.25`); `1.0`, `0.50`, `1e-7` vẫn là code chữ.
- Khối `trả về` để trống viết ra `return` (trước đây viết `return None`).
