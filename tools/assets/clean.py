#!/usr/bin/env python3
"""Clean the coach's AI-generated pictures for the asset library (docs/playbooks/add-asset.md).

- Background removal: flat magenta anywhere, and white flood-filled in from the border (so a white
  belly inside a dark outline stays).
- Pictures are stored at SCALE × their game size and drawn smoothly, so they stay sharp on big screens.
- bird: 3 frames side by side, one shared crop box, each frame fitted into BIRD.
- pipe: the trunk is scaled to TRUNK wide and centred in PILLAR; a crown may overhang the trunk.
- background: covers 400×600 (bottom kept); its bottom 80 rows + their mirror make a seamless ground.

Usage:
  npm run assets:clean -- --all                      # every picture listed in assets/raw/library.json
  npm run assets:clean -- assets/raw/bird/bird-lua.png --id bird --group bird --label "Én Lửa"
Then: npm run content:check.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / "content/assets/library"
RAW_LIST = ROOT / "assets/raw/library.json"

SCALE = 2
BIRD = (44, 40)      # one frame, game units
PILLAR = (76, 440)   # whole picture, game units
TRUNK = 52           # trunk width = the pipe's hit box (sample game PIPE_W)
STAGE = (400, 600)
GROUND_H = 80
SENTINEL = (1, 2, 3)


def remove_background(src: Path) -> Image.Image:
    rgb = Image.open(src).convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    # Flat magenta (the prompt's background) goes wherever it is.
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 150 and b > 150 and g < 110 and abs(r - b) < 90:
                px[x, y] = SENTINEL
    # Near-white connected to the border goes; white enclosed by an outline stays.
    seeds = [(x, y) for x in range(0, w, 4) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 4) for x in (0, w - 1)]
    for x, y in seeds:
        if min(px[x, y]) > 225:
            ImageDraw.floodfill(rgb, (x, y), SENTINEL, thresh=40)
    rgba = rgb.convert("RGBA")
    rgba.putdata([(0, 0, 0, 0) if p[:3] == SENTINEL else p for p in (rgba.get_flattened_data() if hasattr(rgba, "get_flattened_data") else rgba.getdata())])
    return rgba


def _save(img: Image.Image, out: Path) -> Path:
    """256-colour palette PNG: a 1 MB background becomes a few hundred KB (AGENTS.md §9.6)."""
    out.parent.mkdir(parents=True, exist_ok=True)
    img.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(out, optimize=True)
    return out


def clean_bird(src: Path, out: Path, frames: int = 3) -> Path:
    img = remove_background(src)
    cw = img.width // frames
    cells = [img.crop((f * cw, 0, (f + 1) * cw, img.height)) for f in range(frames)]
    boxes = [c.getbbox() for c in cells if c.getbbox() is not None]
    if not boxes:
        raise SystemExit(f"{src}: nothing left after removing the background")
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    fw, fh = BIRD[0] * SCALE, BIRD[1] * SCALE
    sheet = Image.new("RGBA", (fw * frames, fh), (0, 0, 0, 0))
    for f, cell in enumerate(cells):
        part = cell.crop(box)
        k = min(fw / part.width, fh / part.height)
        size = (max(1, round(part.width * k)), max(1, round(part.height * k)))
        part = part.resize(size, Image.LANCZOS)
        sheet.alpha_composite(part, (f * fw + (fw - size[0]) // 2, (fh - size[1]) // 2))
    return _save(sheet, out)


def clean_pillar(src: Path, out: Path) -> Path:
    img = remove_background(src)
    box = img.getbbox()
    if box is None:
        raise SystemExit(f"{src}: nothing left after removing the background")
    img = img.crop(box)
    alpha = img.getchannel("A").point(lambda a: 255 if a > 128 else 0)
    lower = alpha.crop((0, int(img.height * 0.6), img.width, img.height)).getbbox()
    if lower is None:
        raise SystemExit(f"{src}: no trunk found")
    k = TRUNK * SCALE / (lower[2] - lower[0])
    scaled = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    W, H = PILLAR[0] * SCALE, PILLAR[1] * SCALE
    dx = round(W / 2 - (lower[0] + lower[2]) / 2 * k)  # trunk centre → picture centre
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(scaled, (dx, 0), scaled)  # paste clips; a crown wider than W is trimmed
    # Too short: repeat a band of the trunk downwards (the pillars were drawn to tile vertically).
    band = scaled.crop((0, int(scaled.height * 0.5), scaled.width, int(scaled.height * 0.9)))
    y = scaled.height
    while y < H and band.height > 0:
        canvas.paste(band, (dx, y), band)
        y += band.height
    return _save(canvas, out)


def clean_background(src: Path, out: Path, ground_out: Path) -> tuple[Path, Path]:
    img = Image.open(src).convert("RGB")
    W, H = STAGE[0] * SCALE, STAGE[1] * SCALE
    k = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
    left = (img.width - W) // 2
    bg = img.crop((left, img.height - H, left + W, img.height))  # keep the bottom (land), trim sky
    strip = bg.crop((0, H - GROUND_H * SCALE, W, H))
    ground = Image.new("RGB", (W * 2, GROUND_H * SCALE))
    ground.paste(strip, (0, 0))
    ground.paste(strip.transpose(Image.FLIP_LEFT_RIGHT), (W, 0))  # mirror: seamless when scrolled
    return _save(bg, out), _save(ground, ground_out)


def register(entries: list[dict]) -> None:
    path = LIB / "manifest.json"
    manifest = json.loads(path.read_text()) if path.exists() else {"assets": []}
    by_id = {a["id"]: a for a in manifest["assets"]}
    for e in entries:
        by_id[e["id"]] = e
    manifest["assets"] = sorted(by_id.values(), key=lambda a: a["id"])
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


def _entry(asset_id: str, group: str, w: int, h: int, frames: int, label: str | None) -> dict:
    e = {"id": asset_id, "group": group, "file": f"{asset_id}.png", "width": w, "height": h, "frames": frames,
         "credit": "ai-generated"}
    if label:
        e["label"] = label
    return e


def process(src: Path, asset_id: str, group: str, label: str | None) -> list[dict]:
    if group == "bird":
        clean_bird(src, LIB / f"{asset_id}.png")
        return [_entry(asset_id, group, *BIRD, 3, label)]
    if group == "pipe":
        clean_pillar(src, LIB / f"{asset_id}.png")
        return [_entry(asset_id, group, *PILLAR, 1, label)]
    if group == "background":
        ground_id = asset_id.replace("background", "ground", 1) if asset_id.startswith("background") \
            else f"{asset_id}-ground"
        clean_background(src, LIB / f"{asset_id}.png", LIB / f"{ground_id}.png")
        return [_entry(asset_id, group, *STAGE, 1, label),
                _entry(ground_id, "ground", STAGE[0] * 2, GROUND_H, 1, label)]
    raise SystemExit(f"group {group} is not supported yet")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path, nargs="?")
    ap.add_argument("--all", action="store_true", help="clean everything in assets/raw/library.json")
    ap.add_argument("--id")
    ap.add_argument("--group", choices=["bird", "pipe", "background"])
    ap.add_argument("--label")
    args = ap.parse_args()
    if args.all:
        jobs = [(ROOT / j["src"], j["id"], j["group"], j.get("label")) for j in json.loads(RAW_LIST.read_text())]
    elif args.src and args.id and args.group:
        jobs = [(args.src, args.id, args.group, args.label)]
    else:
        ap.error("give --all, or a picture with --id and --group")
    entries = []
    for src, asset_id, group, label in jobs:
        entries += process(src, asset_id, group, label)
        print(f"{src.name} → {asset_id} ({group})")
    register(entries)


if __name__ == "__main__":
    main()
