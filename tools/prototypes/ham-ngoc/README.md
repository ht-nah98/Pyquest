# Hầm Ngọc — bản chơi thử

Roguelite nhỏ bằng Python, chạy bằng thư viện `pyquest` (khung nhìn 1600 × 900, sân rộng gấp 2,5–3 lần màn hình, có hàng rào, vách đá, cụm cây chắn đường), vẽ bằng hình trong kho (`content/assets/library`).
Luật chơi và hợp đồng kỹ thuật: `docs/superpowers/specs/2026-11-23-roguelite-design.md`. Chưa có bài học, bé chưa thấy.
**HLV chưa chơi thử.**

| Tệp | Là gì |
|---|---|
| `main.py` | cả game, một tệp. Bảng dữ liệu ở đầu, code đọc bảng ở dưới |
| `sim.py` | bot chơi không cần màn hình, để kiểm luật và đo độ khó (chỉ cần Python) |

Điều khiển: mũi tên / WASD, hoặc bấm / giữ chuột (giữ tay) trên sân để đi tới đó; bấm phím mũi tên thì thôi đi theo chỗ chạm.
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

Mỗi khung sim kiểm: máu trong khoảng, mọi vật nằm trong sân, 3 thẻ khác nhau, số quái / đạn / hiệu ứng không quá mức,
không quá 520 lệnh vẽ; hình nào vẽ cũng có trong `manifest.json` và đúng số khung; màu, số, tên tiếng, tên phím hợp lệ;
chữ không tràn ra ngoài sân.

## Chỉnh được gì (đầu `main.py`, đơn vị là khung hình, 60 khung = 1 giây)

- `HEROES`: máu, tốc độ, sức đánh, mấy khung đánh một lần (`reload`), tầm đánh, hình.
- `MOBS`: máu, tốc độ, cỡ chạm, hình và phóng to mấy lần; `move` là cách đi. Máu trùm ở đây (không nhân theo ải).
  `faces`: hình gốc quay mặt về bên nào, đi về bên kia thì game lật hình.
- `FLOORS`: mỗi ải một sân (rộng, nền, cây đá, vũng, không khí), lịch quái ra theo giây, bầy, quái to, trùm ra lúc nào;
  `tough`, `pace` = máu và tốc độ quái nhân lên; `gems` = ngọc ải này đáng gấp mấy lần.
  `walls` = vật cản dài (hàng rào, vách đá, có khi gấp chữ L), `clumps` = cụm cây / đá chen nhau. Khe giữa hai món hẹp
  hơn em nên phải đi vòng; giữa sân luôn để trống.
- `SKILLS`: 3 số là 3 cấp, `icon` là hình. `COMBOS`: cần mấy skill của nhánh nào. Sức mạnh phối hợp nằm trong `hurt()` và
  `use_skills()`. Phối hợp đã mở hiện tên mãi ở thanh dưới.
- Thẻ chung (Tim To, Giày Gió, Nam Châm, Đòn Mạnh) nằm trong `take_card()`.
- `FX`: hiệu ứng nào có mấy khung, rộng bao nhiêu, hàng nào là chân. `GLOWS`: đồ phát sáng.
- Kinh nghiệm: `XP_FIRST`, `XP_STEP`, `XP_LATE` (lên cấp nhanh hay chậm, từ cấp 10 chậm dần), `GEM_TIERS` (ngọc 3 bậc
  màu theo giá trị). Ngọc bay về nhanh dần; thanh kinh nghiệm ở mép trên ghi rõ còn thiếu bao nhiêu.
- `SAFE` (bất tử sau khi trúng đòn), `SHOT_SPEED`, hồi 50 máu giữa các ải (trong `update()`).
- `U`: chữ và khung trên màn hình phóng theo màn (1600 × 900 thì U = 1,67). Sân và quái thì không phóng: màn rộng là nhìn
  được nhiều sân hơn, như máy quay đặt cao hơn.

Nền ba ải để màu trung bình vì Vua Dung Nham, dơi và Pháp sư rất tối: nền tối thì mất hình.

Sửa số xong thì chạy lại sim. Mốc (24/11, HLV bảo chậm và dễ chịu hơn): bot lấy thẻ nào cũng được thắng 70–95%, đứng im thì thua trong cỡ 70 giây. Dòng "slow hands" là
bot chậm tay (0,4 giây mới nghĩ một lần), gần với bé mới chơi hơn. Vẫn phải **chơi thử thật** rồi mới chốt độ khó.
