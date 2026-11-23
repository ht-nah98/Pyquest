# Nghiên cứu: game roguelite (khóa game thứ hai)

Ngày 23/11/2026 · Trạng thái: **bản nháp nghiên cứu, chờ HLV chọn hướng** · Người viết: AI

HLV (23/11): *"game tiếp theo làm như game roguelite: người chơi điều khiển một nhân vật đi đánh quái, vượt phó bản, lên
kinh nghiệm rồi chọn ngẫu nhiên skill, các nhánh skill, phối hợp lựa chọn để có bộ skill vượt ải tốt nhất. Thêm nhánh
talent, năng khiếu, nhân vật…"* Kèm hai nguồn hình: Pixel Art Atlas (Hugging Face) và Pixel effects (patch.gg).

## 1. Nền tảng có chạy nổi không? — Có

- **Tốc độ (đo 23/11, Node, `PyRunner.step`, sân 600 × 600):** 50 quái 0,53 ms/khung · 150 quái 1,30 ms · 300 quái
  2,43 ms. Mỗi khung có 16,7 ms (60 FPS), nên Python thật chạy thoải mái vài trăm vật thể.
- **Đã có:** vòng `update()` / `draw()`, `draw_image` có khung hình (hoạt hình), `random_int` có seed, danh sách, `class`,
  `def`, cỡ sân theo khóa (ADR 0009), âm thanh 8-bit, phím Space và 4 mũi tên.
- **Phải thêm:**
  - phóng to ảnh pixel cho sắc nét: tham số `scale` trong `draw_image`, vẽ không làm mịn (`imageSmoothingEnabled = false`);
  - chọn thẻ skill khi lên cấp: phím `1`/`2`/`3`, hoặc mũi tên + Space, và chạm vào thẻ trên iPad (cần biết chỗ chạm `x, y`);
  - (về sau) lưu dữ liệu giữa các lượt chơi cho cây talent: ví dụ `save_data()` / `load_data()`.

## 2. Hai nguồn hình

| | Pixel Art Atlas 1.4M | Pixel effects (patch.gg) |
|---|---|---|
| Là gì | 1,4 triệu hình 16 × 16 nền trong suốt, **AI sinh** (Krea 2 Turbo + LoRA pixel art), có chú thích tiếng Anh: quái, vật phẩm, biểu tượng… | 232 hiệu ứng pixel **vẽ bằng code** (lửa, nổ, băng, sét, chém, trúng đòn, hồi máu, nhặt đồ…), đổi được bảng màu |
| Giấy phép | **CC0 1.0** (thả tự do), kèm lưu ý: không cấp quyền với thương hiệu / tài liệu bên thứ ba; vẫn theo Krea 2 Community License (§2.3 dùng thương mại) và Acceptable Use Policy của Krea | **MIT**; một số hiệu ứng phỏng theo tác phẩm MIT của Hugo Duprez, phải giữ tệp NOTICE |
| Hợp với mình? | Hợp phong cách pixel + VT323. Chỉ là **hình tĩnh** (không có khung chạy / đánh). Tải về 259 MB (ZIP), nên chỉ chọn vài chục hình đưa vào kho | Hợp làm hiệu ứng skill. Dựng sẵn thành ảnh nhiều khung (công cụ `tools/render.mjs` của họ), **không** thêm thư viện vào app |
| Cần cẩn thận | chọn tay từng hình hợp với trẻ (trong mẫu có "combat knife", "giant black widow spider"); không lấy hình giống nhân vật game có sẵn (quy tắc vàng 11); HLV nên đọc §2.3 của Krea | ghi công MIT + NOTICE trong repo |

Cách làm đề xuất: giống kho hình hiện nay (`docs/playbooks/add-asset.md`). Tải **một lần** về máy (ngoài repo), AI lọc theo
chú thích, ghép thành bảng xem trước, **HLV chọn**, rồi chỉ đưa ~60–100 hình đã chọn vào `content/assets/library/`.

## 3. Bản đơn giản (v1) đề xuất

**Vòng chơi:** chọn nhân vật → vào ải → quái kéo tới từng đợt → nhân vật tự đánh quái gần nhất → quái chết rơi ngọc kinh
nghiệm → đủ kinh nghiệm thì **lên cấp: dừng game, hiện 3 thẻ skill ngẫu nhiên, chọn 1** → hết đợt thì gặp trùm → thắng
thì qua ải sau (3 ải = một phó bản).

**Skill:** 3 nhánh (🔥 Lửa, ❄️ Băng, ⚡ Sét), mỗi nhánh 3–4 skill, mỗi skill lên được vài cấp. Có 2 skill cùng nhánh thì
mở **phối hợp** (vd. Lửa + Lửa → nổ lan). Nhân vật: 3 lớp (⚔️ Kiếm sĩ, 🔮 Pháp sư, 🏹 Cung thủ), khác chỉ số và skill
đầu. **Talent / năng khiếu** (điểm giữ lại sau mỗi lượt chơi để nâng chỉ số gốc) để **v2**.

**Bé học được gì (cái Bay Qua Khe chưa dạy kỹ):** `dict` cho chỉ số; danh sách các `dict` / `class` cho quái và đạn;
xóa phần tử khỏi danh sách khi quái chết; khoảng cách và hướng (`math.sqrt`); trạng thái game (đang chơi / lên cấp /
thua); **dữ liệu khác code**: bảng skill là dữ liệu, thêm skill không cần viết lại game; ngẫu nhiên có trọng số.

## 4. HLV đã chọn (23/11)

1. **Đấu trường từng ải:** mỗi ải một đấu trường, quái tới từng đợt, cuối ải có trùm; 3 ải = một phó bản.
2. **v1:** vòng chơi, lên cấp chọn 1 trong 3 thẻ, 3 nhánh skill có phối hợp, 3 nhân vật. Talent / năng khiếu để v2.
3. **Hình:** dùng cả hai nguồn. Pixel Art Atlas tải một lần ngoài repo, AI lọc, **HLV chọn** ~60–100 hình. Pixel effects
   dựng sẵn ~10 hiệu ứng, giữ giấy phép MIT và NOTICE.
4. **Học sau Bay Qua Khe.**

Còn phải hỏi HLV: tên game, cỡ sân, đề cương bài, cách chọn thẻ trên iPad.
