# 0010. Chuột, phím và hình pixel

23/11/2026 · Chấp nhận (HLV chọn làm game roguelite 23/11; bản thiết kế game còn là nháp)

## Bối cảnh
Game roguelite (`superpowers/specs/2026-11-23-roguelite-design.md`) cần đi bốn hướng, chọn thẻ bằng phím số hoặc bấm vào
thẻ, và vẽ hình pixel nhỏ phóng to, quay trái phải. Thư viện mới chỉ có `key_pressed()` và `draw_image(…, flip)`. Phím
mũi tên đã tới được Python nhưng có lỗi: trang coi **mọi** phím là một lần chạm, nên bấm mũi tên thì
`key_pressed("space")` đúng trong một khung hình.

## Quyết định
- **Vẽ:** `draw_image(path, x, y, frame=0, flip=False, scale=1, mirror=False)`. `(x, y)` vẫn là góc trên bên trái của hình
  **đã phóng**; `mirror` lật trái–phải, `flip` lật trên–dưới, cả hai lật trong khung của hình. Sự kiện `sprite` chỉ có
  `scale` / `mirror` khi khác mặc định, nên lệnh vẽ cũ ra sự kiện giống hệt từng byte.
- **Chuột / chạm:** `mouse_x()`, `mouse_y()` (tọa độ sân; `0, 0` khi chưa có), `clicked()` (True đúng một khung hình).
  Bấm ngoài hình (viền đen) thì vẫn là Space như trước, nhưng không phải `clicked()`.
- **Phím:** `key_pressed("left" | "right" | "up" | "down" | "space" | "1" | "2" | "3")`, một danh sách `KEYS` cho Python,
  khối và trang. Tên phím lạ là **lỗi tiếng Việt** gợi ý tên đúng (trước đây lặng lẽ trả False). WASD là tên khác của mũi
  tên, trang đổi theo **chỗ** phím (`e.code`), nên Caps Lock hay bộ gõ tiếng Việt không ảnh hưởng; Python chỉ thấy `left`…
  Trong code, `key_pressed("w")`, `"A"`, `" "`, `"Left"`… cũng được đổi về tên trong danh sách.
- **`GameInput`** thêm `pointer?`, `clicked?`; thiếu thì như cũ, nên `runGameTest` và `content:check` không đổi.
- **Một chỗ nhận phím và chuột** cho mọi màn game (AGENTS.md §9.11): `stage/gameInput.ts` (không DOM), `useGameKeys`,
  `useGameLoop().pointer`. Chỉ Space và chạm là "chạm". Phím bấm rồi thả giữa hai khung hình vẫn tính một khung. Thả phím
  ở đâu cũng là thả, rời cửa sổ hay bắt đầu ván mới thì nhả hết, nên phím không kẹt; phím vẫn đang giữ thì lần lặp phím kế
  tiếp lại tính là **giữ** (không phải bấm mới). Giữ theo phím thật: thả D thì → vẫn giữ. Ctrl / Alt / ⌘ + phím không phải của game.
- **Hình pixel:** mục trong manifest có thể có `pixel: true`: vẽ riêng hình đó với `imageSmoothingEnabled = false`.
- **Khối:** `pq_key_held` (danh sách phím), `pq_mouse_x`, `pq_mouse_y`, `pq_clicked`, nhóm Điều kiện. `key_pressed()` vẫn
  là `pq_key_pressed`. `draw_image` có `scale` / `mirror` tạm là code chữ.
- **Tên mới không cướp tên của bé:** biến hay `def` tên `clicked`, `mouse_x`… của bé vẫn là của bé, trong khối, ô biến và
  khi chấm.
- **Trang chơi thử `/coach/prototype`:** chỉ có ở dev server (`import.meta.env.DEV`) và chỉ cho HLV; nạp
  `tools/prototypes/ham-ngoc/main.py`, chưa có tệp thì báo. Bản build không chứa route này lẫn tệp đó (AGENTS.md §9.5). Game mẫu
  của khóa nháp (`content/courses/*/sample-game`) thì **có** trong bản build; bé không mở được vì cổng khóa nháp (ADR 0011).

## Hệ quả
- Goal `matches`, `shifts`, `sameShape` so cả `scale` và `mirror`.
- `PlayFrame` là khung chơi toàn màn hình chung của `/l/:id/play` và `/coach/prototype`.
- Lệnh mới chưa có bài dạy: mục trong `content/reference/pyquest.json` bỏ trống `lesson`; thêm bài thì điền.
- Code bé đã lưu mà gọi `key_pressed` với tên phím lạ thì nay báo lỗi thay vì im lặng.
