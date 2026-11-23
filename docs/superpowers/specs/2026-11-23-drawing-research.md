# Nghiên cứu: vẽ và sáng tạo bằng code

Ngày 23/11/2026 · Trạng thái: **bản nháp nghiên cứu, chờ HLV chọn hướng** · Người viết: AI

HLV (23/11): *"học sinh của tôi rất thích sáng tạo và vẽ bằng code. Tôi muốn thiết kế 1 game chuyên để vẽ, hoặc xây
dựng các hình dạng… một cách tự do sáng tạo và có hướng dẫn cơ bản bằng code."*

## 1. Nền tảng đang có gì (đếm từ code)

| Có sẵn | Chưa có |
|---|---|
| `clear`, `draw_rect`, `draw_image`, `draw_text` (`packages/runtime/src/pyquest/pyquest.py.ts`) | hình tròn / elip, đường thẳng, tam giác / đa giác, viền (chỉ có tô kín), độ trong suốt, xoay |
| Sân 400 × 600 đứng (`STAGE_WIDTH/HEIGHT`, hợp game Bay Qua Khe) | sân vuông hoặc nằm ngang cho tranh |
| Phát lại lệnh vẽ có độ trễ (`replayDelay.ts`): bé thấy tranh hiện dần | "rùa" (bút di chuyển + quay) |
| Goal `matches`: tranh của bé giống tranh mẫu, nút 👀 hiện mờ tranh mẫu | bài tập tự do không có đáp án đúng |
| Khóa là dữ liệu: thêm khóa = thêm thư mục `content/courses/<id>/` | chỗ vẽ tự do ngoài bài học, lưu nhiều tranh, triển lãm, tải ảnh PNG |

Lưu ý kỹ thuật: route bài học là `/l/:lessonId`, nên id bài của khóa mới phải khác `l00…l25` của Bay Qua Khe.
Module `turtle` thật của Python cần tkinter, **không chạy được trong Pyodide**.

## 2. Các cách dạy vẽ bằng code đã được dùng rộng rãi

| Cách | Ví dụ | Mạnh | Yếu với lớp mình |
|---|---|---|---|
| **Rùa** (bút đi tới, quay góc) | Python `turtle`, Scratch bút vẽ, Code.org Artist | Bé đã quen bút vẽ của Scratch; hình sao, đa giác, hoa văn xoay ra từ vòng lặp + góc (360 / n); tranh hiện dần như có người vẽ | khó đặt hình đúng chỗ; cần hiểu góc |
| **Tọa độ** (hình tại x, y) | Processing / p5.js, PyQuest hiện nay | nối tiếp Bài 1 (tọa độ, y hướng xuống); dễ chấm "giống tranh mẫu" | hoa văn xoay cần lượng giác |
| **Ô pixel** (lưới ô màu) | pixel art, Bài 6 lưới ô | rất dễ, hợp phong cách pixel của PyQuest; dạy danh sách | ít "bay bổng" |
| **Nghệ thuật sinh ra** (ngẫu nhiên + lặp) | generative art, Coding Train | mỗi lần chạy ra một tranh mới, bé rất thích | cần seed để chấm (đã có `random.Random(seed)`) |

Kết luận: **tọa độ trước, rùa sau** là đường đi tự nhiên. Tọa độ nối với cái bé đã học; rùa mở ra hoa văn xoay mà
tọa độ khó làm. Pixel và ngẫu nhiên là các bài vui chen vào.

**Đề xuất cho rùa:** viết một module `turtle` nhỏ của mình, **cùng tên lệnh với Python thật** (`forward`, `left`,
`right`, `penup`, `pendown`, `pencolor`, `pensize`, `goto`, `circle`). Code bé viết ở PyQuest chạy được nguyên văn trong
Python cài trên máy (IDLE), đúng quy tắc vàng 6. Lệnh rùa chỉ sinh ra các lệnh vẽ đường thẳng, nên vẫn tất định và chấm
được như hiện nay.

## 3. Ba hình dạng sản phẩm

**A. Khóa mới "Họa sĩ Code"** — như Bay Qua Khe: bài có Hiểu → Thiết kế → Code → Chơi thử, bài tập "vẽ giống mẫu",
cuối mỗi bài một bài tập **tự do** (không đáp án, chỉ cần chạy được và vẽ đủ N hình).

**B. "Xưởng vẽ" tự do** — một thẻ riêng ở trang Các khóa học. Mở ra là màn code trống với đủ khối vẽ, lưu nhiều tranh,
có thẻ "💡 Thử thách" để gợi ý (vẽ ngôi nhà, bông hoa…). Không có bài, không chấm.

**C. Cả hai** — Xưởng vẽ dùng được ngay; khóa ngắn dạy dần các lệnh, mỗi bài mở thêm lệnh mới trong Xưởng vẽ.

## 4. Đề cương thử (nếu chọn A hoặc C, ~10 bài)

| # | Bài | Python | Tranh của bé |
|---|---|---|---|
| 0 | Họa sĩ máy tính | xem tranh làm bằng code; quy trình phác → code → chỉnh | lộ trình |
| 1 | Hình cơ bản | `draw_circle`, `draw_line`, `draw_triangle` | ngôi nhà, mặt trời |
| 2 | Màu sắc | tên màu, mã màu `#ff8800`, viền và tô | cầu vồng |
| 3 | Lặp ra hoa văn | `for`, biến | hàng rào, vòng tròn đồng tâm |
| 4 | Tự đặt lệnh vẽ | `def`, tham số | `draw_star(x, y, size)` → bầu trời sao |
| 5 | Tranh pixel | danh sách chuỗi → lưới ô | nhân vật pixel của em |
| 6 | Chú rùa | `forward`, `left`, góc | hình vuông, tam giác, ngôi sao (360 / n) |
| 7 | Xoay và lặp lồng | `for` lồng + `left` | bông hoa, mandala |
| 8 | Ngẫu nhiên | `random_int`, seed | tranh trừu tượng, mỗi lần chạy một tranh |
| 9 | Đối xứng | gương trái-phải, kính vạn hoa | hoa văn đối xứng |
| 10 | Triển lãm | — | tranh tự chọn đề, trưng cho cả lớp |

Có thể thêm đề tài Việt Nam cho tranh: hoa văn trống đồng, đèn lồng Hội An, ruộng bậc thang.

## 5. Việc kỹ thuật sẽ phải làm (ước lượng)

1. Thư viện: `draw_circle`, `draw_line`, `draw_polygon` (+ viền/tô), module `turtle`; khối Blockly cho từng lệnh; Python → khối.
2. Sân vẽ: cỡ sân theo khóa (vd. 600 × 600) thay vì cố định 400 × 600. **Đổi kiến trúc runtime → cần ADR.**
3. Bài tập tự do: goal mới (vd. "vẽ ít nhất N hình", "dùng vòng lặp"), không cần `matches`.
4. Nếu có Xưởng vẽ: route mới, lưu nhiều tranh mỗi bé (ProgressStore + Supabase), nút tải PNG.
5. Nếu có triển lãm: bé xem tranh của bạn cùng lớp → đổi quyền Supabase (RLS). Chỉ biệt danh + tranh + code, đúng quy tắc 8.

## 6. HLV đã chọn (23/11)

1. **Hình dạng C:** thẻ "🎨 Xưởng vẽ" (vẽ tự do, lưu nhiều tranh) **và** khóa "Họa sĩ Code". Học xong lệnh nào ở
   khóa thì Xưởng vẽ có thêm lệnh đó.
2. **Tọa độ trước, rùa sau.** Rùa dùng cùng tên lệnh với `turtle` thật của Python.
3. **Triển lãm:** bé bấm "Trưng tranh này" thì cả lớp xem được tranh và code; tranh khác chỉ bé và HLV thấy.
4. **Song song từ đầu:** khóa vẽ tự dạy lại tọa độ, biến, `for`… theo cách riêng; bé học xen kẽ hai khóa.

Hệ quả cho đề cương §4: Bài 1–4 phải dạy từ con số 0 (tọa độ, biến, `for`, `def`), không giả định bé đã học Bay Qua Khe.

## 7. Chia đợt làm (đề xuất, chờ HLV duyệt)

| Đợt | Làm gì | Bé thấy gì |
|---|---|---|
| 1 | Lệnh vẽ tọa độ (`draw_circle`, `draw_line`, `draw_polygon`, viền) + khối; cỡ sân theo khóa (ADR) | — |
| 2 | Xưởng vẽ: route, lưu nhiều tranh, tải PNG | thẻ 🎨 Xưởng vẽ |
| 3 | Khóa "Họa sĩ Code" Bài 0–5 (tọa độ), bài tập tự do | khóa mới, nửa đầu |
| 4 | Module `turtle` + khối rùa; Bài 6–9 | nửa sau của khóa |
| 5 | Triển lãm (quyền Supabase), Bài 10 | 🖼️ Triển lãm |

Còn phải hỏi HLV khi tới đợt tương ứng: cỡ sân vẽ, tên khóa, danh sách "💡 Thử thách" trong Xưởng vẽ.
