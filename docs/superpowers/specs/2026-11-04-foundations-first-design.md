# Thiết kế: nền tảng trước, game sau

Ngày 04/11/2026. Trạng thái: **HLV đã duyệt 04/11**. Nối tiếp `2026-11-04-from-smallest-pieces-design.md`.

## 1. Vì sao đổi

HLV (04/11): *"kéo thả mỗi khối thế này các kiến thức như if, else, vòng lặp, for, logic thì các con học khi nào?"*

Rà 20 bài hiện có:
- Mỗi bài chỉ **1 bài tập**, thường là điền 1–3 dòng.
- `else`, `elif`, `while` **không bài nào dạy**. Danh sách, `return`, `class` có sẵn trong code mẫu, bé không tự viết.
- `if` tới Bài 10 mới có, logic tới Bài 15: khái niệm đi theo nhịp làm game, không theo nhịp học.

HLV chọn: **phần nền tảng trước** (mỗi bài một khái niệm, nhiều bài tập), **phần game sau**; trong bài, **bài tập
đầu kéo khối, bài tập sau phải gõ Python**.

## 2. Mục tiêu và điều không làm

**Mục tiêu**
- Mỗi khái niệm có một bài riêng, **3–5 bài tập khó dần**, kết quả là **hình trên sân** (ô màu, hàng rào, bàn cờ,
  con chim), không phải chữ in ra.
- Hết phần nền tảng, bé **tự gõ** được biến, phép tính, `def` có tham số và `return`, `for` (cả lồng nhau),
  `if/elif/else`, so sánh, `and/or/not`, danh sách, `while`.
- Phần game chỉ **dùng lại** khái niệm đã học, mỗi bài nhắc lại khái niệm đó bằng một câu.

**Không làm**
- Không đổi game đích, nhịp 5 bước của bài, kho ảnh.
- Không thêm `draw_pixel`: `draw_rect` vẫn là mảnh thấp nhất (HLV đã chọn ở thiết kế trước).

## 3. Thứ tự bài

**A. Bức tranh toàn cảnh** — Bài 0 giữ nguyên.

**B. Nền tảng Python** (13 bài, mỗi bài 3–5 bài tập; ví dụ bài tập ở cột phải)

| # | Bài | Bài tập (ví dụ) |
|---|---|---|
| 1 | Tọa độ và gọi lệnh | 1 ô vàng ở (100, 300) · đèn giao thông 3 ô · mặt đất dài hết sân bằng `WIDTH` · tô nền |
| 2 | Biến | ô đặt bằng `x, y` · đổi một biến dời 2 ô · biến `color` · `print` giá trị |
| 3 | Phép tính | ô thứ hai cách ô đầu 50 · chim ghép từ ô theo `x + …` (máy dời `x` để kiểm) · `*`, `/`, `%` |
| 4 | Tự đặt lệnh | `def draw_square(x, y)` · `def draw_bird(x, y)` gọi 3 lần · thêm tham số `color` |
| 5 | Lặp với `for` | hàng 8 ô · hàng rào cao dần `i * 10` · đàn chim `for` + `draw_bird` · `range(a, b)` |
| 6 | `for` lồng nhau | lưới ô 5 × 5 · tòa nhà nhiều cửa sổ · bậc thang |
| 7 | `if` / `else` | nửa trái đỏ, nửa phải xanh · ô chẵn lẻ bằng `i % 2` · chim quay mặt theo hướng |
| 8 | `elif` và so sánh | trời / núi / đất theo `y` · huy chương vàng / bạc / đồng theo điểm · `==`, `!=` |
| 9 | Đúng / sai: `and`, `or`, `not` | ô nằm trong khung · bàn cờ `(i + j) % 2` · biến `is_night` đổi màu trời |
| 10 | `return`: lệnh tính ra kết quả | `def center(x, w)` · `def inside(px, py, x, y, w, h)` trả `True/False` (chuẩn bị va chạm) |
| 11 | Danh sách | vị trí cột trong `[ ]` rồi `for` vẽ · `append` · `len` |
| 12 | Lặp với `while` | vẽ ô tới khi chạm mép · đếm số bước · so sánh `for` và `while` |
| 13 | Vì sao có ảnh | (Bài 5 hiện tại) đổi ruột `draw_bird` sang `draw_image`, chỗ gọi giữ nguyên |

**C. Làm game Bay Qua Khe** (11 bài, mỗi bài 1–3 bài tập): Hoạt hình (`update/draw`, `global`) · Trọng lực · Chạm
đất (`if`) · Nút bay · Vẽ cột (`def draw_pipe`) · Nhiều cột (danh sách) · Ngẫu nhiên · Đụng cột (dùng lại
`inside` của Bài 10) · Điểm và giao diện · Gói thành đối tượng (`class`) · Thư viện của em và màn hình.

**D. Ra mắt** — giữ nguyên.

Tổng: **26 bài** (hiện 20). Với nhịp một bài mỗi buổi, phần nền tảng khoảng 3 tháng trước khi bắt đầu làm game.

## 4. Bài tập trong một bài

- Bước Code của bài có **danh sách bài tập** thay cho một bài duy nhất. Màn code có thanh "Bài tập 1 · 2 · 3 · 4";
  làm đạt mục tiêu bài này thì mở bài sau. HLV nhảy bài nào cũng được.
- Mỗi bài tập có: đề, các bước (📋), gợi ý, code bắt đầu, mục tiêu, lời giải, cách nhập.
- **Cách nhập** (`input`):
  - `blocks`: như hiện nay, kéo khối hoặc gõ đều được.
  - `typing`: chỉ gõ Python. Khung khối vẫn hiện khối theo code để bé **đối chiếu**, nhưng không kéo thả được;
    hàng trên khung ghi "✍️ Bài này em gõ code".
  - Quy ước: 1–2 bài tập đầu của bài là `blocks`, các bài sau `typing`. Phần game chủ yếu `typing`.
- Code mỗi bài tập lưu riêng; mở lại bài tập thì thấy code em đã viết.
- `content:check` kiểm **từng** bài tập như kiểm một bài hiện nay (lời giải đạt, code bắt đầu chưa đạt, khối giữ
  nguyên code).

## 5. Chấm bài tập vẽ hình

- Goal mới **`matches`**: hình em vẽ **giống hình của lời giải** (cùng các ô / ảnh / chữ, cùng chỗ, cùng màu, thứ tự
  vẽ không quan trọng). Hợp với bàn cờ, hàng rào, lưới, nơi một chuỗi goal nhỏ sẽ rất dài. Trang chạy lời giải để
  lấy hình mẫu. Kèm nút **"👀 Xem hình cần vẽ"**: hình mẫu hiện mờ trên sân để bé so.
- Giữ các goal đã có (`drewRects`, `called`, `sameShape`, `shifts`, `varEquals`, …) cho chỗ cần chặt hơn, ví dụ
  `shifts` chặn chim gõ số cố định, `called` buộc dùng `def`.

## 6. Khối cần thêm

`%` trong khối phép tính · `pq_if_elif_else` · `pq_while` · `pq_not` · `pq_bool` (True/False) · danh sách
(`[...]`, `append`, `len`, `for x in list`) · lệnh tự đặt **có kết quả** (khối gọi dạng giá trị, cho `return`).
Bài tập `typing` không cần khối cho mọi thứ: chưa có khối thì thành khối "code chữ" như hiện nay.

## 7. Ảnh hưởng

- Bài 1–5 hiện tại gộp vào phần B (Bài 1–4, 13). Bài 6–19 hiện tại thành phần C, bỏ phần dạy lại khái niệm.
- Schema bài đổi (`code` → nhiều bài tập); lưu tiến độ thêm theo từng bài tập. Bài cũ chuyển sang dạng mới bằng script.
- Mọi bài trừ Bài 0 vẫn là bản nháp chờ HLV duyệt.
- ADR mới cho "bài tập nhiều phần" và goal `matches`.

## 8. Việc để người làm tự quyết

Hình cụ thể của từng bài tập, câu chữ trong giới hạn schema, màu, số bài tập mỗi bài trong khoảng 3–5.
