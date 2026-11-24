# 06 · Sân đấu Hầm Ngọc

Sân đang dùng hình code vẽ (`tools/assets/arena.py`) và hình trong kho pixel. HLV sinh hình nào thì hình đó **thay**
hình cùng id. Đặt ảnh vào `assets/raw/arena/` đúng tên, rồi nhắn AI để làm sạch và thu nhỏ (công cụ làm sạch nhóm này
**chưa viết**, AI viết khi có ảnh đầu tiên).

**Nhìn từ trên xuống, hơi nghiêng** (top-down 3/4), khác với các bộ 01–04 (nhìn ngang). Sinh 2–4 bản mỗi prompt, chọn
bản nét pixel rõ nhất. Không chữ, không nhân vật của game có sẵn, không máu me.

## A · Nền (ưu tiên 1) — 3 ảnh vuông 1:1, **không** nền magenta

Lát liền mạch bốn phía. Ít chi tiết, màu trung bình (không quá sáng hay tối) để thấy rõ quái.
Cuối mỗi prompt thêm: `seamless tileable texture, top-down view, 16-bit pixel art, crisp hard pixel edges, limited palette
(max 16 colors), low contrast, no objects, no characters, no text, no border, no vignette`

| Tệp | Prompt |
|---|---|
| `ground-meadow.png` | `lush green meadow ground, short grass with small tufts, a few tiny yellow and pink flowers, scattered pebbles` |
| `ground-forest.png` | `misty enchanted forest floor, blue-green moss, fallen leaves and twigs, a few tiny glowing cyan spores` |
| `ground-cave.png` | `warm brown volcanic cave floor, cracked stone slabs, small rubble, a few tiny glowing orange embers` |

## B · Vật mốc lớn (ưu tiên 2) — ảnh vuông 1:1, nền magenta phẳng

Cuối mỗi prompt thêm đoạn phong cách chung trong `README.md`, đổi `side view` thành `top-down 3/4 view`.

| Tệp | Prompt |
|---|---|
| `meadow-windmill.png` | `a small old wooden windmill with moss on its stone base` |
| `meadow-bridge.png` | `a short wooden plank bridge over a narrow stream` |
| `meadow-hut.png` | `a tiny cottage ruin overgrown with ivy` |
| `forest-giant-tree.png` | `a huge ancient tree with glowing blue lanterns hanging from its branches` |
| `forest-shrine.png` | `a small mossy stone shrine with a soft cyan glow` |
| `forest-log.png` | `a big fallen hollow log covered with moss and ferns` |
| `cave-gate.png` | `a ruined stone gate with two broken pillars and glowing orange cracks` |
| `cave-crystals.png` | `a large cluster of pale blue and violet crystals growing from rock` |
| `cave-forge.png` | `an abandoned stone forge with glowing embers` |

## C · Quái và trùm (khi nào HLV muốn thay) — nền magenta phẳng

Mỗi con **3 tư thế đi trong một hàng ngang** (`three walking poses in one row, same size, evenly spaced`), quay mặt
sang trái. Hiện quái chỉ có một hình, nhún lên nhún xuống bằng code.

| Tệp | Prompt |
|---|---|
| `mob-slime.png` | `a cute round green slime with big eyes` |
| `mob-bat.png` | `a cute small purple bat with spread wings` |
| `mob-ghost.png` | `a cute pale blue ghost with a wavy tail` |
| `mob-golem.png` | `a chunky grey stone golem with moss on its shoulders` |
| `boss-slime-dragon.png` | `a big round slime shaped like a baby dragon, green and shiny` |
| `boss-snowman.png` | `a big grumpy snow giant with icicle shoulders` |
| `boss-lava-king.png` | `a big lava giant with a crown of fire and dark rock armor` |
