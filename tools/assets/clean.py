#!/usr/bin/env python3
"""Clean one AI-generated picture for the asset library (docs/playbooks/add-asset.md).

Removes the flat magenta background (#FF00FF and its soft fringe), crops every frame with one shared
bounding box (frames keep their relative position), scales to the target pixel size with
nearest-neighbour, and writes a horizontal strip of frames.

Usage:
  python3 tools/assets/clean.py assets/raw/bird/bird-lua.png --id bird --group bird
  python3 tools/assets/clean.py assets/raw/background/bg-ruong-bac-thang.png --id background --group background
Defaults per group: bird 3×32×24, pipe 1×52×320, background 1×400×600 (kept opaque), ground 1×400×80, ui 1×32×32.
Then: npm run content:check.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

LIB = Path(__file__).resolve().parents[2] / "content/assets/library"
GROUPS = {
    "bird": (3, 32, 24, True),
    "pipe": (1, 52, 320, True),
    "background": (1, 400, 600, False),
    "ground": (1, 400, 80, True),
    "ui": (1, 32, 32, True),
}


def _is_magenta(r: int, g: int, b: int) -> bool:
    return r > 150 and b > 150 and g < 110 and abs(r - b) < 90


def clean(src: Path, out: Path, frames: int, width: int, height: int, remove_bg: bool = True) -> Path:
    img = Image.open(src).convert("RGBA")
    if remove_bg:
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, a = px[x, y]
                if a == 0 or _is_magenta(r, g, b):
                    px[x, y] = (0, 0, 0, 0)
    if not remove_bg:
        result = img.resize((width * frames, height), Image.NEAREST)
        out.parent.mkdir(parents=True, exist_ok=True)
        result.save(out)
        return out

    cell_w = img.width // frames
    cells = [img.crop((f * cell_w, 0, (f + 1) * cell_w, img.height)) for f in range(frames)]
    boxes = [c.getbbox() for c in cells if c.getbbox() is not None]
    if not boxes:
        raise SystemExit(f"{src}: nothing left after removing the background")
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))

    sheet = Image.new("RGBA", (width * frames, height), (0, 0, 0, 0))
    for f, cell in enumerate(cells):
        part = cell.crop(box)
        scale = min(width / part.width, height / part.height)
        size = (max(1, round(part.width * scale)), max(1, round(part.height * scale)))
        part = part.resize(size, Image.NEAREST)
        sheet.alpha_composite(part, (f * width + (width - size[0]) // 2, (height - size[1]) // 2))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path)
    ap.add_argument("--id", required=True, help="asset id the code uses, e.g. bird, pipe, background")
    ap.add_argument("--group", required=True, choices=sorted(GROUPS))
    ap.add_argument("--label", default=None, help="Vietnamese name shown to children")
    args = ap.parse_args()
    frames, w, h, remove_bg = GROUPS[args.group]
    out = clean(args.src, LIB / f"{args.id}.png", frames, w, h, remove_bg)

    manifest_path = LIB / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"assets": []}
    entry = {"id": args.id, "group": args.group, "file": out.name, "width": w, "height": h, "frames": frames,
             "credit": "ai-generated"}
    if args.label:
        entry["label"] = args.label
    manifest["assets"] = sorted([a for a in manifest["assets"] if a["id"] != args.id] + [entry],
                                key=lambda a: a["id"])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"{args.src} → {out} ({frames}×{w}×{h})")


if __name__ == "__main__":
    main()
