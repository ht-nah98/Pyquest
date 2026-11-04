# Prompt sinh ảnh cho kho hình

AI viết prompt, HLV sinh ảnh bằng công cụ AI của mình, rồi đặt ảnh vào `assets/raw/<nhóm>/`. Sau đó chạy
`npm run assets:clean` để làm sạch: tách nền, cắt, thu về đúng cỡ pixel, ghép khung. Quy trình đầy đủ ở
`docs/playbooks/add-asset.md`.

## Phong cách chung (cả kho phải hợp nhau)

Mọi prompt đều kết thúc bằng **đoạn phong cách** dưới đây. Mục đích là để bé lấy chim của bộ này ghép với nền của bộ kia
mà vẫn hợp nhau.

```
16-bit pixel art game sprite, crisp hard pixel edges, no anti-aliasing, no blur, limited bright palette
(max 16 colors), 1-pixel dark outline, flat shading with one highlight tone, side view, centered,
plain flat magenta background #FF00FF filling the whole image, no text, no letters, no logo, no watermark,
no shadow on the background
```

## Cấm (để game là của mình, không giống game có sẵn)

- Không chim tròn màu vàng có môi dày màu cam, không ống xanh lá có nắp kiểu ống nước.
- Không nhân vật hay logo của game, phim hay hãng nào.
- Không chữ trong ảnh, vì chữ trong game do code vẽ bằng font VT323.

## Ghi chú sau đợt ảnh đầu (04/11/2026)

Đợt đầu ra kiểu **hoạt hình nét mịn, nền trắng** (nền là pixel art). Công cụ xử lý được cả hai: nền trắng hay magenta
đều tách được. Muốn cả kho đồng bộ hơn thì lần sau thêm `pixel art` vào đầu prompt của chim và cột. Chưa có ảnh
**mặt đất** riêng: dải đất đang được cắt tự động từ đáy ảnh nền.

## Mẹo khi sinh ảnh

- Nếu công cụ cho chọn tỉ lệ khung thì chọn đúng tỉ lệ ghi ở từng prompt.
- Sinh 2–4 bản cho mỗi prompt, chọn bản có **nét pixel rõ nhất** và **nền magenta phẳng nhất**.
- Đặt tên tệp đúng như cột "Tên tệp", ví dụ `assets/raw/bird/bird-lua.png`.
- Ảnh có nền ca-rô (giả trong suốt) thì sinh lại; nền ca-rô không tách được.

## Danh sách nhóm (đợt 1)

| Tệp | Nhóm | Số lựa chọn | Dùng ở |
|---|---|---|---|
| `01-bird.md` | Nhân vật bay | 4 | game mẫu, Bài 1, Bài 3 |
| `02-pipes.md` | Chướng ngại (thay cho ống) | 4 | game mẫu, Bài 10 |
| `03-background.md` | Nền | 4 | game mẫu, Bài 14 |
| `04-ground.md` | Mặt đất | 4 (đi cặp với nền) | game mẫu |
| `05-ui.md` | Nút và biểu tượng | 1 bộ | màn bắt đầu / thua |

Ưu tiên cho Chủ nhật: **bộ 1 của mỗi nhóm** (`bird-lua`, `pillar-tre`, `bg-ruong-bac-thang`, `ground-ruong`). Các bộ còn lại
dùng ở Bài 3 (bé chọn nhân vật), nên chưa gấp.
