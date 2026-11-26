# 07 · Ảnh nền cho 🎨 Xưởng vẽ

**Cỡ đích:** 600 × 600 px (sân vẽ **vuông**). Công cụ giữ **phần giữa** ảnh rồi thu về cỡ này.
**Tỉ lệ khi sinh:** 1:1 (vuông).
**Đặt ảnh vào:** `assets/raw/bg/<tên tệp>`, rồi khai báo trong `assets/raw/library.json` với `"group": "bg"`.

Bé sẽ **vẽ đè lên** ảnh nền bằng code (nhà, người, cây) và đặt thêm hình pixel nhỏ. Vì vậy:

- **Không có nhân vật, con vật, nhà ở giữa ảnh.** Cảnh trống, để bé tự vẽ thêm.
- **Nửa dưới đơn giản, phẳng** (cỏ, cát, đường) để hình bé vẽ nổi rõ.
- Không chữ, không logo.

Nền **không** dùng nền magenta. Thay đoạn "plain flat magenta background…" trong đoạn phong cách chung
(`README.md`) bằng: `full scene filling the whole square image, empty open foreground with flat simple ground`.

| Tệp | Tên cho bé (`label`) |
|---|---|
| `bg-bau-troi.png` | Bầu trời mây |
| `bg-lang-que.png` | Làng quê |
| `bg-bai-bien.png` | Bãi biển |
| `bg-pho-co.png` | Phố cổ |
| `bg-dem-sao.png` | Đêm đầy sao |
| `bg-vuon-hoa.png` | Vườn hoa |

## 1 · `bg-bau-troi.png` — Bầu trời mây

```
Square pixel art landscape background, wide bright blue sky with a few big fluffy white pixel clouds,
a thin strip of soft green grass along the bottom, nothing else, lots of empty sky for drawing on
```

## 2 · `bg-lang-que.png` — Làng quê

```
Square pixel art landscape background, Vietnamese countryside, light morning sky, distant green hills
and a line of bamboo far away on the horizon, flat green rice field in the lower half, a small dirt
path, no people, no animals, no houses in the foreground
```

## 3 · `bg-bai-bien.png` — Bãi biển

```
Square pixel art landscape background, sunny beach, clear sky, calm turquoise sea in the middle band,
flat pale yellow sand in the lower half, a few tiny far-away islands on the horizon, no people
```

## 4 · `bg-pho-co.png` — Phố cổ

```
Square pixel art background, old Vietnamese town street at warm sunset, a row of yellow houses with
tiled roofs far in the back, colorful paper lanterns hanging high, flat empty stone street in the
lower half, no people
```

## 5 · `bg-dem-sao.png` — Đêm đầy sao

```
Square pixel art landscape background, deep blue night sky full of small twinkling pixel stars and a
big round moon in one upper corner, dark flat hills along the bottom, calm and peaceful
```

## 6 · `bg-vuon-hoa.png` — Vườn hoa

```
Square pixel art garden background, soft blue sky, a low wooden fence far in the back, small colorful
flowers only along the very bottom edge, flat light green lawn in the lower half, no people, no animals
```

Sau khi sinh: `npm run assets:clean -- --all`, rồi thêm nhóm `🖼️ Ảnh nền` vào `pictureGroups` của
`content/studio/studio.json` (bấm ➕ là ảnh nền tự nằm ngay sau `clear(...)`).
