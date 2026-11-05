# 0006. Tài khoản và đồng bộ bằng Supabase, lưu trên máy trước

05/11/2026 · Chấp nhận (HLV duyệt spec `superpowers/specs/2026-11-05-supabase-accounts-design.md`)

## Bối cảnh
Tiến độ nằm trong IndexedDB của từng trình duyệt: học ở lớp thì về nhà không thấy bài, HLV không xem được bé làm tới đâu.
Bé không có email. Wi-Fi lớp có lúc chập chờn.

## Quyết định
- **Dependency mới: `@supabase/supabase-js` 2.118.0** (MIT), chỉ trong `apps/web` (eslint cấm nó trong `packages/*`).
- **Đăng nhập:** Supabase Auth email + mật khẩu. Bé: tên đăng nhập + PIN 6 số, email giả `<tên>@hs.pyquest.invalid`
  (miền `.invalid` không ai sở hữu, không gửi thư). HLV: email thật. Tự đăng ký tắt; chỉ HLV tạo tài khoản bé qua Edge
  Function `students` (khóa `service_role` chỉ có trong Supabase).
- **Dữ liệu:** `profiles`, `lesson_states` (jsonb = `LessonState`), RLS: bé đọc/ghi dòng của mình, HLV đọc tất cả
  (`private.is_coach()`, schema không lộ qua REST). SQL ở `supabase/migrations/`.
- **Lưu trên máy trước** (`storage/syncStore.ts`): mỗi lần lưu ghi IndexedDB + hàng đợi `outbox`, gửi lên khi có mạng.
  Hai máy cùng sửa: bản mới hơn thắng, thành tích (bài tập xong, bước xong, slide xa nhất) gộp lại (`storage/merge.ts`).
- **Không có `VITE_SUPABASE_URL`** thì app chạy như trước (hồ sơ trên máy, PIN HLV từ `.env.local`): dev, e2e, lớp không
  có Internet.
- **Lên mạng:** GitHub Pages ở `/Pyquest/` (vite `base`, router `basename`, `404.html` = app), deploy sau CI xanh.

## Hệ quả
- Đăng nhập lần đầu trên mỗi máy cần Internet; sau đó học offline được, có mạng tự gửi.
- Bỏ được Supabase: xóa hai biến môi trường là về chế độ trên máy; dữ liệu cũ vẫn ở IndexedDB.
- E2E chạy với Supabase giả (`e2e/fakeSupabase.ts`, project `cloud`), không bao giờ đụng project thật.
- Gói Free của Supabase tạm dừng project không dùng 7 ngày; mở lại trong Dashboard (deployment-ops.md).
