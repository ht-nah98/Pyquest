# Hầm Ngọc — bản chơi thử

Roguelite nhỏ bằng Python, chạy bằng thư viện `pyquest` (sân 600 × 600), vẽ bằng hình trong kho (`content/assets/library`).
Luật chơi và hợp đồng kỹ thuật: `docs/superpowers/specs/2026-11-23-roguelite-design.md`. Chưa có bài học, bé chưa thấy.
**HLV chưa chơi thử.**

| Tệp | Là gì |
|---|---|
| `main.py` | cả game, một tệp. Bảng dữ liệu ở đầu, code đọc bảng ở dưới |
| `sim.py` | bot chơi không cần màn hình, để kiểm luật và đo độ khó (chỉ cần Python) |

Điều khiển: mũi tên / WASD, hoặc chạm (bấm chuột) vào sân để đi tới đó; bấm phím mũi tên thì thôi đi theo chỗ chạm.
Chọn thẻ: phím `1` `2` `3`, hoặc chạm vào thẻ.

## Chạy sim

```bash
cd tools/prototypes/ham-ngoc
python3 -B sim.py                 # bảng cân bằng: tỉ lệ thắng, độ dài, thua ở ải nào, từng skill
python3 -B sim.py --fast          # như trên, nhưng 10 khung mới vẽ 1 (nhanh hơn, kiểm phần vẽ ít hơn)
python3 -B sim.py --seeds 100     # nhiều lượt hơn, số đỡ nhiễu (±8 điểm với 40 lượt một dòng)
python3 -B sim.py --cards --fast  # mỗi thẻ đáng giá bao nhiêu: bot luôn lấy thẻ đó, so với bot lấy thẻ nào cũng được
python3 -B sim.py --edge          # các trường hợp khó: giữ phím, chạm để đi, lên cấp dồn, hết thẻ, hình có đủ trong kho…
python3 -B sim.py --fuzz          # 100 lượt × 3000 khung bấm phím, chuột lung tung: không được lỗi
python3 -B sim.py --png THU_MUC   # vẽ các màn ra ảnh PNG bằng hình thật (cần Pillow)
```

Mỗi khung sim kiểm: tim trong khoảng, mọi vật nằm trong sân, 3 thẻ khác nhau, số quái / đạn / hiệu ứng không quá mức,
không quá 350 lệnh vẽ; hình nào vẽ cũng có trong `manifest.json` và đúng số khung; màu, số, tên tiếng, tên phím hợp lệ;
chữ không tràn ra ngoài sân.

## Chỉnh được gì (đầu `main.py`, đơn vị là khung hình, 60 khung = 1 giây)

- `HEROES`: tim, tốc độ, sức đánh, mấy khung đánh một lần (`reload`), tầm đánh, hình.
- `MOBS`: máu, tốc độ, cỡ chạm, hình và phóng to mấy lần; `move` là cách đi. Máu trùm ở đây (không nhân theo ải).
  `faces`: hình gốc quay mặt về bên nào, đi về bên kia thì game lật hình.
- `WAVES`: mỗi ải có đợt nào, mấy con, màu nền; `gap` nhỏ = quái ra dồn dập; `tough` = máu quái nhân lên.
- `SKILLS`: 3 số là 3 cấp, `icon` là hình. `COMBOS`: cần mấy skill của nhánh nào. Sức mạnh phối hợp nằm trong `hurt()` và
  `use_skills()`. Phối hợp đã mở hiện tên mãi ở thanh dưới.
- Thẻ chung (Tim To, Giày Gió, Nam Châm, Đòn Mạnh) nằm trong `take_card()`.
- `FX`: hiệu ứng nào có mấy khung, rộng bao nhiêu, hàng nào là chân. `DECO`, `SPOTS`: đồ trang trí và mảng nền.
- `SAFE` (bất tử sau khi trúng đòn), `xp_needed()` (lên cấp nhanh hay chậm), hồi 2 tim giữa các ải (trong `update()`).

Nền ba ải để màu trung bình vì Vua Dung Nham, dơi và Pháp sư rất tối: nền tối thì mất hình.

Sửa số xong thì chạy lại sim. Mốc: bot lấy thẻ nào cũng được thắng 30–50%, thua ở ải 1 không quá 10%. Dòng "slow hands" là
bot chậm tay (0,4 giây mới nghĩ một lần), gần với bé mới chơi hơn. Vẫn phải **chơi thử thật** rồi mới chốt độ khó.
