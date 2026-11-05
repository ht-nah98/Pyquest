# 0007. Âm thanh: bé gọi play_sound / play_music, trang tự tạo tiếng 8-bit

05/11/2026 · Chấp nhận (HLV chọn cả ba hướng đề xuất)

## Bối cảnh
Game không có tiếng thì khô và kém hấp dẫn (HLV, 05/11). Nhưng game là do bé tự viết: app không biết lúc nào "chim chạm
cột" để tự phát tiếng.

## Quyết định
- **Bé gọi tiếng bằng code**, như mọi mảnh gốc khác (ADR 0004): `play_sound("flap")`, `play_music("happy")`,
  `stop_music()`. Mỗi lệnh có "Vì sao có" trong 📘 Thư viện. Tên trong `packages/runtime/src/sounds.ts` là danh sách
  duy nhất cho Python, khối và trang. Gõ sai tên thì lỗi tiếng Việt gợi ý tên đúng; khối chỉ nhận tên có trong danh sách.
- **Trang tự tạo tiếng** bằng Web Audio (`apps/web/src/stage/sound.ts`): sóng vuông/tam giác và tiếng ồn, kiểu máy
  game cũ. Không có tệp âm thanh: không lo bản quyền, không tăng dung lượng, chạy offline qua LAN.
- Tiếng là sự kiện (`{t: 'sound'}`, `{t: 'music'}`) như lệnh vẽ: Stage phát khi tới lượt, chấm bài bỏ qua khi so hình,
  mục tiêu `played` kiểm bé đã gọi. Cùng một tiếng gọi liên tục (trong `update()`, 60 lần/giây) cách nhau ít nhất 90 ms.
  Nhạc gọi lại cùng tên thì chạy tiếp; ■ Dừng, lỗi, rời màn hình thì tắt nhạc.
- **App có tiếng riêng:** ✅ khi đạt mọi mục tiêu, ⚠️ khi code dừng vì lỗi.
- **🔇** trên thanh trên cùng (và màn chơi toàn màn hình) tắt mọi tiếng, nhớ theo máy.
- Bài tập dạy tiếng: Bài 22 bài tập 2 "Thêm tiếng cho game" (`draft: true` cho tới khi HLV duyệt). Game mẫu Bài 0 có tiếng.

## Hệ quả
- Thêm một tiếng hay một bản nhạc: thêm tên vào `sounds.ts` và công thức trong `sound.ts`, rồi mục Thư viện.
- Trình duyệt chỉ cho phát tiếng sau một lần bấm: ▶ Chạy mở khóa âm thanh.
- E2E không nghe được: Stage ghi `data-music` và `data-sounds` để kiểm.
