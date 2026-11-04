# Nhịp của một bài và hai chế độ xem

## Nhịp 5 bước

| Bước | `StepKind` | Bé làm gì | Bắt buộc? |
|---|---|---|---|
| Hiểu | `understand` | xem / thao tác hình động giải thích cơ chế | **có** |
| Thiết kế | `design` | quyết định luật / hình dạng trước khi code | nên có |
| Chuẩn bị | `prepare` | hình trong kho, file, thư mục, đường dẫn | khi bài cần |
| Code | `code` | khối ⇄ Python, chấm mục tiêu tự động | khi bài có code |
| Chơi thử & chỉnh | `playtest` | chạy toàn màn hình, chỉnh số, đánh dấu lộ trình | **có** |

Lý do: HLV muốn dạy **tư duy làm sản phẩm**, không chỉ code (spec §1). Schema chặn bài thiếu `understand` hoặc
`playtest`.

## Hai chế độ

- **Trình chiếu** (`?mode=present`, chỉ hồ sơ HLV): chữ to, ←/→/Space chuyển slide, phím `N` mở cửa sổ ghi chú giảng
  (đồng bộ qua `BroadcastChannel`). Không chặn bằng câu hỏi; HLV hỏi cả lớp.
- **Tự học** (`?mode=self`): bé bấm Tiếp. Slide có câu hỏi thì phải chọn đúng mới qua; chọn sai hiện lời giải thích.
  Vị trí slide được lưu, tải lại trang vẫn ở đúng chỗ.

Nội dung viết **một lần** trong JSON; hai chế độ chỉ khác cách hiển thị.
