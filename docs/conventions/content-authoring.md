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
- `widget`: `sampleGame` (game mẫu), `grid` (lưới tọa độ), `gravity` (thanh trượt trọng lực), `roadmapBuilder` (xếp lộ trình).

## 3. Phần code
- `starter`: dự án lúc bé bắt đầu. **Không được tự thỏa mọi mục tiêu.**
- `solution`: lời giải mẫu, phải qua hết `goals`.
- `toolbox`: chỉ các khối bài này dạy (id trong `packages/blocks/src/defs.ts`).
- `mode`: `script` (chạy một lần) hoặc `game` (`update()` / `draw()`).

## 4. Bài chưa xong
Để `{ "id", "courseId", "order", "title", "hidden": true }`. Bé thấy tên bài trên lộ trình nhưng không vào được
(AGENTS.md §9.5). **Bỏ `hidden` chỉ sau khi HLV đọc lại và dạy thử.**

## 5. `npm run content:check` kiểm gì
1. Mọi JSON qua schema. 2. `lessonIds` khớp các tệp, `order` đúng vị trí. 3. Lời giải qua hết mục tiêu (seed 1).
4. Code khởi đầu **không** qua hết mục tiêu. 5. Khối trong toolbox có tồn tại. 6. Ảnh slide và sprite của mục tiêu có
trong kho hình. 7. Game mẫu chạy 300 khung (có bấm) không lỗi. 8. Không có tệp lạ trong `content/`.
Thêm tệp mới trong `content/` thì khởi động lại `npm run dev` (AGENTS.md §9.3).
