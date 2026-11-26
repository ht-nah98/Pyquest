# Xưởng vẽ: vẽ theo mẫu, lệnh vẽ người, kho hình pixel

Ngày 26/11/2026 · Trạng thái: **HLV duyệt 26/11** · Người viết: AI · Nối tiếp `2026-11-23-drawing-research.md`

## 1. Vì sao

HLV (26/11): các bé rất thích vẽ. Hôm qua các bé vẽ cảnh mây trời có chim và rất thích; bé còn muốn vẽ **gia đình** và
**ngôi nhà**. HLV muốn bé vẽ được nhiều thứ hơn, và muốn ba thứ:

1. **Vẽ theo mẫu:** tranh mẫu hiện mờ, bé vẽ đè lên.
2. **Vẽ sáng tạo:** vẽ tự do, như Xưởng vẽ hiện nay.
3. **Kho hình:** ảnh và nền có sẵn để bé lấy dùng, lấy từ **bộ sưu tập pixel** (Pixel Art Atlas 1.4M, CC0, HLV đã chọn
   cho Hầm Ngọc ngày 23/11). Phải có **chỗ để bé xem hình trong kho và biết cách lấy hình ra**. HLV thấy "kết hợp vẽ code
   và pixel rất hay".

## 2. Mục tiêu / không làm / thất bại nếu

- **Mục tiêu:** bé vẽ được người (mặt, thân, miệng cười) và nhà bằng code; chọn được "vẽ theo mẫu" và thấy mẫu mờ, biết
  tranh mình giống mẫu bao nhiêu %; mở 🖼️ Kho hình ngay trong màn vẽ, thấy hình, thấy dòng code lấy hình, bấm một nút
  là hình vào tranh.
- **Không làm đợt này:** module rùa, độ trong suốt, xoay hình, bé tải ảnh của mình lên, triển lãm, khóa "Họa sĩ Code".
- **Thất bại nếu:** % giống mẫu khắt khe tới mức bé vẽ gần đúng mà vẫn thấy 10% (nản); Kho hình che mất tranh làm bé
  không thấy hình mới đặt vào đâu; hình pixel nhòe khi phóng to; mẫu dùng lệnh mà bé không có trong hộp khối.

## 3. Ràng buộc (AGENTS.md)

Lệnh mới là Python thật, nằm trong thư viện `pyquest` (quy tắc 6), tất định (2). Mẫu và danh sách hình là dữ liệu trong
`content/` (3), phải qua `content:check` (4). Lệnh mới phải có khối và chuyển được Python → khối (ADR 0008). Ảnh giữ cỡ
pixel thật, đo lại gói sau `build` (§9.6). Màn vẽ nằm trọn trong 1280×720 (§9.10). Ngăn Kho hình dùng `z-[85]` như
📘 Thư viện (§9.12). Chữ cho bé là tiếng Việt, ngắn (7). Hình pixel phải chọn tay, hợp với trẻ, không giống nhân vật game
có sẵn (11).

## 4. Các cách đã cân nhắc (HLV chọn 26/11)

**Tranh mẫu**
- **Mẫu vẽ bằng code** ✅ (HLV chọn): mẫu là một đoạn code dùng chính các lệnh bé có. Bé vẽ đè được khít, máy đo được %
  giống, HLV xem được code đáp án.
- Mẫu là ảnh minh họa: đẹp hơn nhưng bé không vẽ khít được, không đo được %.
- Cả hai: nhiều việc, để sau.

**Chỗ đặt Kho hình**
- **Ngăn trượt trong màn vẽ** ✅ (HLV chọn): nút 🖼️ Kho hình cạnh 📘 Thư viện. Bé vẫn thấy tranh trong lúc chọn hình.
- Trang riêng `/studio/kho`: xem rõ hơn, nhưng bé phải chép code rồi quay lại màn vẽ.
- Cả hai.

## 5. Thiết kế

### 5.1. Lệnh vẽ mới (ADR 0013, nối ADR 0009)

| Lệnh | Vẽ gì | Dùng cho |
|---|---|---|
| `draw_ellipse(x, y, w, h, color="pink")` | hình elip **tâm (x, y)**, rộng `w`, cao `h` (cùng kiểu tâm như `draw_circle`) | mặt, thân người, mây dẹt, bụi cây |
| `draw_arc(x, y, r, start, end, color="black", width=3)` | cung tròn tâm (x, y), góc độ từ `start` tới `end`; 0 là bên phải, **tăng theo chiều kim đồng hồ** (vì y hướng xuống) | miệng cười `draw_arc(x, y, 15, 0, 180)`, cầu vồng, cửa vòm |
| `border="black"` (tùy chọn) ở `draw_rect`, `draw_circle`, `draw_ellipse`, `draw_triangle`, `draw_polygon` | viền dày 3 quanh hình | khung cửa sổ, nét mặt |
| `color=None` ở các hình trên | chỉ vẽ viền, không tô | vòng tròn rỗng |

Sai đầu vào (w/h âm, góc không phải số, `color=None` mà không có `border`) là lỗi tiếng Việt ngắn. Lệnh vẽ mới trong
nhật ký: `ellipse`, `arc`; viền là trường `border` trên lệnh đã có. Chấm `matches` / `shifts` so được cả hai lệnh mới.
Khối mới: `pq_draw_ellipse`, `pq_draw_arc`; khối có `border` để sau (gọi có `border=` là "code chữ", như ADR 0009). Thêm
mục vào `content/reference/pyquest.json` (📘 Thư viện).

### 5.2. Vẽ theo mẫu

- `content/studio/studio.json` có thêm `templates: [{ id, title, level (1–3), code, hint }]`. `code` là Python vẽ
  tranh mẫu; `content:check` chạy nó, đòi nó **chỉ dùng lệnh có trong hộp khối** của Xưởng vẽ, vẽ ra ít nhất 3 hình.
- Trang danh sách tranh có hai nút:

  ```
  ┌ 🎨 Xưởng vẽ ─────────────────────────────────────────────┐
  │ [✏️ Vẽ sáng tạo]   [📐 Vẽ theo mẫu]                       │
  │ Tranh của em: …                                           │
  └───────────────────────────────────────────────────────────┘
  📐 Vẽ theo mẫu → lưới thẻ mẫu (ảnh nhỏ + tên + ⭐ độ khó) → bấm một thẻ → tranh mới có mẫu
  ```
- Tranh vẽ theo mẫu lưu id mẫu trong `StudioMeta.template` (tùy chọn; tranh cũ không có thì là tranh sáng tạo). Code
  khởi đầu là `starter` bình thường: bé tự vẽ.
- Màn vẽ của tranh có mẫu có nút **👀 Mẫu** (bật sẵn): mẫu mờ phía sau tranh của bé, dùng lại `Stage.ghost()` của bài
  học. Sau mỗi lần ▶ hiện **"Giống mẫu 72%"** và một câu khích lệ ngắn (≥ 90%: 🎉).
- **Cách tính %:** vẽ tranh của bé và mẫu lên hai canvas nhỏ 150×150, so màu từng điểm ảnh **chỉ ở chỗ mẫu có hình
  hoặc bé có hình** (không tính nền trống), hai màu gần nhau tính là khớp. Lệch vài điểm ảnh vẫn được điểm cao. Hàm so
  màu là hàm thuần có unit test; phần vẽ canvas ở trang web. Không phải chấm bài: chỉ để bé tự xem.
- Mẫu đợt đầu (HLV đọc lại trước khi cho bé thấy): ⭐ ☀️ Mây trời và chim · ⭐ 🏠 Ngôi nhà · ⭐⭐ 👨‍👩‍👧 Gia đình ba người ·
  ⭐⭐ 🌈 Cầu vồng trên đồi · ⭐⭐⭐ 🏡 Nhà và cây bên hồ · ⭐⭐⭐ 🏮 Phố đèn lồng.

### 5.3. 🖼️ Kho hình (ngăn trượt trong màn vẽ)

```
┌ Xưởng vẽ ─────────────────────────────────────────────┐
│ [Khối|Python] 📘 Thư viện 🖼️ Kho hình   │ ▶ 👀  ⬇️     │
│ ┌──────────┬─ 🖼️ Kho hình ─────────┐    │ ┌──────┐     │
│ │ code…    │ 🌳 🏠 🐶 👪 ☁️ 🖼️       │    │ │tranh │     │
│ │          │ [■][■][■][■][■]…        │    │ └──────┘     │
│ │          │ 🐶 Chó con              │    │              │
│ │          │ draw_image("images/     │    │              │
│ │          │  pet-dog.png", 300,     │    │              │
│ │          │  300, scale=4)          │    │              │
│ │          │ [➕ Thêm vào tranh]      │    │              │
│ └──────────┴─────────────────────────┘    │              │
└────────────────────────────────────────────────────────┘
```

- Một component `PicturePanel`, mở từ nút 🖼️ trong `EditorPanes`, chỉ hiện khi màn đó cho phép (Xưởng vẽ; bài học thì
  không, để không lệch bài). Thêm dòng vào bảng màn × nút (§9.11).
- Hình xếp theo nhóm có nhãn tiếng Việt: 🌳 Cây và hoa, 🏠 Nhà và đồ vật, 🐶 Con vật, 👪 Người, ☁️ Trời, 🖼️ Ảnh nền. Mỗi
  hình có `label` tiếng Việt. Ô hình vẽ phóng to, không làm mịn (ADR 0010).
- Bấm hình: hiện tên, cỡ thật (16×16 → "phóng to bằng scale=4 thành 64×64"), dòng code lấy hình, nút 📋 Chép và
  **➕ Thêm vào tranh**: thêm một dòng `draw_image(...)` vào **cuối** code (cả Python lẫn khối, qua đường đồng bộ có
  sẵn). Ảnh nền thì thêm `draw_image("images/bg-….png", 0, 0)` **ngay sau** `clear(...)`, để nền nằm dưới mọi hình. Hướng
  dẫn một dòng ở đầu ngăn: "Đổi x, y để dời hình; đổi scale để phóng to."
- Kho hình của Xưởng vẽ là danh sách trong `studio.json` (`pictures: [id…]`), không phải cả kho: hình quái, skill, hiệu
  ứng của Hầm Ngọc không hiện. `content:check` kiểm mọi id có trong manifest và có `label`.

### 5.4. Hình mới

- **Pixel (16×16, CC0):** tải lại Pixel Art Atlas 1.4M **một lần, ngoài repo** (~259 MB, từ Hugging Face như 23/11). Lọc
  theo chú thích các chủ đề: người (bố, mẹ, bé, ông bà), nhà và đồ vật, cây hoa, con vật nuôi, chim, mây / mặt trời / trăng
  sao. Ghép **bảng xem trước** → **HLV chọn ~60–100 hình** → `tools/assets/pixel.py` đưa vào kho, ghi nguồn vào
  `assets/pixel-sources.json`. Tên id: `people-*`, `house-*`, `plant-*`, `pet-*`, `sky-*`.
- **Ảnh nền 600×600:** bộ Atlas không có ảnh nền. Em viết prompt `assets/prompts/07-studio-backgrounds.md` (bầu trời,
  làng quê, biển, phố cổ, đêm sao…), **HLV sinh ảnh**; `clean.py` thêm nhóm `bg` cỡ 600×600. Trong lúc chờ: ảnh giữ chỗ
  (`assets:placeholders`).
- Đo lại dung lượng (§9.6). Hình Xưởng vẽ chỉ tải khi mở Xưởng vẽ (ADR 0012).

## 6. Chia đợt

| Đợt | Làm gì | Phụ thuộc HLV |
|---|---|---|
| 1 | `draw_ellipse`, `draw_arc`, `border`, `color=None` + khối + Python → khối + 📘 + ADR 0013 | — |
| 2 | Vẽ theo mẫu: schema `templates`, hai nút ở danh sách, chọn mẫu, 👀 Mẫu, % giống, 6 mẫu | đọc lại 6 mẫu |
| 3 | 🖼️ Kho hình: `PicturePanel`, ➕ Thêm vào tranh, danh sách `pictures` (dùng tạm `bird*` có sẵn) | — |
| 4 | Lọc Atlas, bảng xem trước | **chọn hình** |
| 5 | Prompt ảnh nền + nhóm `bg` | **sinh ảnh** |

Mỗi đợt một commit, đủ "Định nghĩa xong" (e2e + ảnh chụp 1280×720, iPad, 1866×966).

## 7. Để người làm tự quyết

Tên khối và màu khối; câu khích lệ theo %; ngưỡng "hai màu gần nhau"; cỡ ô hình trong ngăn; mẫu nào nằm ở đâu trong
lưới. Ghi vào commit.
