# Chạy PyQuest cho lớp

## Đợt 1: chạy trên laptop HLV, các bé vào qua mạng LAN

Chưa deploy, chưa có Supabase (spec §3). Laptop HLV làm máy chủ; 3 bé mở trình duyệt trên máy mình.

```bash
cd ~/Desktop/PyQuest
npm install                       # lần đầu, hoặc sau khi kéo code mới
PQ_HOST=1 tools/coach-dev.sh      # phục vụ bản HEAD ở cổng 5174, in ra địa chỉ cho bé
```

- Script chạy từ **bản chụp** (`~/.cache/pq/coachwt`), không chạy trên cây đang sửa (AGENTS.md §9.9). Muốn bản mới thì
  chạy lại script.
- Cổng **5174**: 5173 để dành cho CodeQuest của HLV, 5199 cho e2e, 5180 cho agent thử tay.
- Bé mở `http://<IP laptop HLV>:5174`. Máy HLV và máy bé phải cùng Wi-Fi. Tường lửa (nếu có) phải mở cổng 5174.
- **Không cần Internet:** Pyodide (Python) và media của Blockly được phục vụ từ chính server (`apps/web/public/pyodide`,
  `public/blockly-media`, do `postinstall` chép vào).
- Lần đầu mở, mỗi máy tải khoảng 10 MB (Python). Nút Chạy hiện "Đang chuẩn bị Python…" trong lúc chờ.
- Trang chạy qua `http://` (không phải https) nên không dùng API cần "secure context" (`crypto.randomUUID`,
  clipboard…). Mã tạo id ở `storage/dexieStore.ts` vì lý do này.

## Hồ sơ và tiến độ

- Hồ sơ (biệt danh + emoji) và tiến độ lưu trong **IndexedDB của từng trình duyệt**. Máy ở nhà không thấy tiến độ ở lớp:
  chờ Supabase (đợt 2).
- Hồ sơ HLV: mở mục "HLV" ở trang đầu, nhập `VITE_COACH_PIN` trong `apps/web/.env.local` (mẫu: `.env.example`). HLV mở
  được mọi bài chưa ẩn và có chế độ Trình chiếu.

## Trình chiếu trên lớp

Hồ sơ HLV → mở bài → chế độ Trình chiếu. ←/→/Space chuyển slide; phím **N** mở cửa sổ ghi chú giảng (kéo sang màn hình
laptop, còn màn chiếu chỉ hiện slide).
