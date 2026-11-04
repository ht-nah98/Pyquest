# Thêm hình vào kho

1. **Prompt:** chọn hoặc viết prompt trong `assets/prompts/` (phong cách chung ở `assets/prompts/README.md`).
2. **HLV sinh ảnh** bằng công cụ AI, đặt vào `assets/raw/<nhóm>/<tên>.png` (vd `assets/raw/bird/bird-lua.png`).
3. **Làm sạch:**
   ```bash
   npm run assets:clean -- assets/raw/bird/bird-lua.png --id bird --group bird --label "Chim én Lửa"
   ```
   `--id` là tên code dùng (`draw_bird` vẽ `bird`; game mẫu dùng `pipe`, `background`, `ground`). Cùng `id` thì ảnh mới
   thay ảnh giữ chỗ; `id` mới (vd `bird-cu`) thì thêm vào kho cho bé chọn ở Bài 3.
4. **Kiểm:** `npm run content:check`, rồi mở game mẫu ở Bài 0 xem ảnh có hợp nhau không (cỡ, màu, nét).
5. **Đo dung lượng:** `npm run build`, đọc kích thước tệp trong `dist/assets/` (AGENTS.md §9.6). Ảnh pixel thật thường
   dưới 10 KB.
6. Ảnh giữ chỗ (`credit: "placeholder"`) do `npm run assets:placeholders` vẽ; lệnh này **không bao giờ** ghi đè ảnh thật
   (`credit: "ai-generated"`).

Cỡ đích mỗi nhóm: chim 3 khung × 32×24 · cột 52×320 · nền 400×600 · đất 400×80 · nút 32×32.
Test của công cụ: `npm run assets:test`.
