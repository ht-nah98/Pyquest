# 0011. Khóa thứ hai (bản nháp), phím trong bài kiểm, khối hộp có tên

24/11/2026 · Chấp nhận (theo hợp đồng `superpowers/specs/2026-11-23-roguelite-design.md` §8; nội dung khóa còn là nháp)

## Bối cảnh
Khóa Hầm Ngọc học sau Bay Qua Khe, sân 600 × 600, dùng dict và danh sách dict, đi bốn hướng, bấm thẻ. Trước đó nền tảng chỉ
có một khóa: không có cách giấu cả khóa, 📘 Thư viện so số thứ tự bài của mọi khóa với nhau, bài kiểm chỉ biết "chạm", và
dict chỉ là code chữ.

## Quyết định
- **Khóa nháp:** `course.json` có `draft: true`. Bé không thấy thẻ khóa; mọi địa chỉ `/c/:id`, `/l/:id`, `/l/:id/code`,
  `/l/:id/play`, `/l/:id/notes` đi qua **một** cổng (`NeedApproved` trong `app/routes.tsx`, luật ở `content/access.ts`), bé gõ
  địa chỉ thì về trang chọn khóa. Cổng này chặn luôn **bài** nháp của khóa đã mở. HLV mở được hết, có nhãn "Bản nháp".
- **Bản nháp hỏng không làm trắng trang:** `course.json` hay bài của khóa nháp sai schema thì trang bỏ qua cả khóa đó (bài nháp
  của khóa đã mở thì bỏ riêng bài đó). Nội dung không nháp vẫn báo lỗi ngay; `content:check` báo cả hai.
- **Thứ tự khóa:** `after: "<id khóa>"`: khóa nằm sau khóa đó trên danh sách, và 📘 Thư viện coi **mọi** lệnh của khóa trước (và
  khóa trước nữa) là đã học, cộng lệnh của khóa mình tới bài đang học. Số `order` chỉ so trong một khóa. Lệnh chỉ
  khóa nháp dạy thì bé không thấy ở đâu cả: không ở khóa sau nó, không ở 🎨 Xưởng vẽ.
- **Mã bài** là một chữ thường + hai số (`h05`), **duy nhất toàn nền tảng**: tiến độ và địa chỉ chỉ biết mã bài.
  `content:check` luật 13.
- **`howToPlay`** (≤ 160 ký tự, tùy chọn) trong `course.json`: câu "Cách chơi" cạnh game mẫu và dưới màn chơi toàn màn hình.
  Thiếu thì là câu của Bay Qua Khe. Ở Trình chiếu, HLV bấm vào game mẫu thì mũi tên và Space là của game, bấm chỗ khác (nút
  Tiếp…) thì lại là chuyển slide.
- **Bài kiểm (`Exercise.test`)** thêm `keys: [{ key, from, to }]` (giữ phím từ khung `from` tới **hết** khung `to`) và
  `clicks: [{ frame, x, y }]`. Một hàm `testInput` trong checker, trang và `content:check` dùng chung. Khung đó Python nhận đúng
  như khi người chơi bấm thật: bấm chuột cũng là Space (một khung), chuột ở yên chỗ đó về sau; Space vừa xuống là một lần chạm.
- **Goal `varCompare`** `{ name, op: ">=" | "<=" | "!=", value, when?: "end" | "ever" }`: `ever` xét biến **sau mỗi khung**
  (`GameTestResult.varsByFrame`). Biến không có thì không đạt. Chỉ thấy biến cấp module là số, chữ, True/False: ngăn của dict
  (`hero["hp"]`) **không** thấy được, bài cần chấm thì cất ra một biến.
- **Khối mới:** `pq_dict`, `pq_key_get`, `pq_key_set`, `pq_key_aug` (nhóm **Hộp có tên**), `pq_remove` (Danh sách), `pq_abs`
  (Số và chữ), `pq_draw_image_scale` (Vẽ). `mob["x"]` (tên biến + chữ trong ngoặc kép) là khối có tên; `xs[i]`, `xs['a']` vẫn là
  khối danh sách cũ; `mobs[0]["x"]` là code chữ.
- **Không đổi một ký tự:** đoạn code trước đây là code chữ chỉ thành khối mới khi viết **đúng kiểu khối viết ra** (một dòng,
  dấu cách chuẩn, không ngoặc thừa; so với `ast.unparse`). `{"x":1}`, `abs(a-b)` vẫn là code chữ. Câu lệnh nhiều dòng có dict
  (bảng skill, bảng đợt quái) là **một khối code chữ**, giữ từng dòng, kể cả trong `def`. Câu lệnh có khối mới mà kết thúc bằng
  `;` cũng là code chữ. `def` / `if` / vòng lặp có chữ nhiều dòng (`"""`) bên trong thì cả khối đó là code chữ.
- **Ngoặc:** vế phải của `+ - * / %` giữ ngoặc như bé gõ (`a + (b + c)`); biểu thức code chữ (`-a`, `a ** 2`) giữ đúng ngoặc đã gõ.
- **Mục tiêu theo hình:** `sprite` khớp theo **đầu mã hình** (`mob` khớp `mob-bat`), không theo `group` trong manifest: `boss-1`
  có `group: "mob"` nhưng phải viết `sprite: "boss"`. Phóng to, lật không ảnh hưởng: `(x, y)` là góc trên bên trái của hình đã
  phóng. `content:check` (luật 6) nay kiểm `sprite` của mọi loại mục tiêu, nhận cả đầu mã.

## Hệ quả
- **Bài đã lưu vẫn mở được:** không khối nào bị bỏ hay đổi ô. Khối cũ `pq_index` / `pq_index_set` chứa chữ vẫn nạp được và ra
  đúng code cũ; lần mở sau, code dựng lại thành khối có tên. Code của mọi bài Bay Qua Khe dựng ra khối giống hệt trước.
- Khối dict kéo từ khay có 3 ngăn (`x`, `y`, `hp`, đổi tên được); thêm bớt ngăn thì sửa ở code, giống khối danh sách.
- Bảng tiến độ của HLV có một bảng mỗi khóa (`progress-grid-<id>`); bé chưa mở bài nào của khóa sau thì "Đang ở" là "—".
- Xếp lộ trình (`roadmapBuilder`) hạ chiều cao từng dòng để 12 phần nằm trọn một màn.
