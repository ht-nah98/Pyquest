# Thiết kế: dạy từ những mảnh nhỏ nhất

Ngày 04/11/2026. Trạng thái: **chờ HLV duyệt**. Bổ sung cho `2026-11-04-pyquest-design.md`.

## 1. Vì sao đổi

HLV (04/11): *"làm từ scratch tức là kể cả những hàm như draw_bird(x, y) cũng cần dạy các con viết ra… dạy từ
những thứ cấu phần nhỏ nhất… cần phải dạy con hiểu tại sao có hàm đó, hàm đó làm gì chứ không chỉ dạy cách dùng."*

Bản hiện tại cho bé dùng `draw_bird`, `draw_sprite`, `use_sprite` có sẵn. Bé gọi được nhưng không biết chúng từ đâu ra.

HLV đã chọn: **vẽ chim bằng ô vuông trước, rồi mới dùng ảnh**.

## 2. Mục tiêu và điều không làm

**Mục tiêu**
- Mọi lệnh "của game" (`draw_bird`, `draw_pipe`, va chạm, điểm…) do bé **tự viết** bằng `def`.
- Thư viện `pyquest` chỉ giữ những mảnh bé **không tự làm được bằng Python thuần**: tô điểm ảnh, đọc phím, đọc ảnh.
- Lệnh nào trong thư viện cũng trả lời được ba câu: **làm gì**, **vì sao có**, **bên trong trông ra sao**.
- Khi chạy, bé **nhìn thấy** một hàm gọi những hàm nào, với số nào, và mỗi lời gọi vẽ ra phần nào trên sân.

**Không làm**
- Không bắt bé vẽ từng điểm ảnh (`draw_pixel`): HLV không chọn hướng này.
- Không đổi nhịp bài (hiểu → thiết kế → chuẩn bị → code → chơi thử), không đổi game đích.

## 3. Thư viện mới (mảnh gốc)

| Lệnh | Vì sao có (câu cho bé) |
|---|---|
| `clear(màu)` | Mỗi khung hình phải xóa tranh cũ, không thì chim để lại vệt. |
| `draw_rect(x, y, rộng, cao, màu)` | Màn hình là lưới điểm. Tô từng điểm thì quá lâu, nên có lệnh tô cả một khối. |
| `draw_image(đường_dẫn, x, y, frame=0, flip=False)` | Một con chim thật có khoảng 1.760 điểm màu. Vẽ bằng ô vuông thì quá lâu, nên ảnh được lưu thành file và có lệnh dán cả file lên. |
| `draw_text(chữ, x, y, cỡ, màu)` | Mỗi chữ cái là một hình nhỏ. Có lệnh vẽ sẵn để mình khỏi tự vẽ chữ. |
| `key_pressed(phím)` | Python thuần không đọc được bàn phím của trang web; thư viện làm cầu nối. |
| `random_int(a, b)` | Máy tính không tự "đoán"; thư viện có cách tạo số trông như ngẫu nhiên. |
| `WIDTH`, `HEIGHT` | Kích thước sân, để khỏi nhớ số 400 và 600. |

Bỏ khỏi thư viện: `draw_bird`, `draw_sprite`, `use_sprite` (bé tự viết `draw_bird`; ảnh chọn bằng đường dẫn trong
`draw_image`). `update` / `draw` vẫn là hàm **bé viết**, thư viện chỉ gọi chúng mỗi khung hình.

Bảng `📘 Thư viện` có thêm hai mục cho mỗi lệnh:
- **Vì sao có**: trường `why` trong `content/reference/pyquest.json`, `content:check` bắt buộc.
- **Xem bên trong**: mã thật của lệnh đó lấy từ `pyquest.py` (chỉ đọc), kèm một câu giải thích phần lạ
  (ví dụ `_emit` = "gửi lệnh vẽ cho trang web"). Ý chính: *thư viện cũng chỉ là một file Python người khác viết.*

## 4. Trực quan khi bé viết hàm: bảng "📞 Cuộc gọi"

Khi bấm ▶ Chạy, cạnh sân có bảng cây:

```
📞 draw_bird(x=100, y=300)
   ├ draw_rect(100, 310, 30, 20, "red")      ← thân
   ├ draw_rect(130, 314, 8, 8, "orange")     ← mỏ
   └ draw_rect(108, 300, 14, 10, "red")      ← cánh
```

- Số trong ngoặc là **giá trị đã tính** (`x + 30` hiện thành `130`), để bé thấy tham số chảy vào hàm.
- Bấm một dòng thì phần hình mà lời gọi đó vẽ **sáng lên** trên sân, phần còn lại mờ đi.
- Chế độ game chỉ ghi khung hình cuối cùng (không ghi 30 lần mỗi giây).
- Kỹ thuật: dùng `sys.settrace` (đã có để giới hạn số dòng), ghi lời gọi hàm **trong file của bé** cùng tham số;
  mỗi lệnh vẽ mang chỉ số lời gọi cha. Có giới hạn số dòng để vòng lặp lớn không làm bảng phình ra.

## 5. Thứ tự bài mới (20 bài)

| # | Bài | Bé tự viết / học được | Lệnh thư viện mới |
|---|---|---|---|
| 0 | Làm game là làm gì? | (giữ nguyên) | `print`, `import` |
| 1 | Màn hình là giấy kẻ ô | vẽ một ô vuông tại (x, y) | `draw_rect`, `clear` |
| 2 | Hộp đựng số | `x`, `y` là biến; đổi `x` thì ô dời | |
| 3 | Vẽ chim bằng ô vuông | ghép 3–5 ô quanh `x + …`, `y + …` (tọa độ tương đối) | |
| 4 | Tự đặt lệnh | `def draw_bird(x, y):`, gọi 2 lần thành 2 con chim | |
| 5 | Vì sao có ảnh | file, thư mục, đường dẫn; chọn nhân vật; **đổi ruột** `draw_bird` sang `draw_image`, chỗ gọi giữ nguyên | `draw_image` |
| 6 | Tính rồi gán lại | (bài 4 cũ) | |
| 7 | Lặp lại | vẽ hàng chim bằng `for` + `draw_bird` | |
| 8 | Hoạt hình là gì | `update` / `draw`; thư viện gọi chúng 30 lần/giây | |
| 9 | Trọng lực | (bài 7 cũ) | |
| 10 | Nếu… thì… | (bài 8 cũ) | |
| 11 | Nút bay | (bài 9 cũ) | `key_pressed` |
| 12 | Vẽ cột | `def draw_pipe(x, gap_y)`: hai ảnh, một ảnh lật | |
| 13 | Nhiều cột | (bài 11 cũ) | |
| 14 | Ngẫu nhiên | (bài 12 cũ) | `random_int` |
| 15 | Đụng cột | tự viết `def overlap(...)`: hai hình chữ nhật chạm nhau khi nào | |
| 16 | Giao diện | điểm, chữ | `draw_text` |
| 17 | Gói thành đối tượng | (bài 15 cũ) | |
| 18 | Thư viện của em | tách `draw_bird`, `draw_pipe` ra file `nhanvat.py` rồi `import` như `pyquest` | |
| 19 | Ra mắt | (giữ nguyên) | |

Bài 3 → 4 → 5 là trục chính: **ghép từ mảnh nhỏ → gói thành hàm → thay ruột hàm mà không đổi chỗ gọi.**
Bài 18 khép vòng: bé tự viết thư viện, hiểu `pyquest` cũng chỉ là một file như thế.

## 6. Chấm bài

- Goal mới `called {name, minTimes?}`: bé đã định nghĩa **và** gọi hàm `name` (lấy từ bảng Cuộc gọi).
- Goal `drew` hiện so tên sprite `bird`; chuyển sang so **ảnh** (`image: "bird"` theo nhóm trong kho) hoặc
  **số ô** (`drewCount kind: rect`).
- Bài 3 kiểm "chim dời theo x": chạy lời giải với hai giá trị `x` khác nhau, mọi ô phải dời đúng bấy nhiêu
  (goal `movesWith {var}`). Lý do: chấm trạng thái cuối thì bé viết số cứng (`draw_rect(130, …)`) cũng qua.
- Game mẫu (`sample-game/main.py`) viết lại chỉ bằng mảnh gốc, tự định nghĩa `draw_bird` và `draw_pipe`.

## 7. Ảnh hưởng

- Bài 1 đã được duyệt sẽ đổi (`draw_rect` thay `draw_bird`) nên **quay lại bản nháp** chờ HLV duyệt lại.
  Bài 0 chỉ sửa câu nhắc tới `draw_bird`.
- Bài 2–17 cũ viết lại và đánh số lại thành 2–19, tất cả vẫn là bản nháp.
- Bỏ khối `pq_draw_bird`, `pq_draw_sprite`, `pq_use_sprite`; thêm khối `pq_draw_image`. Khối `pq_def` có tham số
  (hiện chỉ có `def` không tham số) và khối gọi hàm tự đặt có tham số.
- Cập nhật ADR 0003 (thư viện) và glossary.

## 8. Việc để người làm tự quyết

Màu và kích thước các ô của con chim; câu chữ từng màn trong khung độ dài schema; cách vẽ đường nối cây Cuộc gọi.
