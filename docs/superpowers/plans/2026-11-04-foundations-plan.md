# Nền tảng trước, game sau — kế hoạch

> REQUIRED SUB-SKILL: superpowers:executing-plans.

**Spec:** `docs/superpowers/specs/2026-11-04-foundations-first-design.md` (HLV duyệt 04/11).

## Global Constraints
Như `2026-11-04-smallest-pieces-plan.md`: không subagent khi chưa được phép; không `pkill -f vite`; AI không bỏ cờ
`draft`; unit và e2e chạy lần lượt; prettier chỉ trên tệp đổi; mọi code bài bắt đầu bằng `from pyquest import *`.

## Review Focus
1. Bé đang làm bài tập 2 thì đóng trang: mở lại phải về bài tập 2 với code của bé, không về bài 1.
2. Bài tập `typing`: kéo khối không được, nhưng khối vẫn theo code; lỗi cú pháp vẫn khóa khối như cũ.
3. `matches` không phụ thuộc thứ tự vẽ, nhưng phân biệt màu, kích thước, chỗ đặt; nền `clear` khác màu thì không đạt.
4. Dữ liệu cũ của bé (`files` một bài) không làm sập màn code: chuyển sang bài tập đầu.
5. `if/elif/else` có 2+ `elif` vẫn thành khối và quay về đúng code.

### Task 1: Schema bài tập + checker `matches`
- `ExerciseSchema` = các trường của `code` cũ + `id`, `title`, `task`, `input: 'blocks' | 'typing'`; lesson có
  `exercises` (≥ 1) thay cho `code`. Bước `code` có ⇔ có `exercises`.
- `checkGoals(goals, result, extra?: { shifted?, expected? })`; goal `matches` so tập "mảnh" (rect/sprite/text +
  màu nền `clear` cuối) không theo thứ tự. `needsExpected(goals)`.
- `content:check` kiểm từng bài tập; script chuyển bài cũ.

### Task 2: Khối mới
`%`, `pq_while`, `pq_not`, `pq_bool`, `pq_if_chain` (if + n elif + else tùy chọn, extraState), `pq_call_expr`
(gọi lệnh có `return` như một giá trị). Round-trip test cho từng khối.

### Task 3: Màn code nhiều bài tập
Thanh bài tập (`?ex=`), lưu code từng bài tập, mở bài sau khi đạt; `typing` → Blockly `readOnly` + nhãn; nút
"👀 Xem hình cần vẽ" (Stage `ghost`); chuyển dữ liệu cũ. E2e.

### Task 4: Nội dung
Bài 1–4 nền tảng trước (HLV xem), rồi 5–13, rồi phần game (11 bài) + Ra mắt. `content:check` xanh, thử phá.

### Task 5: Tài liệu, kiểm đủ, server HLV.
