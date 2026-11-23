# Hầm Ngọc — bản chơi thử

Roguelite nhỏ bằng Python, chạy bằng thư viện `pyquest` (sân 600 × 600). Luật chơi và hợp đồng kỹ thuật:
`docs/superpowers/specs/2026-11-23-roguelite-design.md`. Chưa có bài học, bé chưa thấy. **HLV chưa chơi thử.**

| Tệp | Là gì |
|---|---|
| `main.py` | cả game, một tệp. Bảng dữ liệu ở đầu, code đọc bảng ở dưới |
| `sim.py` | bot chơi không cần màn hình, để kiểm luật và đo độ khó (chỉ cần Python) |

## Chạy sim

```bash
cd tools/prototypes/ham-ngoc
python3 -B sim.py                 # bảng cân bằng: tỉ lệ thắng, độ dài, thua ở ải nào, từng skill
python3 -B sim.py --seeds 100     # nhiều lượt hơn, số đỡ nhiễu (±8 điểm với 40 lượt một dòng)
python3 -B sim.py --edge          # các trường hợp khó: giữ phím, lên cấp dồn, hết thẻ, trùm và em ngã cùng lúc
python3 -B sim.py --png THU_MUC   # vẽ vài khung ra ảnh PNG (cần Pillow)
```

Mỗi khung sim kiểm: tim trong khoảng, mọi vật nằm trong sân, 3 thẻ khác nhau, số quái / đạn / hiệu ứng không quá mức,
không quá 350 lệnh vẽ.

## Chỉnh được gì (đầu `main.py`, đơn vị là khung hình, 60 khung = 1 giây)

- `HEROES`: tim, tốc độ, sức đánh, mấy khung đánh một lần (`reload`), tầm đánh.
- `MOBS`: máu, tốc độ, cỡ, ngọc rơi ra; `move` là cách đi. Máu trùm ở đây (không nhân theo ải).
- `WAVES`: mỗi ải có đợt nào, mấy con; `gap` nhỏ = quái ra dồn dập; `tough` = máu quái nhân lên.
- `SKILLS`: 3 số là 3 cấp. `COMBOS`: cần mấy skill của nhánh nào. Sức mạnh phối hợp nằm trong `hurt()` và `use_skills()`.
- `SAFE` (bất tử sau khi trúng đòn), `xp_needed()` (lên cấp nhanh hay chậm), hồi 2 tim giữa các ải (trong `update()`).
- `PARTS`: hình tạm. Có ảnh thật thì đổi `draw_hero`, `draw_mob`, `draw_shot`… sang `draw_image`.

Sửa số xong thì chạy lại sim. Bot thắng 25–50% mỗi nhân vật là vừa; bot giỏi hơn một bé mới chơi, nên vẫn phải **chơi thử
thật** rồi mới chốt độ khó.
