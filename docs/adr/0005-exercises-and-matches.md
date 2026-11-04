# 0005. Bài có nhiều bài tập; chấm bằng "giống hình mẫu"

04/11/2026 · Chấp nhận (HLV duyệt `docs/superpowers/specs/2026-11-04-foundations-first-design.md`)

## Bối cảnh
HLV: *"kéo thả mỗi khối thế này các kiến thức như if, else, vòng lặp, for, logic thì các con học khi nào?"* Mỗi bài chỉ
có một bài tập điền 1–3 dòng; `else`, `elif`, `while` không bài nào dạy; khái niệm đi theo nhịp làm game.

## Quyết định
- Khóa chia **nền tảng trước** (Bài 1–13, mỗi bài một khái niệm) rồi **làm game** (Bài 14–24) và Ra mắt (25).
- `lesson.code` thành `lesson.exercises` (≥ 1). Mỗi bài tập có `id`, `title`, `task`, `input` (`blocks` | `typing`) và các
  trường của `code` cũ. Màn code có thanh "Bài tập"; bài sau mở khi bài trước đạt (HLV mở bài nào cũng được); code lưu
  riêng từng bài tập (`LessonState.exercises`), dữ liệu cũ (`files`) tính là của bài tập đầu.
- `typing`: khối hiện theo code nhưng Blockly `readOnly`, không có khay. Quy ước: 1–2 bài tập đầu `blocks`, sau đó `typing`;
  phần game toàn `typing`.
- Goal `matches`: hình cuối của bé giống hình của lời giải (cùng mảnh, chỗ, màu, nền; thứ tự vẽ tự do). Trang và
  `content:check` chạy lời giải để lấy hình mẫu; nút 👀 hiện mờ hình mẫu trên sân.
- Khối mới: `%`, `while`, `not`, `True/False`, chuỗi `if/elif/else` (`pq_if_chain`), gọi lệnh có `return` như giá trị
  (`pq_call_expr`). Danh sách chưa có khối: thành khối code chữ.

## Hệ quả
- 26 bài, 54 bài tập; Bài 1–25 là bản nháp chờ HLV duyệt.
- `content:check` kiểm từng bài tập (lời giải đạt, code bắt đầu chưa đạt, khối giữ nguyên code).
- Lời giải nằm trong gói của trang (để vẽ hình mẫu); bé mở công cụ lập trình viên thì xem được. Chấp nhận: đây là lớp học.
