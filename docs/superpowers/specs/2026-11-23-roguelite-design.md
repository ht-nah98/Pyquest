# Game roguelite (tên tạm "Hầm Ngọc") — thiết kế v1

Ngày 23/11/2026 · Trạng thái: **bản nháp, HLV chưa duyệt** · Hướng HLV đã chọn: `2026-11-23-roguelite-research.md` §4

`[HLV]` = HLV đã quyết. `[AI]` = AI đề xuất, HLV có thể bác. Tên, nhân vật, hình, luật số là của mình (AGENTS.md §3 luật 11).

## 1. Đợt này làm gì

Bản **chơi thử cho HLV**, chưa có bài học, bé chưa thấy gì. HLV chơi, chỉnh, rồi mới viết đề cương bài.

## 2. Luật chơi

- Sân 600 × 600 `[AI]`. Một lượt chơi: chọn nhân vật → ải 1 → 2 → 3 → thắng. `[HLV: đấu trường từng ải]`
- Mỗi ải: vài đợt quái, rồi một trùm. Dài cỡ 60–90 giây mỗi ải `[AI]`.
- Đi bằng mũi tên. Nhân vật **tự đánh** quái gần nhất. Chạm quái thì mất máu, sau đó bất tử một lúc ngắn.
- Quái chết rơi ngọc kinh nghiệm; lại gần thì hút ngọc. Đủ kinh nghiệm: game dừng, hiện **3 thẻ khác nhau**, chọn 1.
- Chọn thẻ: phím `1` `2` `3`, hoặc bấm / chạm vào thẻ.
- Hết máu là thua, chơi lại từ ải 1. Không có thứ gì phải trả tiền.

## 3. Nhân vật và skill

| Nhân vật | Khác nhau |
|---|---|
| ⚔️ Kiếm sĩ | nhiều máu, chém vòng gần |
| 🔮 Pháp sư | ít máu, đạn phép nổ lan |
| 🏹 Cung thủ | chạy nhanh, bắn xa |

Ba nhánh **Lửa / Băng / Sét**, mỗi nhánh 4 skill, mỗi skill 3 cấp, và một ít thẻ chung (máu, tốc độ, tầm hút ngọc).
**Phối hợp:** 2 skill cùng nhánh mở thưởng của nhánh; một skill ở mỗi hai nhánh mở thưởng đôi (Lửa+Băng, Băng+Sét,
Lửa+Sét). Toàn bộ nhân vật, quái, ải, skill là **bảng dữ liệu** (dict), code chỉ đọc bảng. Talent / năng khiếu: v2.

## 4. Hợp đồng kỹ thuật (các agent làm theo)

```python
draw_image(path, x, y, frame=0, flip=False, scale=1, mirror=False)  # mirror: lật trái-phải
key_pressed("left" | "right" | "up" | "down" | "space" | "1" | "2" | "3")
mouse_x(), mouse_y()   # chỗ chuột / ngón tay, tọa độ sân; 0, 0 khi chưa có
clicked()              # True đúng một khung khi bấm / chạm
```

- `GameInput` thêm `pointer?: { x: number; y: number }` và `clicked?: boolean` (thiếu = như cũ).
- Sự kiện `sprite` thêm `scale?: number`, `mirror?: true` (thiếu = như cũ). Manifest thêm `pixel?: true`: vẽ không làm mịn.
- WASD là tên khác của mũi tên (trang đổi, Python chỉ thấy `left`…).
- Game cũ (Bay Qua Khe) phải chạy y như trước: Space / chạm vẫn là `key_pressed("space")`.

## 5. Tên hình (kho hình, sau khi HLV chọn)

`hero-knight` `hero-mage` `hero-archer` · `mob-slime` `mob-bat` `mob-mushroom` `mob-ghost` `mob-golem` · `boss-1..3` ·
`item-xp` `item-heart` `item-chest` · `shot-fire` `shot-ice` `shot-spark` `shot-arrow` ·
`skill-fire-1..4` `skill-ice-1..4` `skill-spark-1..4` `skill-common-1..4` ·
`fx-hit` `fx-slash` `fx-fire` `fx-ice` `fx-spark` `fx-explosion` `fx-poof` `fx-levelup` `fx-heal` `fx-pickup`

Không máu me, không súng, không hình giống nhân vật game có sẵn.

## 6. Còn phải hỏi HLV

Tên game, hình (bảng xem trước), độ khó sau khi chơi thử, đề cương bài.
