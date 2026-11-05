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

- **Có Supabase** (`VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` trong `.env.local`, hoặc biến của repo trên
  GitHub): bé đăng nhập bằng tên + PIN, tiến độ đồng bộ mọi máy (ADR 0006). Server LAN cũng dùng chế độ này, nên máy bé
  cần Internet để đăng nhập. Lớp không có Internet: chạy `VITE_SUPABASE_URL= PQ_HOST=1 tools/coach-dev.sh`.
- **Không có Supabase:** hồ sơ (biệt danh + emoji) và tiến độ lưu trong IndexedDB của từng trình duyệt.
- Hồ sơ HLV: mở mục "HLV" ở trang đầu, nhập `VITE_COACH_PIN` trong `apps/web/.env.local` (mẫu: `.env.example`). HLV mở
  được mọi bài chưa ẩn và có chế độ Trình chiếu.

## Trình chiếu trên lớp

Hồ sơ HLV → mở bài → chế độ Trình chiếu. ←/→/Space chuyển slide; phím **N** mở cửa sổ ghi chú giảng (kéo sang màn hình
laptop, còn màn chiếu chỉ hiện slide).

## GitHub và CI

- Repo: https://github.com/ht-nah98/Pyquest, **public**. Mọi thứ commit lên đều ai cũng đọc được: không commit
  `.env.local`, khóa `service_role` của Supabase, mật khẩu database, tên thật hay ảnh của bé.
- PIN `2468` trong `e2e/helpers.ts` và `playwright.config.ts` chỉ dùng cho test. PIN HLV thật (trong `.env.local`) phải
  khác số này, vì ai cũng đọc được repo.
- `.github/workflows/ci.yml` chạy lint, typecheck, unit, `content:check`, build và e2e mỗi lần đẩy `main` hay mở PR.
  Đẩy xong thì xem CI xanh thật (`gh run list`), đừng giả định. E2E đỏ thì tải artifact `playwright-report`.

## Trên mạng: GitHub Pages + Supabase

- Địa chỉ cho bé: **https://ht-nah98.github.io/Pyquest/**. Job `deploy` trong `ci.yml` build với `PQ_BASE=/Pyquest/`
  và hai biến repo `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (`gh variable list`), rồi đẩy lên Pages. Chỉ deploy khi job
  `check` xanh.
- Supabase project `pyquest` (ref `zawqbiyipqqqtnhjsiwd`). Đổi schema: thêm tệp vào `supabase/migrations/`, rồi
  `npx supabase db push --remote` (cần `npx supabase login` một lần, HLV tự gõ trong terminal riêng). Đổi Edge Function:
  `npx supabase functions deploy students --use-api`. Sau mỗi lần đổi schema: `npx supabase db advisors --remote` phải rỗng.
- **Tài khoản HLV:** tạo trong Dashboard (Authentication → Users → Add user → Create new user, tích Auto Confirm). Tài
  khoản đầu tiên không phải của bé thành HLV (trigger `on_new_user`); các tài khoản sau không có quyền gì.
- **Tự đăng ký phải tắt:** Authentication → Sign In / Providers → "Allow new users to sign up" = off.
- Gói Free tạm dừng project sau 7 ngày không ai dùng: vào Dashboard bấm Restore. App vẫn chạy trên máy (offline) trong lúc đó.
- Bé quên PIN: HLV vào `/coach` → bấm tên bé → "Đặt PIN mới".
