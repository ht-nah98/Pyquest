# Kế hoạch: game roguelite "Hầm Ngọc" (tên tạm)

HLV 23/11: đồng ý các đề xuất (hình, luật chơi) và giao làm tới khi hoàn thiện. Nhánh `feat/roguelite`.
Thiết kế: `../specs/2026-11-23-roguelite-design.md`. **Phiên mới: đọc bảng này và `git log`, làm tiếp dòng chưa xong đầu tiên.**

| # | Chặng | Xong khi | Trạng thái |
|---|---|---|---|
| 1 | Nền tảng: scale / mirror, chuột, phím 1-3, WASD, trang chơi thử DEV | bộ kiểm xanh, dist không có game thử | xong (bfa0cea) |
| 2 | Game mẫu bằng hình khối + bot cân độ khó | sim chạy, PyRunner chạy không lỗi | xong (bfa0cea), dài 1119 dòng |
| 3 | Hình vào kho | manifest `pixel: true`, ghi công, `content:check` xanh | xong (bfa0cea) |
| 4 | Ghép hình + hiệu ứng + âm thanh vào game mẫu | ảnh chụp xem được, vẫn 60 FPS | xong, đã chép vào khóa; chờ HLV chơi thử |
| 5 | Khóa mới: khung khóa, id bài riêng, để **bản nháp** (bé không thấy) | e2e: bé không vào được | xong, khóa để bản nháp |
| 6 | Đề cương + nội dung bài, mỗi bài qua `content:check` | mọi bài `draft: true` | xong phần AI: 19 bài nháp, đã qua một lượt đọc như người dạy |
| 7 | Soát code độc lập, chạy cả bộ kiểm, đo dung lượng | báo cáo thật | xong 24/11: lint, typecheck, 665 unit, content:check, e2e 41/41; gói 820 kB gzip |
| — | **HLV chơi thử, đọc lại chữ, dạy thử, bỏ `draft`** | AI không tự tích | HLV |

## Hình đã chọn
- Nguồn (ngoài repo): `~/pyquest-assets-src/atlas-picks/` và `~/pyquest-assets-src/fx-picks/`.
- Atlas: lấy `__1` của mọi loại, trừ nền (`tile-floor`, `tile-wall`: vẽ bằng code).
- Hiệu ứng: lấy `__1`, riêng `fx-fire` và `fx-explosion` lấy `__2`. Kèm LICENSE và NOTICE của pixelfx.

## Luật an toàn
- Chưa xong thì bé không thấy (AGENTS.md §9.5). Không gộp `main`, không push khi HLV chưa bảo.
- Mỗi chặng một commit, chỉ commit khi bộ kiểm của chặng đó xanh.

## Đã lên mạng (24/11)
- `4396ff4` gộp vào `main` theo lời HLV ("đẩy main luôn"), CI và deploy xanh. Khóa vẫn là **bản nháp**.
- Tách mỗi khóa một gói tải (ADR 0012): gói chính 820 → 679 kB gzip, bé không tải khóa nháp.

## Sau lần chơi thử đầu của HLV (24/11), nhánh `feat/ham-ngoc-arena`
HLV: *"tốc độ quá nhanh, màn bé quá, muốn như thể loại Vampire Survivors, sân đa dạng hơn, có AI tạo ảnh"*.
- **Nhanh là lỗi thật:** vòng game chạy theo tần số màn hình (120/144 Hz chạy nhanh gấp 2–2,4 lần). Nay tối đa 60 bước một
  giây trên mọi màn, áp dụng cả Bay Qua Khe và game của bé (`useGameLoop.ts`).
- Game mẫu: sân xem 960 × 540 (`course.sampleStage`), sân thật rộng 1900–3000 có máy quay; quái ra theo đồng hồ, có bầy,
  quái to giữ rương, thùng, nam châm, máu bằng thanh, bộ skill 6 ô. Đi chậm lại; ba ải ba kiểu sân (`FLOORS`). Bài học vẫn 600 × 600.
- Hình sân: `tools/assets/arena.py` + `arena-scenery.json` (kho CC0). Prompt cho HLV: `assets/prompts/06-arena.md`.
- Bản cũ (600 × 600) còn trong git: `d3da393`.

## Chờ HLV quyết
0. Nhịp, độ khó, độ dài mới (cỡ 9 phút một lượt) có vừa không; bài học và game của bé có lên sân rộng không.
1. Chơi thử, đọc lại chữ, dạy thử, rồi bỏ `draft` từng bài (AI không tự làm).
2. Code bé có nối từ bài này sang bài sau không (hiện mỗi bài tập bắt đầu từ code mẫu).
3. "Các bước" in sẵn bao nhiêu code.
4. Tên game, độ khó (Kiếm sĩ khó với bé mới), iPad trong game của bé cần bàn phím rời.
