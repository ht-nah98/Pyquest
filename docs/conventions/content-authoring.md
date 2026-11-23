# Cách viết một bài

Nội dung nằm ở `content/courses/<khóa>/lessons/<id>.json` (tên tệp = `id`). Schema: `packages/content-schema`.
`id` bài là **một chữ thường + hai số** (`l05`, `h05`), **duy nhất toàn nền tảng**: mỗi khóa dùng một chữ riêng (Bay Qua Khe
`l`, Hầm Ngọc `h`).

## 1. Nhịp 5 bước
Mỗi bài theo `docs/pedagogy/lesson-rhythm.md`: Hiểu → Thiết kế → Chuẩn bị → Code → Chơi thử. Bước **Hiểu** và
**Chơi thử** là bắt buộc. Các bước phải đúng thứ tự, mỗi bước xuất hiện một lần.

## 2. Slide
- Mỗi slide **một ý**. `text` ≤ 280 ký tự, `title` ≤ 60. Không vừa thì tách thành hai slide, đừng rút gọn câu.
- Giọng học sinh cấp 2: gọi "em", câu ngắn, không chê. Thuật ngữ Python giữ tiếng Anh (`print`, `draw_rect`) và giải
  thích bằng tiếng Việt ngay lần đầu xuất hiện.
- `coachNotes`: gợi ý giảng cho HLV (câu hỏi cho lớp, hoạt động trên giấy). Chỉ hiện ở cửa sổ ghi chú.
- `quiz`: 2–5 lựa chọn, `explain` nói **vì sao** đáp án đúng. Ở chế độ Tự học, bé phải chọn đúng mới qua.
- `widget`: `sampleGame` (game mẫu), `grid` (lưới tọa độ), `gravity` (thanh trượt trọng lực), `roadmapBuilder` (xếp lộ
  trình), `flipbook` (sách lật: hoạt hình là nhiều khung hình), `assetPicker` (`props.group`: chọn ảnh trong kho, thấy cây
  thư mục và đường dẫn).

## 3. Phần code
- Code của bài luôn **bắt đầu bằng `from pyquest import *`** (runtime không nạp ngầm gì, như Python thật).
- `walkthrough`: tối đa 8 bước, mỗi bước ≤ 200 ký tự — hướng dẫn chi tiết "làm gì, ở đâu" hiện trong thẻ Nhiệm vụ.
- `starter`: dự án lúc bé bắt đầu. **Không được tự thỏa mọi mục tiêu.**
- `solution`: lời giải mẫu, phải qua hết `goals`.
- `toolbox`: chỉ các khối bài này dạy (id trong `packages/blocks/src/defs.ts`).
- `mode`: `script` (chạy một lần) hoặc `game` (`update()` / `draw()`).
- `test` (chỉ `game`): `{ frames, taps }` — lần chạy thử tự động dùng để chấm: bao nhiêu khung hình, khung nào "chạm màn
  hình". Chọn lịch bấm bằng mô phỏng (vd vỗ cánh mỗi 31 khung giữ chim trong khoảng 240–300).
  Tùy chọn (ADR 0011): `keys: [{ "key": "left", "from": 0, "to": 29 }]` giữ phím từ khung `from` tới **hết** khung `to`
  (`from <= to < frames`; phím: `left right up down space 1 2 3`); `clicks: [{ "frame": 40, "x": 300, "y": 200 }]` bấm chuột
  đúng một khung, trong sân. Như trên trang: bấm chuột cũng là một lần chạm (Space), và chuột ở yên chỗ đó về sau.
- `hints`: tối đa 5 gợi ý, mở dần bằng nút 💡; gợi ý cuối có thể gần như đưa đáp án.
- **Bài nhiều file** (Bài 16): `starter`/`solution` có nhiều tệp; màn code có tab cho từng tệp. File phụ muốn dùng lệnh vẽ
  phải `from pyquest import *` (chỉ `main` được nạp sẵn).

### Các loại mục tiêu (`goals`)

| `kind` | Đúng khi |
|---|---|
| `noError` | chạy hết, không lỗi, không bị dừng vì chạy mãi |
| `printed` | có bong bóng `print` đúng nguyên văn |
| `varCompare` | biến cấp module so với `value` bằng `op` (`>=`, `<=` với số; `!=` với giá trị bất kỳ); `when: "end"` (mặc định) cuối lượt, `"ever"` sau một khung nào đó. Biến không có thì không đạt; không thấy được ngăn của dict (`hero["hp"]`) |
| `drew` | có vẽ ảnh thuộc nhóm `sprite` (`bird` khớp `bird-rong`; tùy chọn `at`, `tolerance`; `customImage`: ảnh khác ảnh đầu của nhóm) |
| `matches` | hình cuối giống hình của lời giải (mảnh, chỗ, màu, nền; thứ tự tự do); có nút 👀 hình mẫu |
| `drewRects` | một khung có ít nhất `min` ô `draw_rect` (không tính ô phủ cả sân); tùy chọn `at` |
| `called` | hàm bé tự viết `name` chạy ít nhất `min` lần; `distinct`: với số khác nhau |
| `sameShape` | mọi lời gọi `name` vẽ ra cùng một hình, chỉ dời chỗ |
| `shifts` | chạy lại với dòng `var = n` thành `n + by`: **mọi** mảnh dời đúng `by` theo `axis` (chỉ chế độ script) |
| `drewCount` | trong một khung hình có ít nhất `min` hình `sprite` |
| `drewText` | có chữ `text` được vẽ (vd điểm số) |
| `varEquals` | biến cấp module bằng `value` (số, chữ, True/False) |
| `moves` | `sprite` cuối lượt nằm xa hơn lúc đầu theo `axis`, chiều `dir` (1 / -1) |
| `speedsUp` | bước di chuyển cuối lượt dài hơn đầu lượt (rơi nhanh dần) |
| `staysWithin` | mọi khung (hoặc `frames: [từ, đến]`) có vị trí trong `min`..`max` |
| `risesAfterTap` | sau một khung trong `taps`, `sprite` lên cao hơn |
| `distinctCount` | `sprite` có ít nhất `min` giá trị khác nhau theo `axis` (khe ngẫu nhiên) |

`sprite` là mã một hình (`hero-knight`) hoặc **đầu mã** của một nhóm: `hero`, `mob`, `boss`, `item`, `shot`, `skill`
(`skill-fire`), `fx`, `bird`, `pipe`… Chỉ xét mã hình, không xét `group` trong manifest: `boss-1` có `group: "mob"` nhưng
`sprite: "mob"` **không** khớp nó, phải viết `boss`. Hình phóng to hay lật vẫn khớp, `(x, y)` là góc trên bên trái của hình đã
phóng. Mục tiêu theo vị trí (`moves`, `staysWithin`, `speedsUp`, `risesAfterTap`) theo **hình đầu tiên** khớp trong mỗi khung:
cả bầy quái thì dùng `drewCount` / `distinctCount`, hoặc mã cụ thể. Nhóm không có hình mang đúng tên nhóm (`hero`, `mob`…)
thì `customImage` luôn đúng, đừng dùng.

## 4. Bài chưa xong: ẩn → bản nháp → mở
1. **Ẩn:** `{ "id", "courseId", "order", "title", "hidden": true }`. Bé thấy tên bài ("Đang soạn"), không vào được.
2. **Bản nháp:** bài viết đủ nhưng có `"draft": true`. Chỉ HLV thấy và mở được (nhãn "Bản nháp"); bé không thấy.
3. **Mở:** HLV đọc lại và dạy thử xong thì xóa `"draft"`. AI không tự xóa cờ này (AGENTS.md §9.7).
   Một **bài tập** cũng có thể mang `"draft": true` (nhãn "nháp" trên thanh bài tập): chỉ HLV thấy, bé không thấy và không
   cần làm nó để xong bài.

   **Cả khóa** cũng có thể mang `"draft": true` trong `course.json`: bé không thấy thẻ khóa và không mở được trang nào của
   khóa bằng địa chỉ (ADR 0011). `"after": "<id khóa>"`: học sau khóa đó, 📘 Thư viện tính mọi lệnh của khóa đó là đã học.
   `"howToPlay"` (≤ 160): câu "Cách chơi" của game trong khóa.

## 5. `npm run content:check` kiểm gì
1. Mọi JSON qua schema. 2. `lessonIds` khớp các tệp, `order` đúng vị trí. 3. Lời giải qua hết mục tiêu (seed 1).
4. Code khởi đầu **không** qua hết mục tiêu. 5. Khối trong toolbox có tồn tại. 6. Ảnh slide và `sprite` của mọi mục tiêu
(mã hình hoặc đầu mã) có trong kho hình. 7. Game mẫu chạy 300 khung (có bấm) không lỗi. 8. Không có tệp lạ trong `content/`.
10. `content/reference/pyquest.json` (📘 Thư viện) hợp lệ và mỗi lệnh trỏ tới một bài có thật.
9. Code khởi đầu và lời giải đi qua **khối rồi về lại code** không đổi một ký tự (nếu không, trình soạn sẽ viết lại code
của bài ngay khi bé chạm vào khối). Bài `game` được chấm bằng lần chạy thử theo `test`, giống hệt trên trang.
11. `toolbox` của mỗi bài tập có mọi khối mà code khởi đầu và lời giải dùng (không tính code chữ và khối gọi lệnh tự đặt).
13. `id` bài đúng dạng và duy nhất trên mọi khóa; `after` trỏ tới một khóa có thật, không vòng tròn; điểm bấm trong
`test.clicks` nằm trong sân.
12. `content/studio/studio.json` (🎨 Xưởng vẽ) hợp lệ; khối trong `toolbox` có thật và đủ khối `starter` dùng; `starter` đi
qua khối rồi về lại code không đổi và chạy không lỗi trên sân của Xưởng vẽ.
Thêm tệp mới trong `content/` thì khởi động lại `npm run dev` (AGENTS.md §9.3).

## Bài tập (ADR 0005)

Bước Code của bài có `exercises`: 3–5 bài tập khó dần ở phần nền tảng, 1–3 ở phần game. 1–2 bài tập đầu `input: "blocks"`,
sau đó `"typing"`. Mỗi bài tập có `id` dạng `<id bài>-eK` (`h05-e1`), `title` ≤ 60, `task` ≤ 280 (đề nói đủ số để vẽ được), code bắt đầu
riêng, và thường có goal `matches`. Bài tập nào cũng kéo khối được (ADR 0008): `"typing"` chỉ hiện gợi ý "✍️ Thử gõ code
nhé", nên `toolbox` phải có **mọi khối** mà code khởi đầu và lời giải dùng (luật 11).

**Dict (ADR 0011):** viết đúng kiểu khối viết ra thì mới thành khối: một dòng, khóa trong ngoặc kép, `{"x": 300, "hp": 5}`,
`mob["hp"] -= 1`, `abs(a - b)`. Bảng nhiều dòng (`SKILLS = {` …), `mobs[0]["x"]`, so sánh nối `0 <= x < 600` là code chữ, vẫn
qua luật 9. Muốn bé kéo được thì lấy phần tử ra biến trước: `mob = mobs[0]`.

