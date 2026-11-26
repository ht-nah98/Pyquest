# Chấm "Giống mẫu" theo % và nút 🔑 Xem đáp án

**Ngày:** 26/11/2026 · **HLV duyệt:** 26/11/2026 ("Duyệt, làm đi")

## 1. Vì sao

HLV dùng tài khoản học sinh làm bài vẽ đàn chim: vẽ gần đúng (đúng vị trí, đúng số lượng) mà không qua được,
và không có cách nào sang bài tập sau. Nguyên nhân:

- Mục tiêu `matches` ("Giống hình mẫu 👀", 40 bài tập) đòi tranh **trùng tuyệt đối** với lời giải: lệch 1 điểm
  ảnh, vẽ thêm một hình hay đổi màu trời đều trượt.
- Trượt thì bé không biết sai bao nhiêu.
- Bài tập sau bị khóa cho tới khi bài trước qua; chỉ HLV mở được.

## 2. HLV đã chọn

1. **Chấm theo %, giống Xưởng vẽ:** đạt **≥ 90%** là qua.
2. **🔑 Xem đáp án** hiện sau **5 lần ▶ chưa qua**: mở code lời giải, chỉ đọc, để đối chiếu. Bé vẫn phải tự
   sửa và chạy cho qua.

HLV **không** chọn: cho vẽ thêm trang trí mà không trừ điểm; đánh dấu 🟡 rồi cho đi tiếp khi vẫn kẹt.
Hệ quả HLV đã được báo: thêm `clear("skyblue")` hay một đám mây to vẫn trượt.

## 3. Cách làm

**Một hàm so** (§9.11): `likeness()` chuyển từ `apps/web` sang `packages/checker`, so hai lưới ô. Mỗi ô có
một màu hoặc trống. Hai ô khớp khi màu "gần nhau" và cách nhau tối đa 2 ô. Hình chiếm 85 điểm, màu trời 15.
Xưởng vẽ giữ cách so màu RGB của mình, bằng cách truyền hàm so màu vào.

**Vẽ ra lưới, không cần trình duyệt** (luật vàng 1, 4): `rasterize(events, stage, sprites)` trong
`packages/checker`. Nó vẽ khung hình cuối cùng lên lưới ô **4 × 4 điểm ảnh**: sân 400 × 600 thành 100 × 150 ô,
nên "lệch 2 ô" nghĩa là lệch tới 8 điểm ảnh.

- Ô được tô khi tâm ô nằm trong hình. Nét (đường, cung, viền) tô các ô cách nét không quá nửa bề dày, và ít
  nhất nửa ô.
- Hình nhỏ hơn một ô vẫn tô ô chứa tâm của nó, để không hình nào biến mất.
- Chữ là một khối cỡ ước lượng, căn giữa như trên sân.
- Hình trong kho là một khối đúng cỡ trên sân (rộng × cao × scale), "màu" là tên hình. Cỡ hình lấy từ
  `extra.sprites`; thiếu thì dùng 24 × 24, như ô đỏ "chưa nạp" của sân.
- Màu so bằng tên, viết thường. Sân không có `clear()` thì trời là màu mặc định của sân.

**Mỗi màu tính riêng (bài học):** ở bài học, màu là tên màu. Điểm hình là **trung bình theo từng màu**, nên
mọi màu nặng như nhau dù to hay nhỏ. Lý do: khi đo thử, code khởi đầu của Bài 10 · "Điểm trong khung" đã được
97%, vì khung xám to lấn hết 8 chấm đỏ/đen là ý chính của bài. Tính theo màu thì chỉ còn 43%. Xưởng vẽ vẫn
tính theo từng điểm ảnh.

Tranh giờ được so như **nhìn thấy**: hình vẽ sau che hình vẽ trước. Vẽ miệng rồi vẽ mặt đè lên là mất miệng.

**Chấm:** `matches` qua khi `matchScore(r, expected) ≥ 90`. Hàm `matchScore` được export để màn code hiện
**"Giống mẫu N% · cần 90%"** sau mỗi lần chạy.

**🔑 Xem đáp án**
- Màn code đếm số lần ▶ chưa qua của bài tập đang mở. Đủ 5 lần thì hiện nút 🔑 Xem đáp án trong thẻ
  🎯 Nhiệm vụ. HLV thấy nút ngay từ đầu.
- Bấm thì cột phải hiện ngăn "🔑 Đáp án": code lời giải chỉ đọc, đặt cạnh code của bé, có ✕ để quay lại
  🎯 Nhiệm vụ.
- Ngăn này không có nút chép.
- Ngăn có ở mọi bài tập code.

**content:check:** giữ hai luật cũ, lời giải qua hết mục tiêu và code khởi đầu chưa qua. Ngưỡng mới được áp
vào cả hai luật.

## 4. Ví dụ phải đúng (thành test, Bài 5 · Đàn chim)

| Bé làm | Kết quả |
|---|---|
| Đúng lời giải | 100%, qua |
| Lệch 5 điểm ảnh | qua |
| Thiếu 1 con chim | trượt |
| Vẽ ở y = 300 thay vì 200 | trượt |
| Thêm `clear("skyblue")` | trượt (tối đa 85%) |

Đo code khởi đầu của cả 40 bài tập sau khi đổi: cao nhất 57% (Bài 3 · Ô đi kèm, Bài 10 · Bên phải tới đâu,
Hầm Ngọc · Mỗi người một hộp). Thấp nhất 0% (Bài 9 · Ngày và đêm, lỗi khi chạy).

## 5. Ngoài phạm vi

Cho vẽ thêm mà không trừ điểm, đánh dấu 🟡, ngưỡng riêng cho từng bài, lưu lại việc bé đã mở đáp án.
