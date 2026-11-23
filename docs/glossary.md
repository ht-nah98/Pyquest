# Thuật ngữ

| Tiếng Việt (giao diện) | Code | Nghĩa |
|---|---|---|
| Khóa | `Course` | một chuỗi bài dẫn tới một sản phẩm (vd Bay Qua Khe) |
| Bài | `Lesson` | một bước trên lộ trình, có 5 bước nhỏ |
| Bước | `Step` / `StepKind` | `understand` Hiểu · `design` Thiết kế · `prepare` Chuẩn bị · `code` Code · `playtest` Chơi thử |
| Slide | `Slide` | một màn chữ/hình/câu hỏi trong một bước |
| Hình động | `widget` | phần tương tác trên slide (game mẫu, thanh trượt trọng lực, lưới tọa độ, lộ trình) |
| Câu hỏi nhỏ | `quiz` | chặn nút Tiếp ở chế độ Tự học tới khi trả lời đúng |
| Ghi chú giảng | `coachNotes` | chỉ HLV thấy (cửa sổ ghi chú) |
| Trình chiếu | `mode=present` | HLV chiếu trên lớp |
| Tự học | `mode=self` | bé tự học |
| Lộ trình | `roadmap` | các phần của game, sáng dần theo bài đã xong |
| Mục tiêu | `Goal` | điều kiện chấm tự động của phần code |
| Sân chơi | `Stage` | canvas vẽ kết quả chạy |
| Cỡ sân | `StageSize`, `course.stage` | rộng × cao của sân, đặt theo khóa; mặc định 400 × 600 (ADR 0009) |
| Chạy kịch bản | `mode: 'script'` | code chạy một lần, lệnh vẽ được ghi rồi phát lại |
| Chạy game | `mode: 'game'` | nền tảng gọi `update()` rồi `draw()` mỗi khung hình |
| Nhật ký lệnh vẽ | `DrawEvent[]` | thứ thay cho log |
| Ô biến | `VarWatch` | giá trị biến hiện dưới sân chơi |
| Khối code chữ | `pq_raw` | dòng Python chưa có khối, giữ nguyên |
| Kho hình | `AssetLibrary` | `content/assets/library/` |
| Dự án của bé | `files` | `{ "main.py": "...", "images/...": ... }` |
| HLV | `role: 'coach'` | huấn luyện viên |
| Mảnh gốc | `pyquest` | lệnh thư viện làm sẵn vì Python thường không tự làm được (tô màn hình, đọc phím, mở ảnh) |
| Lệnh tự đặt | `def` / `pq_def` | hàm bé tự viết, ví dụ `draw_bird(x, y)` |
| Tham số | parameter | hộp nhận số mỗi lần gọi (`x`, `y` trong `def draw_bird(x, y)`) |
| Lời gọi | `Call` / `RunResult.calls` | một lần hàm của bé chạy, kèm số nó nhận; hiện ở 📞 Cuộc gọi |
| Khối gọi | `pq_call` | khối gọi một `def` của bé, toolbox tự thêm |
| Bài tập | `Exercise` / `lesson.exercises` | một nhiệm vụ code trong bài; bài sau mở khi bài trước đạt |
| Kéo khối / gõ code | `input: 'blocks' \| 'typing'` | `typing` = gợi ý "✍️ Thử gõ code nhé", khối vẫn kéo được (ADR 0008) |
| Hình mẫu | goal `matches`, nút 👀 | hình của lời giải, hiện mờ trên sân để so |
| Xưởng vẽ | `/studio`, `content/studio/studio.json` | chỗ bé vẽ tự do bằng code / khối, lưu nhiều tranh, tải PNG; không chấm |
| Tranh | dòng tiến độ `studio:<id>`, `state.studio` | một bức vẽ trong Xưởng vẽ: tên, code, khối |
| Thử thách | `studio.challenges` | 💡 ý tưởng để vẽ trong Xưởng vẽ (đề + gợi ý), không có mục tiêu chấm |
