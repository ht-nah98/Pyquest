# Cách viết một bài

Nội dung nằm ở `content/courses/<khóa>/lessons/lNN.json` (tên tệp = `id`). Schema: `packages/content-schema`.

## 1. Nhịp 5 bước
Mỗi bài theo `docs/pedagogy/lesson-rhythm.md`: Hiểu → Thiết kế → Chuẩn bị → Code → Chơi thử. Bước **Hiểu** và
**Chơi thử** là bắt buộc. Các bước phải đúng thứ tự, mỗi bước xuất hiện một lần.

## 2. Slide
- Mỗi slide **một ý**. `text` ≤ 280 ký tự, `title` ≤ 60. Không vừa thì tách thành hai slide, đừng rút gọn câu.
- Giọng học sinh cấp 2: gọi "em", câu ngắn, không chê. Thuật ngữ Python giữ tiếng Anh (`print`, `draw_bird`) và giải
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
- `hints`: tối đa 5 gợi ý, mở dần bằng nút 💡; gợi ý cuối có thể gần như đưa đáp án.
- **Bài nhiều file** (Bài 16): `starter`/`solution` có nhiều tệp; màn code có tab cho từng tệp. File phụ muốn dùng lệnh vẽ
  phải `from pyquest import *` (chỉ `main` được nạp sẵn).

### Các loại mục tiêu (`goals`)

| `kind` | Đúng khi |
|---|---|
| `noError` | chạy hết, không lỗi, không bị dừng vì chạy mãi |
| `printed` | có bong bóng `print` đúng nguyên văn |
| `drew` | có vẽ `sprite` (tùy chọn `at`, `tolerance`; `customImage`: phải dùng ảnh chọn bằng `use_sprite`) |
| `drewCount` | trong một khung hình có ít nhất `min` hình `sprite` |
| `drewText` | có chữ `text` được vẽ (vd điểm số) |
| `varEquals` | biến cấp module bằng `value` (số, chữ, True/False) |
| `moves` | `sprite` cuối lượt nằm xa hơn lúc đầu theo `axis`, chiều `dir` (1 / -1) |
| `speedsUp` | bước di chuyển cuối lượt dài hơn đầu lượt (rơi nhanh dần) |
| `staysWithin` | mọi khung (hoặc `frames: [từ, đến]`) có vị trí trong `min`..`max` |
| `risesAfterTap` | sau một khung trong `taps`, `sprite` lên cao hơn |
| `distinctCount` | `sprite` có ít nhất `min` giá trị khác nhau theo `axis` (khe ngẫu nhiên) |

## 4. Bài chưa xong: ẩn → bản nháp → mở
1. **Ẩn:** `{ "id", "courseId", "order", "title", "hidden": true }`. Bé thấy tên bài ("Đang soạn"), không vào được.
2. **Bản nháp:** bài viết đủ nhưng có `"draft": true`. Chỉ HLV thấy và mở được (nhãn "Bản nháp"); bé không thấy.
3. **Mở:** HLV đọc lại và dạy thử xong thì xóa `"draft"`. AI không tự xóa cờ này (AGENTS.md §9.7).

## 5. `npm run content:check` kiểm gì
1. Mọi JSON qua schema. 2. `lessonIds` khớp các tệp, `order` đúng vị trí. 3. Lời giải qua hết mục tiêu (seed 1).
4. Code khởi đầu **không** qua hết mục tiêu. 5. Khối trong toolbox có tồn tại. 6. Ảnh slide và sprite của mục tiêu có
trong kho hình. 7. Game mẫu chạy 300 khung (có bấm) không lỗi. 8. Không có tệp lạ trong `content/`.
10. `content/reference/pyquest.json` (📘 Thư viện) hợp lệ và mỗi lệnh trỏ tới một bài có thật.
9. Code khởi đầu và lời giải đi qua **khối rồi về lại code** không đổi một ký tự (nếu không, trình soạn sẽ viết lại code
của bài ngay khi bé chạm vào khối). Bài `game` được chấm bằng lần chạy thử theo `test`, giống hệt trên trang.
Thêm tệp mới trong `content/` thì khởi động lại `npm run dev` (AGENTS.md §9.3).
