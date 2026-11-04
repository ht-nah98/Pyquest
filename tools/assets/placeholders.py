#!/usr/bin/env python3
"""Draws simple pixel-art placeholders so the app runs before the coach's AI images arrive.

Writes content/assets/library/{bird,pipe,background,ground}.png and manifest.json (credit "placeholder").
Real images replace them through tools/assets/clean.py (docs/playbooks/add-asset.md).
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

LIB = Path(__file__).resolve().parents[2] / "content/assets/library"
OUTLINE = (40, 24, 32, 255)


def bird() -> Image.Image:
    sheet = Image.new("RGBA", (96, 24), (0, 0, 0, 0))
    for f, wing_dy in enumerate((-6, 0, 5)):
        d = ImageDraw.Draw(sheet)
        ox = f * 32
        d.ellipse([ox + 6, 6, ox + 26, 20], fill=(214, 52, 52, 255), outline=OUTLINE)          # body
        d.ellipse([ox + 10, 12, ox + 22, 20], fill=(250, 240, 230, 255))                        # belly
        d.polygon([(ox + 6, 12), (ox + 0, 8), (ox + 2, 14), (ox + 0, 19)], fill=(150, 30, 40, 255))  # forked tail
        d.rectangle([ox + 20, 9, ox + 22, 11], fill=OUTLINE)                                     # eye
        d.polygon([(ox + 26, 12), (ox + 31, 13), (ox + 26, 15)], fill=(255, 190, 60, 255))       # beak
        d.polygon([(ox + 12, 12), (ox + 20, 12), (ox + 15, 12 + wing_dy)], fill=(160, 30, 40, 255),
                  outline=OUTLINE)                                                                # wing
    return sheet


def pipe() -> Image.Image:
    img = Image.new("RGBA", (52, 320), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, x in enumerate((4, 19, 34)):
        d.rectangle([x, 8, x + 13, 319], fill=(98, 170, 70, 255), outline=OUTLINE)
        d.line([x + 3, 8, x + 3, 319], fill=(150, 210, 110, 255))
        for y in range(40, 320, 40):
            d.rectangle([x, y + i * 6, x + 13, y + i * 6 + 2], fill=(70, 120, 50, 255))
    for y in (60, 180, 300):
        d.rectangle([2, y, 49, y + 3], fill=(150, 100, 50, 255), outline=OUTLINE)
    d.polygon([(8, 8), (14, 0), (18, 8)], fill=(120, 200, 80, 255), outline=OUTLINE)
    d.polygon([(34, 8), (40, 1), (44, 8)], fill=(120, 200, 80, 255), outline=OUTLINE)
    return img


def background() -> Image.Image:
    img = Image.new("RGBA", (400, 600))
    d = ImageDraw.Draw(img)
    for y in range(600):
        t = y / 600
        d.line([0, y, 399, y], fill=(int(120 + 90 * t), int(190 + 40 * t), 245, 255))
    for cx, cy in ((70, 110), (260, 70), (330, 160)):
        d.ellipse([cx - 30, cy - 10, cx + 30, cy + 10], fill=(255, 255, 255, 255))
        d.ellipse([cx - 14, cy - 20, cx + 16, cy + 6], fill=(255, 255, 255, 255))
    d.polygon([(0, 470), (90, 360), (190, 450), (290, 340), (400, 470), (400, 600), (0, 600)],
              fill=(110, 150, 190, 255))
    for i, y in enumerate(range(450, 540, 18)):
        d.rectangle([0, y, 399, y + 12], fill=(120 + i * 8, 190, 90, 255))
    return img


def ground() -> Image.Image:
    img = Image.new("RGBA", (400, 80), (150, 100, 60, 255))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 399, 12], fill=(90, 180, 70, 255))
    d.line([0, 0, 399, 0], fill=OUTLINE)
    for x in range(0, 400, 20):
        d.rectangle([x + 6, 28 + (x // 20 % 3) * 12, x + 9, 31 + (x // 20 % 3) * 12], fill=(120, 80, 50, 255))
    return img


ASSETS = [
    ("bird", "bird", bird, 32, 24, 3, "Chim én (tạm)"),
    ("pipe", "pipe", pipe, 52, 320, 1, "Cột tre (tạm)"),
    ("background", "background", background, 400, 600, 1, "Ruộng bậc thang (tạm)"),
    ("ground", "ground", ground, 400, 80, 1, "Đất ruộng (tạm)"),
]


def main() -> None:
    LIB.mkdir(parents=True, exist_ok=True)
    manifest_path = LIB / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"assets": []}
    by_id = {a["id"]: a for a in manifest["assets"]}
    for asset_id, group, draw, w, h, frames, label in ASSETS:
        if by_id.get(asset_id, {}).get("credit") == "ai-generated":
            continue  # never overwrite a real image with a placeholder
        draw().save(LIB / f"{asset_id}.png")
        by_id[asset_id] = {"id": asset_id, "group": group, "file": f"{asset_id}.png", "width": w, "height": h,
                           "frames": frames, "credit": "placeholder", "label": label}
    manifest["assets"] = sorted(by_id.values(), key=lambda a: a["id"])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"placeholders → {LIB}")


if __name__ == "__main__":
    main()
