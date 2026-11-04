# PyQuest — Nền tảng học Python và làm sản phẩm cho học sinh cấp 2 — Thiết kế

Ngày: 04/11/2026 · Bản 2 · Trạng thái: **HLV đã duyệt 04/11/2026** · Thư mục: `~/Desktop/PyQuest` **[HLV]**

Ký hiệu: **[HLV]** = HLV đã quyết trong buổi trao đổi 04/11. **[AI]** = AI tự quyết, HLV có thể bác.

## 1. Vì sao làm

HLV có lớp cấp 2 (hiện 3 bé) đã học xong kéo thả trên Scratch. Bước tiếp theo: **viết code thật bằng Python, từ con
số 0 tới một sản phẩm hoàn chỉnh**. **[HLV]**

Điều quan trọng nhất: **mình đứng lớp dạy cách làm ra một sản phẩm, không dạy cắm đầu vào code.** Ngay từ đầu bé phải
thấy được lộ trình, bối cảnh, quy trình: tư duy làm game, tư duy phát triển phần mềm. Sau đó mới tới từng phần. Trước
khi code phần nào, bé phải hiểu phần đó hoạt động ra sao (chim bay thế nào, rơi nhanh dần thế nào), thiết kế nó, và
chuẩn bị đủ thứ cần thiết (ảnh, file, đường dẫn). **[HLV]**

Bé chưa đọc được log, nên **kết quả chạy phải thành hình**. **[HLV]**

## 2. Mục tiêu

1. **Web app riêng** (repo mới), không nằm trong CodeQuest. **[HLV]**
2. **Nền tảng nhiều khóa / nhiều game**: khóa đầu là game luồn ống kiểu Flappy Bird; sau đó các game Python khác,
   vẽ hình, phân tích dữ liệu. **[HLV]** Thêm khóa = viết nội dung (JSON), không viết lại app. **[AI]**
3. **Mỗi bài theo nhịp làm sản phẩm** (mục 6), và **lộ trình sản phẩm** đi theo bé suốt khóa. **[HLV]**
4. **Một nội dung, hai chế độ**: Trình chiếu (HLV giảng trên lớp) và Tự học (bé ở nhà). **[HLV]**
5. **Khối ⇄ code song song, đồng bộ hai chiều.** **[HLV]**
6. **Dự án có file và thư mục thật** (`main.py`, `images/`, `sounds/`) để dạy file và đường dẫn. **[HLV gợi ý, AI cụ thể hóa]**
7. **Kho hình** do HLV và AI cùng làm (AI viết prompt, HLV sinh ảnh bằng công cụ AI), bé chọn hình từ kho. **[HLV]**
8. **iPad nằm ngang**: kéo khối, chơi thử, xem hướng dẫn / trình chiếu. **[HLV]**

**Thành công của khóa đầu:** bé học hết các bài có hướng dẫn và có một game chơi được do chính mình viết bằng Python. **[HLV]**

## 3. Ngoài phạm vi (lúc này)

- **Supabase / tài khoản trên mạng**: làm local trước; HLV duyệt xong mới tạo tài khoản Supabase. **[HLV]**
  Cho tới lúc đó tiến độ lưu trong trình duyệt của từng máy (IndexedDB), nên ở nhà chưa học tiếp được tiến độ trên lớp.
  Kiến trúc lưu trữ phải tách lớp để sau này cắm Supabase vào không phải sửa màn hình. **[AI]**
- **Phần nâng cao** (tự sửa luật, tự thêm tính năng, không hướng dẫn): làm sau, nhưng mô hình nội dung chừa chỗ. **[HLV]**
- Khóa thứ hai trở đi, phân tích dữ liệu, màn HLV đầy đủ, sao/coin: làm sau.
- Bé tự tải ảnh của mình lên: làm sau; trước mắt chỉ chọn từ kho. **[AI]**
- Gõ code nhiều trên iPad. **[HLV]**

## 4. Điều làm hỏng dự án dù code chạy được

- Bài học nhảy thẳng vào code mà không có phần Hiểu / Thiết kế / Chuẩn bị. **[HLV]**
- Dạy lý thuyết dài kiểu cấp 3/đại học. **[HLV]** Mỗi slide một ý, chữ ngắn, có hình.
- Chép game có sẵn: giữ **cơ chế** (vỗ cánh, luồn qua khe ống) nhưng **tên, nhân vật, hình vẽ là của mình**. **[AI]**
- Code của bé không phải Python thật. Code phải là Python 3 thật, chỉ thêm thư viện vẽ nhỏ của nền tảng.
- Thu thập dữ liệu cá nhân của trẻ (chỉ biệt danh, avatar, tiến độ, code của bé).
- Bài chưa xong lọt vào màn của bé.

## 5. Người dùng, lớp học, thời hạn

- 3 bé cấp 2, laptop ở lớp, máy khác ở nhà. Ở nhà có thể là iPad. **[HLV]**
- Trên lớp: HLV chiếu slide giảng bài, ngồi cạnh cho bé thao tác. Ở nhà: bé tự học. **[HLV]**
- Giao diện tiếng Việt, giọng học sinh cấp 2. Code Python và tên hàm thư viện bằng **tiếng Anh** (`draw_bird`,
  `key_pressed`); chữ trên khối tiếng Việt ("vẽ chim tại (x, y)"). **[HLV]**

**Thời hạn:** buổi đầu **Chủ nhật 08/11/2026**. **[HLV]**

### Phạm vi cho Chủ nhật **[AI]**
- **Bài 0 hoàn chỉnh** ở cả hai chế độ: slide toàn cảnh, game mẫu chơi được, bé vẽ lộ trình của mình.
- **Game mẫu** viết bằng Python, chạy trên chính runtime của nền tảng, hình từ kho hình đợt đầu. Đây cũng là phép thử
  runtime và sân chơi.
- Màn học (bố cục B) chạy được với **Bài 1**: khối ⇄ code, Chạy, toàn màn hình. Nếu chiều code → khối chưa kịp thì tạm
  chỉ có khối → code.
- Repo, AGENTS.md, docs, bộ kiểm nội dung (bản tối thiểu).
- **Chạy trên laptop HLV, 3 bé vào qua mạng LAN của lớp** (kiểu `coach-dev.sh` của CodeQuest, phục vụ từ bản chụp). Chưa deploy. **[HLV]**
- Không có: Supabase, màn HLV, phần thưởng.

## 6. Nhịp của một bài **[HLV, AI đặt tên]**

Mỗi bài đi qua 5 bước. Bài nào thiếu bước nào thì ghi rõ trong dữ liệu, nhưng **Hiểu** và **Chơi thử** luôn có.

| Bước | Bé làm gì | Ví dụ ở bài "Nút bay" |
|---|---|---|
| 1. **Hiểu** | Xem / thao tác hình động giải thích cơ chế | kéo thanh trượt trọng lực, xem chim rơi nhanh dần; bấm thì tốc độ đổi dấu |
| 2. **Thiết kế** | Quyết định luật / hình dạng trước khi code, có câu hỏi kiểm tra | bấm một lần thì bay lên bao nhiêu? nhanh quá có chơi được không? |
| 3. **Chuẩn bị** | Tài nguyên: chọn hình trong kho, file, thư mục, đường dẫn | chọn hình chim vỗ cánh, đặt vào `images/` |
| 4. **Code** | Khối ⇄ Python, chấm mục tiêu tự động | `if key_pressed(): speed = -8` |
| 5. **Chơi thử & chỉnh** | Chạy toàn màn hình, chỉnh số cho vừa tay, đánh dấu phần đã xong trên lộ trình | chỉnh lực vỗ cánh tới khi chơi thấy ổn |

**Lộ trình sản phẩm:** ở Bài 0 bé tách game thành các phần (sân khấu, nhân vật, trọng lực, nút bay, ống, va chạm,
điểm, màn hình bắt đầu/thua…). Lộ trình này hiện ở đầu khóa và trong mỗi bài; xong bài nào thì phần tương ứng sáng lên. **[HLV]**

## 7. Hai chế độ xem **[HLV, chi tiết AI]**

- **Trình chiếu** (HLV, trên lớp): slide chữ to, bấm phím mũi tên để chuyển. Hình động tương tác được ngay trên slide.
  Có ghi chú giảng bài chỉ HLV thấy (mở ở cửa sổ thứ hai hoặc trên iPad). Từ slide nhảy được sang màn code để làm mẫu.
- **Tự học** (bé, ở nhà): cùng các slide đó, bé tự bấm qua, có câu hỏi nhỏ ở bước Hiểu / Thiết kế; trả lời xong mới mở
  bước sau. Tài liệu (giải thích khái niệm) mở dần theo bài đã học. **[HLV]**
- Nội dung viết một lần trong JSON; mỗi slide có thể có: chữ ngắn, hình, hình động tương tác, câu hỏi, ghi chú HLV.

## 8. Màn code (bố cục B, sửa lần 2) **[HLV]**

**Laptop (≥1280×720), không cuộn trang:** thanh trên (khóa, tên bài, các bước 1–5 của bài, 📘 Tài liệu, 💡 Gợi ý);
**khung Khối và khung Python cạnh nhau** chiếm khoảng 70% bề ngang; **cột sân chơi nhỏ** gồm ▶ Chạy, ⛶ Chơi toàn màn
hình, sân chơi thu nhỏ, ô giá trị biến (thay cho log), và mục tiêu ✅/⬜. Chọn khối thì dòng code sáng lên và ngược lại.
Thêm một **cây file** thu gọn được (`main.py`, `images/`…), từ bài dạy file trở đi. **[AI]**

**Toàn màn hình:** chỉ còn game của bé, điểm, Chơi lại, Về code (Esc). Space hoặc chạm để vỗ cánh. **[HLV]**

**iPad nằm ngang (≥1080×730):** khối và code ở trên, sân chơi thành dải dưới cùng, nút cỡ ngón tay; không có hàng phím tắt
gõ code. **[AI]**

Bản phác: `docs/design/mockups/layout-v2.html`.

## 9. Khóa đầu: game luồn ống — đề cương bản 2 **[AI đề xuất, HLV duyệt 04/11]**

Bản 1 (14 bài, HLV đã duyệt thứ tự) được viết lại theo yêu cầu dạy tư duy sản phẩm: thêm Bài 0, thêm bài chuẩn bị tài
nguyên / file / đường dẫn, bài thiết kế giao diện, và bài ra mắt. Thứ tự các khái niệm Python giữ như bản 1.

| # | Bài | Hiểu / Thiết kế / Chuẩn bị (trước code) | Python | Phần game sáng lên |
|---|---|---|---|---|
| **A. Bức tranh toàn cảnh** |||||
| 0 | Làm game là làm gì? | chơi game mẫu; tách game thành từng phần; quy trình ý tưởng → thiết kế → chuẩn bị → code → thử → sửa; vẽ lộ trình | (một dòng `print` cuối bài) | lộ trình |
| **B. Dựng sân khấu** |||||
| 1 | Màn hình là tờ giấy kẻ ô | tọa độ, y hướng xuống; phác vị trí chim trên giấy | gọi hàm, tham số | sân khấu |
| 2 | Hộp đựng số | vì sao cần nhớ vị trí; đặt tên cho tốt | biến, gán | — |
| 3 | Chuẩn bị nhân vật | chọn hình trong kho; file là gì, thư mục, đường dẫn `images/bird.png`; kích thước ảnh | tải ảnh, chuỗi | nhân vật |
| **C. Cho chim sống** |||||
| 4 | Tính rồi gán lại | đi từng bước: vị trí mới = vị trí cũ + bước | phép toán, `y = y + 2` | — |
| 5 | Lặp lại | việc lặp lại trong đời thường | `for`, `range` | — |
| 6 | Hoạt hình là gì | phim = nhiều ảnh tĩnh; khung hình, FPS | `update()` / `draw()` | chim chuyển động |
| 7 | Trọng lực | rơi nhanh dần; vận tốc, gia tốc (thanh trượt) | biến tốc độ | trọng lực |
| 8 | Nếu… thì… | luật chạm đất | `if`, so sánh | mặt đất |
| 9 | Nút bay | bấm thì tốc độ đổi; thiết kế cảm giác vỗ cánh | sự kiện phím/chạm | nút bay |
| **D. Thử thách** |||||
| 10 | Tự đặt lệnh | thiết kế ống: khe, độ rộng; chuẩn bị hình ống | `def`, tham số | ống |
| 11 | Nhiều ống | hàng đợi ống trượt qua màn hình | `list`, duyệt | ống chạy |
| 12 | Ngẫu nhiên | game hay hơn nhờ bất ngờ; khe cao thấp vừa phải | `random` | khe ngẫu nhiên |
| 13 | Đụng ống | hai hình chữ nhật chồng nhau khi nào | `and`, `or` | va chạm |
| **E. Hoàn thiện sản phẩm** |||||
| 14 | Giao diện | thiết kế màn hình: điểm đặt ở đâu, chữ cỡ nào, màu; chuẩn bị font, âm thanh `sounds/` | biến đếm, f-string | điểm, âm thanh |
| 15 | Gói thành đối tượng | chim là một "vật" có thuộc tính và hành động | `class` | (dọn code) |
| 16 | Màn hình và nhiều file | trạng thái game; chia code ra nhiều file | trạng thái, `import` | bắt đầu / thua / chơi lại |
| 17 | Ra mắt | chơi thử chéo, ghi phản hồi, sửa lỗi, đặt tên game | — | game hoàn chỉnh |
| ★ | Nâng cao | không hướng dẫn | — | (tự làm) |

Mỗi bài có thể dài hơn một buổi.

## 10. Kho hình **[HLV, quy trình AI]**

- AI viết **prompt** cho từng nhóm hình (`assets/prompts/<nhóm>.md`): nhân vật (nhiều lựa chọn để bé chọn), ống / chướng
  ngại vật, nền, mặt đất, nút, biểu tượng. Mỗi nhân vật có vài khung hình (vỗ cánh lên / giữa / xuống).
- Một phong cách chung cho cả kho để bé chọn hình nào cũng hợp nhau: **pixel art**, nền trong suốt, cùng bảng màu và cùng
  cỡ ô. Hợp với font VT323. **[AI]**
- HLV sinh ảnh, đặt vào `assets/raw/`; công cụ của repo làm sạch (tách nền, cắt, thu nhỏ, ghép khung) ra
  `content/assets/library/` kèm tệp mô tả (tên, nhóm, kích thước, số khung).
- Trong app: ở bước Chuẩn bị, bé mở kho, chọn hình, hình được chép vào `images/` của dự án bé với đường dẫn hiện rõ.
- Đo ngân sách tải khi thêm ảnh (bài học §9.14 của CodeQuest).

## 11. Kỹ thuật **[AI]**

- React + Vite + TypeScript, Tailwind, npm workspaces, Vitest, Playwright, ESLint. Font VT323. Chạy local trước.
- **Python thật bằng Pyodide trong Web Worker**: có nút Dừng và trần số bước, vòng lặp vô hạn không làm treo trang.
- **Dự án của bé** là một hệ thống file ảo (file system của Pyodide), lưu trong IndexedDB; `open()`, `import`, đường dẫn
  hoạt động như Python thật.
- **Thư viện vẽ** của nền tảng (tên tiếng Anh) gửi lệnh vẽ sang canvas. Từ Bài 6 dùng mô hình `update()` / `draw()` kiểu
  Pygame Zero; Bài 1–5 chạy một lần, ghi nhật ký lệnh vẽ rồi phát lại thành hình.
- **Hình động ở slide** (thanh trượt trọng lực…) là component dùng lại được, khai báo trong JSON của slide.
- **Khối ⇄ code**: thử BlockMirror (Apache-2.0). Không hợp thì tự làm: khối → code bằng bộ sinh Python của Blockly;
  code → khối bằng module `ast` của Python trong Pyodide, chỉ cho các câu lệnh có trong khóa. Code ngoài tập đó hiện thành
  khối "code chữ", không mất code của bé.
- **Chấm bài** chạy headless trên Node (Pyodide chạy được trên Node); có `content:check` kiểm lời giải mẫu. `random` dùng
  hạt giống cố định khi chấm.
- **Nội dung là dữ liệu**: `content/courses/<khóa>/lessons/*.json` (slide + bước + mục tiêu), schema zod.
- **Lưu trữ** qua một lớp trung gian: bản local (IndexedDB) trước, Supabase sau.
- Mọi thư viện mới đều có ADR.

**Để người dựng tự quyết:** cấu trúc bên trong package, Canvas 2D hay PixiJS (gợi ý Canvas 2D), chi tiết schema miễn có
chỗ cho slide, ghi chú HLV, câu hỏi, bài nâng cao và tài liệu mở dần.

## 12. Cấu trúc repo dự kiến **[AI]**

```
apps/web/                 app React: trình chiếu, tự học, màn code, kho hình
packages/runtime/         Pyodide worker, thư viện vẽ, file system dự án, nhật ký, trần bước
packages/blocks/          khối, khối ⇄ Python
packages/content-schema/  schema zod: khóa / bài / slide / bước / mục tiêu / kho hình
packages/checker/         chấm mục tiêu (headless, Node)
content/courses/          nội dung các khóa
content/assets/library/   kho hình đã làm sạch + tệp mô tả
assets/prompts/ assets/raw/   prompt sinh ảnh, ảnh gốc
tools/                    content-check, làm sạch ảnh
docs/                     README, glossary, architecture, product, pedagogy, adr, playbooks, roadmap
AGENTS.md  CLAUDE.md
```

Mang sang từ CodeQuest: khuôn AGENTS.md (quy tắc vàng, Định nghĩa xong, các bài học §9 áp dụng được), cách tổ chức docs,
CI, cách HLV chơi thử trên bản chụp. Không chép code nghiệp vụ.
