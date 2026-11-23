# Kế hoạch: game roguelite "Hầm Ngọc" (tên tạm)

HLV 23/11: đồng ý các đề xuất (hình, luật chơi) và giao làm tới khi hoàn thiện. Nhánh `feat/roguelite`.
Thiết kế: `../specs/2026-11-23-roguelite-design.md`. **Phiên mới: đọc bảng này và `git log`, làm tiếp dòng chưa xong đầu tiên.**

| # | Chặng | Xong khi | Trạng thái |
|---|---|---|---|
| 1 | Nền tảng: scale / mirror, chuột, phím 1-3, WASD, trang chơi thử DEV | bộ kiểm xanh, dist không có game thử | xong (bfa0cea) |
| 2 | Game mẫu bằng hình khối + bot cân độ khó | sim chạy, PyRunner chạy không lỗi | xong (bfa0cea), dài 1119 dòng |
| 3 | Hình vào kho | manifest `pixel: true`, ghi công, `content:check` xanh | xong (bfa0cea) |
| 4 | Ghép hình + hiệu ứng + âm thanh vào game mẫu | ảnh chụp xem được, vẫn 60 FPS | đang làm |
| 5 | Khóa mới: khung khóa, id bài riêng, để **bản nháp** (bé không thấy) | e2e: bé không vào được | đang làm |
| 6 | Đề cương + nội dung bài, mỗi bài qua `content:check` | mọi bài `draft: true` | đang làm: chuỗi code từng bài |
| 7 | Soát code độc lập, chạy cả bộ kiểm, đo dung lượng | báo cáo thật | chưa |
| — | **HLV chơi thử, đọc lại chữ, dạy thử, bỏ `draft`** | AI không tự tích | HLV |

## Hình đã chọn
- Nguồn (ngoài repo): `~/pyquest-assets-src/atlas-picks/` và `~/pyquest-assets-src/fx-picks/`.
- Atlas: lấy `__1` của mọi loại, trừ nền (`tile-floor`, `tile-wall`: vẽ bằng code).
- Hiệu ứng: lấy `__1`, riêng `fx-fire` và `fx-explosion` lấy `__2`. Kèm LICENSE và NOTICE của pixelfx.

## Luật an toàn
- Chưa xong thì bé không thấy (AGENTS.md §9.5). Không gộp `main`, không push khi HLV chưa bảo.
- Mỗi chặng một commit, chỉ commit khi bộ kiểm của chặng đó xanh.
