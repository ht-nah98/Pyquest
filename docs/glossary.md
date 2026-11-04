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
| Chạy kịch bản | `mode: 'script'` | code chạy một lần, lệnh vẽ được ghi rồi phát lại |
| Chạy game | `mode: 'game'` | nền tảng gọi `update()` rồi `draw()` mỗi khung hình |
| Nhật ký lệnh vẽ | `DrawEvent[]` | thứ thay cho log |
| Ô biến | `VarWatch` | giá trị biến hiện dưới sân chơi |
| Khối code chữ | `pq_raw` | dòng Python chưa có khối, giữ nguyên |
| Kho hình | `AssetLibrary` | `content/assets/library/` |
| Dự án của bé | `files` | `{ "main.py": "...", "images/...": ... }` |
| HLV | `role: 'coach'` | huấn luyện viên |
