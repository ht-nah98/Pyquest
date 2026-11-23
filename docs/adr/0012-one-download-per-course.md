# 0012. Mỗi khóa một gói tải riêng

24/11/2026 · Chấp nhận (HLV đồng ý các đề xuất, 24/11)

## Bối cảnh
Mọi bài của mọi khóa nằm trong gói tải lần đầu. Thêm khóa Hầm Ngọc, gói này tăng từ 674 lên 820 kB (gzip), và máy của bé tải cả
khóa nháp mà bé chưa được thấy. Mỗi khóa mới lại làm nặng thêm (AGENTS.md §9.6).

## Quyết định
- **Đầu bài trong gói chính:** danh sách khóa, bản đồ khóa và lưới của HLV chỉ cần `LessonHead` (mã, tên, thứ tự, cờ ẩn / nháp,
  tóm tắt, phần lộ trình, mã + tên bài tập). Plugin nhỏ trong `apps/web/vite.config.ts` cắt tệp bài khi build
  (`lesson.json?head`, hàm `headOf`). Không thêm thư viện, không có tệp sinh ra phải giữ khớp bằng tay.
- **Thân bài một gói cho mỗi khóa** (`course-<id>`: mọi bài và game mẫu), gọi bằng `catalog.load(id)`. Trang chọn khóa tải sẵn
  các khóa người đó được thấy; `NeedCourse` (trong `NeedApproved`, và ở trang HLV xem code) chờ gói rồi mới vẽ trang.
- **Cả khóa một lần, không chia từng bài:** vào khóa rồi thì mất mạng giữa buổi vẫn chuyển bài được như trước.
- **Tải hỏng** (mất mạng, hoặc web vừa cập nhật khi trang còn mở): báo một câu và nút ↻: thử tải lại; vẫn
  hỏng mà web vẫn trả lời thì tải lại cả trang, để lấy đúng tên tệp mới. Có nút về danh sách khóa. Build báo lỗi nếu một bài
  nằm ngoài gói của khóa nó.
- `openLesson` và `sampleGame` chỉ có sau khi khóa đã tải. Trang mới đọc chúng thì phải nằm trong `NeedCourse`.

## Hệ quả
- Gói chính 820 → 679 kB gzip; `course-bay-qua-khe` 34 kB, `course-ham-ngoc` 115 kB. Số từ `npm run build`.
- Bé không tải khóa nháp. Đây không phải khóa bí mật: ai biết địa chỉ tệp vẫn đọc được (repo public).
- Bài sai schema giờ báo lỗi lúc vào khóa, không phải lúc mở trang; `content:check` vẫn là bộ chặn chính.
