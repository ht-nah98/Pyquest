# Tài khoản và đồng bộ tiến độ bằng Supabase (đợt 2)

Ngày 05/11/2026. HLV đã chọn: **biệt danh + PIN 6 số, HLV tạo tài khoản**; **mất mạng vẫn học, có mạng tự đồng bộ**;
**có màn HLV xem tiến độ và code của từng bé** ngay đợt này.

## 1. Vì sao

Hiện tiến độ nằm trong IndexedDB của từng trình duyệt: bé học ở lớp thì về nhà không thấy bài, HLV không biết bé ở nhà
làm tới đâu. Mục tiêu: **một bé = một tài khoản**, học ở máy nào cũng tiếp tục được, HLV nhìn thấy cả lớp.

Không phải mục tiêu đợt này: đưa web lên Internet (bước riêng, ngay sau), phần thưởng, nhiều lớp, phụ huynh.

Thất bại dù chạy được: bé mất bài vì mạng chập chờn; người lạ tạo được tài khoản hay đọc được code của bé; khóa bí mật
lọt vào repo public.

## 2. Đăng nhập

- **Bé:** gõ **tên đăng nhập** (chữ thường không dấu, ví dụ `minh`, HLV đặt) và **PIN 6 số**. Đăng nhập một lần trên mỗi
  máy; lần sau app nhớ. Màn hiện **biệt danh + avatar** (có dấu, ví dụ "Minh 🐉"), không hiện tên đăng nhập.
- **HLV:** email + mật khẩu thật của HLV. Tài khoản HLV tạo **một lần** trong Dashboard Supabase (Authentication → Add
  user), rồi chạy một dòng SQL đánh dấu là HLV. PIN `VITE_COACH_PIN` chỉ còn dùng ở chế độ không có Supabase (dev, e2e).
- Bên dưới: Supabase Auth email + mật khẩu. Email của bé là email giả, không gửi thư: `<tên đăng nhập>@hs.pyquest.invalid`.
  PIN là mật khẩu (Supabase bắt ≥ 6 ký tự, nên PIN 6 số).
- **Tắt tự đăng ký** (Authentication → "Allow new users to sign up" = off). Chỉ HLV tạo được tài khoản bé, qua Edge
  Function `students` chạy bằng khóa `service_role` **nằm sẵn trong Supabase**, không bao giờ ở máy hay repo.
- Quên PIN: HLV đặt PIN mới trong màn HLV.

## 3. Dữ liệu (Postgres, có RLS)

| Bảng | Cột chính | Ai đọc / ghi |
|---|---|---|
| `profiles` | `id` (= auth user), `login`, `nickname`, `avatar`, `role` (`student`/`coach`) | bé: dòng của mình; HLV: tất cả |
| `lesson_states` | `user_id`, `lesson_id`, `state` (jsonb = `LessonState`), `updated_at` | bé: dòng của mình (đọc, ghi); HLV: đọc tất cả |

Chỉ lưu biệt danh, avatar, tiến độ, code bé viết (AGENTS.md §3 luật 8). Tên đăng nhập HLV đặt không phải tên thật đầy đủ.
SQL nằm trong `supabase/migrations/`, Edge Function trong `supabase/functions/students/`. Repo là nguồn chuẩn.

## 4. Mất mạng vẫn học

- Mọi lần lưu vẫn ghi vào **IndexedDB trước** (như bây giờ), kèm một hàng đợi "chưa gửi". Có mạng thì gửi lên
  Supabase; mất mạng thì giữ đó, có mạng lại thì gửi tiếp. Màn hình có chấm nhỏ: ☁️ đã lưu lên mạng / ⏳ đang chờ mạng.
- Đăng nhập trên máy mới: tải mọi bài của bé về máy.
- Hai máy cùng sửa một bài (hiếm): giữ bản sửa **mới hơn** cho code và vị trí slide, nhưng **gộp** những thứ bé đã đạt
  (bài tập xong, bước xong, slide xa nhất) để không bao giờ mất thành tích.
- Đăng nhập lần đầu phải có Internet. Lớp học qua LAN thì máy bé vẫn cần Internet để đăng nhập và đồng bộ.

## 5. Màn HLV (`/coach`, chỉ HLV)

- **Danh sách bé:** biệt danh, avatar, đang ở bài nào, lần cuối học. Nút **Thêm bé** (tên đăng nhập, biệt danh, avatar,
  PIN) và **Đặt PIN mới**.
- **Bảng tiến độ:** hàng = bé, cột = bài; ô tô màu theo số bài tập đã xong.
- **Xem code của bé:** chọn bé → bài → bài tập, xem code và hình bé vẽ ra (**chỉ đọc**, không sửa được bài của bé).

## 6. Kỹ thuật

- Thêm dependency `@supabase/supabase-js` 2.118.0 (ADR 0006). Không thêm thư viện khác.
- Lên mạng bằng GitHub Pages ở `/Pyquest/`, deploy sau CI xanh (AI quyết, HLV muốn "sản phẩm cuối để dùng", 05/11).
- `SupabaseStore` cài đặt `ProgressStore` (giữ nguyên interface, mở rộng thêm phần HLV), bọc `DexieStore` làm bộ nhớ
  trên máy. Không có `VITE_SUPABASE_URL` thì app chạy như bây giờ (DexieStore), để dev, e2e và lớp offline vẫn chạy.
- Đưa SQL và Edge Function lên Supabase: HLV tự gõ `! npx supabase login` một lần (đăng nhập bằng trình duyệt), sau đó AI
  chạy `supabase db push` / `functions deploy`. Nếu HLV không muốn, AI đưa đoạn SQL để dán vào SQL Editor.
- Kiểm: unit test cho gộp tiến độ và hàng đợi; e2e với store giả; một bài kiểm thật trên project `pyquest` (tạo bé thử,
  đăng nhập hai "máy", sửa, xem đồng bộ, rồi xóa bé thử).

## 7. Việc HLV làm (AI không làm thay)

1. Tắt tự đăng ký trong Dashboard.
2. Tạo tài khoản HLV (email + mật khẩu của anh) và chạy dòng SQL đánh dấu HLV.
3. `! npx supabase login` một lần.
4. Tạo tài khoản cho 3 bé trong màn HLV, rồi chơi thử đăng nhập trên hai máy.

## 8. AI tự quyết (ghi lại để HLV xem)

- Email giả miền `.invalid` (miền dành riêng, không ai sở hữu, không gửi thư được).
- Gộp tiến độ: mới hơn thắng, thành tích thì gộp.
- Phiên đăng nhập lưu trong localStorage của trình duyệt (mặc định của supabase-js).
