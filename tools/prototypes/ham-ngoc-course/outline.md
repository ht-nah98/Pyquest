# Hầm Ngọc — đề cương phần code (bản nháp, HLV chưa đọc lại)

Phần code của khóa "bản của em": 18 bài (h01–h18), 40 bài tập. Mỗi bài tập nằm ở `hNN/eK/`:
`starter.py`, `solution.py`, `wrongN.py` (cách làm sai phải trượt), `altN.py` (cách làm đúng khác phải qua), `spec.json` (đề, các bước, gợi ý, mục tiêu, toolbox).
Đừng sửa tay các tệp đó: sửa `tools/src1.py` (h01–h06), `src2.py` (h07–h12), `src3.py` (h13–h18) rồi chạy lại. Cách làm đúng khác nằm ở `tools/alts.py`.

```bash
python3 -B tools/make.py                  # viết lại hNN/eK/
python3 -B tools/check.py [h05 …] [-v] [--fuzz] [--png THƯ_MỤC]
python3 -B tools/bot.py h18/e3 20         # người máy chơi bản hoàn chỉnh
python3 -B tools/seeds.py 30 [h05 …]      # mục tiêu có còn đúng khi số ngẫu nhiên khác đi?
```

**Mỗi bài tập bắt đầu từ code mẫu sạch** (lời giải bài trước + phần dọn): tên, số bé đổi **không** mang sang bài sau. Bé ghi ý vào vở,
tới h18-e3 (sau khi đạt hết mục tiêu) mới đưa vào bản của mình. Chỗ code được dọn lại ghi ở mục "Dọn code" và ở `reorganised` trong `spec.json`. Hai bài tập dạy dict (h03-e1) và danh sách dict (h04-e1) là `script`, chấm bằng hình mẫu
trên sân 600 × 600; h01-e1 cũng là `script` vì chỉ `matches` thấy được `scale`.

**Đồ thử** (`START_HP`, `START_PICKS`, `START_SKILLS`, `LATE_SKILLS`, `START_WAVE`, `START_HERO`, `xp = 10` ở h10-e3, `record = 2` ở h18-e2): vài bài đặt sẵn để thử nhanh một đoạn xa
trong game. Nên nói với lớp đây là thói quen của người làm game thật; h18-e3 tháo hết. Vài biến chỉ để máy chấm đọc (`edge`, `combos`, `early`, `early_hit`,
`busy`, `page`), bài ngay sau bỏ đi.

**Cách làm sai mà bài cảnh báo phải trượt:** `wrongN.py` có cả những lỗi ghi ở "Lỗi hay gặp"; mỗi lỗi mới thấy ở lớp thì thêm vào `wrong=` của bài đó.
**Chia 2 buổi:** h10 (sau e1), h14 (sau e1), h15 (sau e1), h18 (sau e2); ghi chú HLV của từng bài nói cắt ở slide nào.

---

## h01 — Nhân vật vào hầm
- **Ý mới:** sân 600 × 600, `scale=3` (ảnh pixel 16 × 16 phóng to), điểm giữa và góc ảnh khác nhau.
- **Vì sao lúc này:** mọi thứ sau này tính bằng điểm giữa (đuổi, chạm, bắn), nên phải rõ "góc ảnh = giữa - 24" ngay từ đầu.
- **Bé thấy:** kiếm sĩ to rõ đứng giữa hai ngọn đuốc, có tên trên đầu.
- **Lỗi hay gặp:** quên dấu phẩy trước `scale`; vẽ ở `x, y` nên nhân vật lệch xuống phải.
- **Hỏi lớp:** ảnh rộng 16, `scale=3`. Muốn giữa ảnh ở 300 thì góc ảnh ở đâu? Nếu `scale=5` thì sao?

## h02 — Đi bốn hướng
- **Ý mới:** `key_pressed("left")`…; chặn mép bằng cách đặt lại đúng ranh giới.
- **Vì sao lúc này:** có nhân vật là phải điều khiển được ngay; chưa cần dict.
- **Bé thấy:** tự lái nhân vật, không chạy mất khỏi sân.
- **Lỗi hay gặp:** lên xuống ngược (y tăng là đi xuống); dùng `elif` nên không đi chéo được (máy giữ hai phím cùng lúc để bắt); chặn ở 600 thay vì 576.
- **Hỏi lớp:** vì sao là 24 và 576 mà không phải 0 và 600?

## h03 — Hộp có tên: dict
- **Ý mới:** `{"x": 300, "hp": 5}`, đọc và đổi một ngăn.
- **Vì sao lúc này:** đã có x, y, speed rời nhau; sắp có máu, tên. Bé thấy rõ cần gom lại. Có slide "Nối chữ bằng dấu +" trước e1.
- **Bé thấy:** hai người trong hai hộp (e1), rồi nhân vật của game nằm trong hộp `hero` (e2).
- **Dọn code (lần 1):** `x, y, speed` vào `hero`; thêm `move_hero()` và `draw_thing(image, x, y, size)` (vẽ theo điểm giữa).
- **Lỗi hay gặp:** quên ngoặc kép quanh tên ngăn; cộng máu sau khi đã vẽ.
- **Hỏi lớp:** vì sao đổi `hero["y"]` trong hàm mà không cần `global`? (đổi đồ trong hộp, không thay cái hộp)

## h04 — Cả bầy quái
- **Ý mới:** danh sách các dict, `for mob in mobs`; hàm trả về một dict mới.
- **Vì sao lúc này:** một con là một hộp, cả bầy là một danh sách hộp.
- **Bé thấy:** 5 con khác nhau trên hình mẫu (e1), 6 con nhớt xếp trên đầu hầm (e2).
- **Dọn code:** thêm `mobs`, `make_mob`, `start_game()` gọi ở cuối file. Ngăn `speed` tới Bài 5, ngăn `hp` tới Bài 9 mới thêm.
- **Lỗi hay gặp:** `append` sau khi vẽ; để lệnh vẽ ngoài vòng `for`.
- **Hỏi lớp:** vì sao `make_mob` phải làm hộp mới mỗi lần? Dùng chung một hộp thì sao?

## h05 — Quái đuổi theo
- **Ý mới:** so sánh từng trục; gọi hàm với cả một dict; nhịp `tick % 50`; `return` sớm.
- **Vì sao lúc này:** chưa có căn bậc hai, so từng trục là đủ và dễ vẽ trên giấy.
- **Bé thấy:** cả bầy chạy theo mình, quái ra ở mép xa nên công bằng.
- **Lỗi hay gặp:** quái bỏ chạy (nhầm dấu); viết `hero` trong `step_to` thay vì `target`; quên thay `return 300` (e2: `edge` nhớ mép quái vừa ra).
- **Hỏi lớp:** `step_to` viết cho quái. Sau này thứ gì nữa cũng dùng được? (ngọc, h10)

## h06 — Chạm là mất máu
- **Ý mới:** `abs`, `distance`, `near`; đếm ngược khung bất tử.
- **Vì sao lúc này:** đã đuổi kịp thì phải có hậu quả. e1 cố ý cho máu tụt vèo để e2 có lý do (chỉ có 1 con cho dễ nhìn, cả bầy trở lại ở e2).
- **Bé thấy:** chạm là thua ngay (e1), rồi chạm thì nhấp nháy 1 giây (e2).
- **Dọn code:** `game_over` như Bay Qua Khe; `tick` chỉ đếm khi còn chơi (e1 chấm bằng lúc thua).
- **Lỗi hay gặp:** quên `abs` nên khoảng cách âm; chỉ đo một trục; quên trừ `safe`.
- **Hỏi lớp:** nếu không có bất tử, 5 máu sống được mấy khung?

## h07 — Con nào gần nhất?
- **Ý mới:** tìm nhỏ nhất trong danh sách (giữ kỷ lục, gặp tốt hơn thì thay).
- **Vì sao lúc này:** đứng trước bài bắn; thấy kết quả bằng mắt qua vạch trắng.
- **Bé thấy:** vạch trắng luôn nối tới con gần nhất.
- **Lỗi hay gặp:** `return` nằm trong vòng `for`; dấu `>`.
- **Hỏi lớp:** vì sao phải bắt đầu bằng `mobs[0]`? Danh sách rỗng thì sao?

## h08 — Tự bắn
- **Ý mới:** danh sách đạn; đếm ngược `wait`; hướng = (đích - mình) / khoảng cách × tốc độ.
- **Vì sao lúc này:** có `nearest()` và `distance()` rồi, ghép lại là ngắm được.
- **Bé thấy:** e1 đạn bay thẳng lên đều đặn, e2 đạn tự tìm quái.
- **Dọn code:** bỏ vạch trắng; `hit_mobs()` đếm lần chạm; chữ "Đã bắn", "Đạn chạm" trên sân. Luật có sẵn: quái đứng đúng chỗ em
  (vx, vy đều 0) thì đạn bay thẳng lên.
- **Lỗi hay gặp:** quên đặt lại `wait` (bắn như mưa); viết ngược `hero - target` (cả hai hay một trục); quên chia `far`, quên `+ 1`, quên `* 8`.
- **Hỏi lớp:** vì sao `+ 1` ở `far`? (không bao giờ chia cho 0)

## h09 — Hết máu thì biến mất
- **Ý mới:** "giữ lại" bằng danh sách mới và `append`; cờ `live`.
- **Vì sao lúc này:** là khuôn dùng lại 3 lần nữa (ngọc, đạn, hiệu ứng).
- **Bé thấy:** quái biến mất, chữ "Hạ" tăng; một viên đạn chỉ trúng một con.
- **Lỗi hay gặp:** quên dòng `mobs = alive`; giữ nhầm con đã hết máu; quên `live` hay quên `reach`. (`mobs = alive` thụt trong `for` vẫn chạy đúng.)
- **Hỏi lớp:** vì sao không xóa ngay khi đang đi qua danh sách?

## h10 — Ngọc kinh nghiệm
- **Ý mới:** rơi, hút, nhặt; thanh = bề rộng × phần đã có; ngưỡng tăng dần.
- **Vì sao lúc này:** hạ quái cần phần thưởng; chuẩn bị cho lên cấp.
- **Bé thấy:** ngọc bay về mình, thanh xanh dài ra, "Cấp 2".
- **Dọn code:** bỏ `flying`; e2 thêm `draw_bar(width)` (bé chỉ tính bề rộng); e3 có sẵn 10 ngọc để thử.
- **Lỗi hay gặp:** nhặt rồi mà viên vẫn còn (cộng mãi); cộng `level` trước khi trừ `xp`; đặt `xp = 0`; `need()` cố định.
- **Hỏi lớp:** `need()` đổi theo `level`. Vậy trừ trước hay cộng trước?

## h11 — Game có nhiều màn hình
- **Ý mới:** biến `screen`; dừng game chỉ là đổi màn.
- **Vì sao lúc này:** lên cấp cần game đứng lại để chọn.
- **Bé thấy:** màn chờ, thua rồi chơi lại, lên cấp thì mọi thứ đứng im.
- **Dọn code (lần 2):** `game_over` → `screen`; mọi biến của ván đặt trong `start_game()` (không viết hai lần); `update` cũ thành
  `update_play`, `draw` cũ thành `draw_play`.
- **Thả rồi mới bấm:** `let_go` (có sẵn) buộc thả Space ra rồi bấm lại, nên giữ Space không lướt mất bảng; Bài 13 thay bằng `held`.
- **Lỗi hay gặp:** dùng `if` thay `elif` nên đang chơi bấm Space là chơi lại từ đầu.
- **Hỏi lớp:** vẽ sơ đồ các màn và mũi tên. Mũi tên nào cần phím gì?

## h12 — Bảng skill
- **Ý mới:** dữ liệu tách khỏi code; bốc không lặp lại (`pool`, `remove`).
- **Vì sao lúc này:** đã có màn cards, cần thứ để chọn.
- **Bé thấy:** sổ skill tự dài ra khi thêm dòng (e1); 3 thẻ khác nhau mỗi lần bấm Space (e2).
- **Dọn code:** e1 màn chờ tạm vẽ sổ skill; e2 game mở thẳng ở màn cards, `check_cards()` tự đếm lần bị trùng.
- **Lỗi hay gặp:** xóa khỏi `SKILLS` thật; `len(pool)` thay vì `len(pool) - 1` (có lúc lỗi, có lúc không!).
- **Hỏi lớp:** muốn thêm skill thứ 10 thì sửa mấy dòng code?

## h13 — Chọn thẻ
- **Ý mới:** phím 1 2 3; bấm mới tính (`held`); bấm trúng khung nào (`clicked`, `mouse_y`).
- **Vì sao lúc này:** có thẻ rồi; phải chọn được bằng phím và bằng chuột / ngón tay.
- **Bé thấy:** vào hầm được chọn thẻ; giữ phím không bị mất thẻ; bấm thẻ bằng chuột.
- **Dọn code:** `owned`, `picks`, `take_card`; `update()` gọi `picked_number()` mọi khung để `held` luôn đúng.
- **Lỗi hay gặp:** `cards[number]` thiếu `- 1`; đặt `held = number` trước khi so.
- **Hỏi lớp:** giữ phím nửa giây là 30 khung. Không có `held` thì mất mấy thẻ?

## h14 — Phối hợp
- **Ý mới:** tên ngăn lấy từ biến `bonus[skill["what"]]`; đếm có điều kiện; hàm True/False mở luật.
- **Vì sao lúc này:** skill đã lấy phải có tác dụng thật trước khi nói chuyện phối hợp.
- **Bé thấy:** vòng lửa, sét (e1); dòng Lửa/Băng/Sét đếm đúng (e2); Lò Than, Thấu Xương, Bão Sét (e3).
- **Dọn code (nặng nhất khóa, 56 dòng mới ở e1):** thêm `hurt`, `blast`, `strike`, `use_skills`, đọc `bonus` ở 5 chỗ; Vòng Lửa hiện vòng cam, Mây Giông
  hiện tia vàng; số máu tạm hiện trên đầu (nhớt 24 máu ở e1, 8 máu từ e2). Slide "Hàm có sẵn, mỗi hàm một việc" kể tên 5 hàm.
  e3: `storm()`, `splash(shot)` viết sẵn; `LATE_SKILLS` thêm skill ở tick 100 nên đầu ván chưa có phối hợp; chữ "Trúng: n" là phát vừa rồi trừ mấy máu.
- **Hai buổi:** buổi 1 tới hết e1 (Thiết kế là đi tìm 5 chỗ đọc `bonus`); buổi 2 là các slide phối hợp nằm **trong bước Code**, giữa e1 và e2.
- **Lỗi hay gặp:** cộng nhầm ngăn `power`; `=` thay `+=`; `== "branch"` (chữ) thay vì `== branch` (biến); `>= 1`; ra đòn mà quên hỏi `has_combo`.
- **Hỏi lớp:** một dòng `bonus[skill["what"]] += skill["add"]` đủ cho mọi skill. Vì sao?

## h15 — Đợt quái và trùm
- **Ý mới:** bảng tra theo tên `MOBS[name]`; bảng `WAVES` điều khiển nhịp; trùm chỉ là một dòng.
- **Vì sao lúc này:** skill mạnh rồi thì cần quái xứng sức.
- **Bé thấy:** dơi, golem (e1); hết quái mới sang đợt (e2); trùm to có thanh máu, "Em thắng rồi!" (e3).
- **Dọn code (lần 3):** `make_mob(name, x, y)`; va chạm theo `size`; `for axis in ["x", "y"]` gom code hai trục, gần hơn nửa bước thì
  `step_to` thôi bước. Nhớt về 3 máu; chữ "máu, cỡ" và `+xp` hiện tạm tới hết e2; e3 thêm thanh máu trùm và chữ 12/12 (`mob["max"]`).
- **Lỗi hay gặp:** `else` thay `elif len(mobs) == 0` (sang đợt khi còn quái); quên `left -= 1`.
- **Hỏi lớp:** `left % row["every"] == 0` với `every` = `count` nghĩa là gì?

## h16 — Chọn nhân vật
- **Ý mới:** `for key in row` chép cả dict; dùng lại `picked_number()` cho màn khác.
- **Vì sao lúc này:** mọi con số của nhân vật đã nằm trong `hero`, đổi nhân vật chỉ là đổi dòng.
- **Bé thấy:** 3 nhân vật chơi khác nhau thật (máu, tầm, tốc độ, sức).
- **Dọn code:** thêm chữ "Sức, tầm"; e1 màn chờ tạm ghi bảng HEROES; số quái / đợt / trùm đổi từ bản thử sang bản thật (nhớt 4, dơi 3, golem 18, trùm 400; bot chơi thử: xem `tools/bot.py`).
- **Lỗi hay gặp:** `HEROES[number]` thiếu `- 1`; quên `str()` khi nối chữ.
- **Hỏi lớp:** chép hộp khác gì dùng chung hộp? (kẻo mất máu là mất luôn trong bảng)

## h17 — Hiệu ứng và tiếng
- **Ý mới:** gói khuôn "giữ lại" thành `living(things)`; `frame` chạy dần là hoạt hình; tiếng đúng lúc.
- **Vì sao lúc này:** lần thứ tư gặp khuôn này, đáng gói thành hàm.
- **Bé thấy:** trúng đạn tóe sáng, quái thua bụp khói, Lò Than tóe lửa, Bão Sét tóe sét; nhạc và 5 tiếng.
- **Dọn code (lần 4):** đạn, ngọc cũng có `hp` và dùng `living()`; bỏ `remove_shots`, `live`. `remove_dead` giữ nguyên vì phải đếm.
- **Lỗi hay gặp:** quên cộng `frame` hay cộng 1 (`page` nhớ hình lớn nhất đã chiếu); `living(effects)` mà không gán lại; đặt `play_sound` ở chỗ chạy mỗi khung.
- **Hỏi lớp:** hiệu ứng không có `hp` thì dùng `living()` được không?

## h18 — Ra mắt
- **Ý mới:** thêm nội dung chỉ bằng dữ liệu; kỷ lục nhớ qua nhiều ván; tháo đồ thử.
- **Vì sao lúc này:** game đã đủ, giờ là của em.
- **Bé thấy:** quái ma và Giày Gió tự vào game; kỷ lục; chữ ký; bạn chơi game của mình.
- **Dọn code:** `finish(result)` cho cả thắng và thua; e2 đặt `START_WAVE = 4` (gặp trùm, thua nhanh hai ván) và `record = 2` (kỷ lục cũ để thử).
- **Lỗi hay gặp:** `what` không phải ngăn có trong `bonus` (máy báo `Dòng N: hộp không có ngăn "sped".`, N là dòng trong `add_skill`); `record = kills`
  không `if`, `record += kills`; quên trả `START_WAVE` về 0.
- **Hỏi lớp:** chơi game của bạn 10 phút: một điều hay, một điều muốn sửa, và con số nào trong bảng cần đổi?

---

## Thứ tự so với spec §7
- **h14 có thêm phần "skill có tác dụng thật"** (e1) trước khi đếm nhánh: §7 nhảy từ chọn thẻ sang phối hợp, nhưng chưa có skill
  nào tác dụng thì phối hợp không có gì để phối hợp. h14 vì vậy nặng, chia 2 buổi.
- **Quái ra liên tục** vào h05-e2 (không đợi h15), để h06–h14 luôn có quái mà thử.
- **Được chọn 1 thẻ khi vào ván** (từ h13): thử thẻ ngay, không phải đợi lên cấp.
- **Nhiều loại quái** chỉ tới h15-e1 (bảng `MOBS`); trước đó chỉ có nhớt.
- **h07 chỉ có 1 bài tập**: ý khó nhưng ngắn; muốn luyện thêm thì làm trên giấy.
