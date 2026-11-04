# Thêm hình vào kho

1. **Prompt:** chọn hoặc viết prompt trong `assets/prompts/` (phong cách chung ở `assets/prompts/README.md`).
2. **HLV sinh ảnh** bằng công cụ AI, đặt vào `assets/raw/<nhóm>/<tên>.png` (vd `assets/raw/bird/bird-lua.png`).
   Nền **trắng** hoặc **magenta** đều được: công cụ loang nền trắng từ mép vào, nên phần trắng nằm trong viền (bụng chim)
   vẫn giữ.
3. **Khai báo** ảnh trong `assets/raw/library.json`: `src`, `id` (tên code dùng), `group` (`bird`, `pipe`,
   `background`), `label` (tên tiếng Việt cho bé chọn). `id` `bird`, `pipe`, `background` là hình mặc định mà game mẫu và
   code bài dùng (`draw_image("images/bird.png", …)`); các id khác (`bird-cu`, `pipe-da`…) là lựa chọn thêm cho Bài 5.
   Tên `<nhóm>-<biến thể>` là bắt buộc: goal chấm theo nhóm (`bird` khớp `bird-rong`).
4. **Làm sạch:** `npm run assets:clean -- --all` (hoặc một ảnh: `npm run assets:clean -- <ảnh> --id X --group Y`).
5. **Kiểm:** `npm run content:check`, khởi động lại `npm run dev` (tệp mới trong `content/`, AGENTS.md §9.3), mở game
   mẫu ở Bài 0 xem hình.
6. **Đo dung lượng:** `ls -l content/assets/library`. Đợt đầu: 12 ảnh + 4 dải đất ≈ 1,4 MB.

## Công cụ làm gì (`tools/assets/clean.py`)

| Nhóm | Cỡ trong game | Cách làm |
|---|---|---|
| `bird` | 3 khung × 44×40 | tách nền, cắt chung một khung cho 3 hình, thu nhỏ mịn |
| `pipe` | 76×440 | thân cột thu về rộng 52 (= vùng va chạm) và đặt giữa; lá/đầu cột được tràn hai bên; thiếu chiều cao thì lặp đoạn thân |
| `background` | 400×600 | phủ kín sân, giữ phần đáy (đất), cắt bớt trời |
| `ground` (tự sinh từ nền) | 800×80 | 80 dòng đáy của nền + bản lật gương của nó, nên cuộn vòng không có vết nối |

- Ảnh lưu ở **gấp đôi** cỡ trong game (`SCALE = 2`) và sân chơi vẽ theo độ phân giải thật của màn hình, nên hình vẫn nét
  khi chiếu to. Manifest ghi cỡ **trong game**; trình vẽ đọc cỡ thật từ tệp ảnh.
- PNG bảng 256 màu: một ảnh nền khoảng 100–250 KB thay vì 1 MB (AGENTS.md §9.6).
- `npm run assets:placeholders` vẽ ảnh giữ chỗ cho id còn thiếu và **không bao giờ** ghi đè ảnh thật
  (`credit: "ai-generated"`).
- Test: `npm run assets:test`.
