"""Arena art for Hầm Ngọc: seamless grounds and pools drawn here by code, scenery copied from the pixel atlas.

usage: python3 tools/assets/arena.py [ATLAS_DIR]
Without ATLAS_DIR only the drawn pictures are made (same seed, same pixels). Sources go to assets/pixel-sources.json.
A coach-made picture replaces one of these by taking its id (assets/prompts/06-arena.md).
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / "content/assets/library"
SOURCES = ROOT / "assets/pixel-sources.json"
GROUND = 160            # art pixels; the game draws it 3 times larger

# Scenery: our id -> row in the atlas (Angais/pixel-art-atlas-1.4m, CC0).
SCENERY: dict[str, int] = json.loads((Path(__file__).parent / "arena-scenery.json").read_text())


def rgb(color: str) -> tuple[int, int, int, int]:
    return int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16), 255


def noise(rng: random.Random, size: int, cell: int) -> list[list[float]]:
    """Smooth noise that wraps around, so the picture has no seam."""
    n = size // cell
    grid = [[rng.random() for _ in range(n)] for _ in range(n)]
    ease = [t * t * (3 - 2 * t) for t in (i / cell for i in range(cell))]
    out = []
    for y in range(size):
        a, b, ty = grid[y // cell], grid[(y // cell + 1) % n], ease[y % cell]
        row = []
        for x in range(size):
            c, d, tx = x // cell, (x // cell + 1) % n, ease[x % cell]
            top, low = a[c] + (a[d] - a[c]) * tx, b[c] + (b[d] - b[c]) * tx
            row.append(top + (low - top) * ty)
        out.append(row)
    return out


def ground(seed: int, shades: list[str], bits: list[tuple[int, list[str]]]) -> Image.Image:
    """Patches of a few close shades, then small drawings ("bits") scattered over them.

    A bit is rows of letters: "." is nothing, a letter picks one of BIT_COLORS.
    """
    rng = random.Random(seed)
    coarse, fine = noise(rng, GROUND, 32), noise(rng, GROUND, 8)
    img = Image.new("RGBA", (GROUND, GROUND))
    px = img.load()
    for y in range(GROUND):
        for x in range(GROUND):
            v = coarse[y][x] * 0.7 + fine[y][x] * 0.3
            # A checkered edge between two shades, as pixel artists do.
            v += 0.018 if (x + y) % 2 else -0.018
            # v gathers around 0.5: stretch it so that every shade is used.
            i = int(min(0.999, max(0, (v - 0.26) / 0.48)) * len(shades))
            px[x, y] = rgb(shades[i])
    for count, rows in bits:
        for _ in range(count):
            bx, by = rng.randrange(GROUND), rng.randrange(GROUND)
            flip = rng.random() < 0.5
            for dy, line in enumerate(rows):
                for dx, letter in enumerate(line[::-1] if flip else line):
                    if letter != ".":
                        px[(bx + dx) % GROUND, (by + dy) % GROUND] = rgb(BIT_COLORS[letter])
    return img


BIT_COLORS = {
    "g": "#4f8a4a", "G": "#8cc06a", "y": "#f2d75c", "w": "#eef4e6", "p": "#e58fb8", "o": "#d9803c",
    "d": "#3c5f41", "s": "#8d958c", "S": "#b7bdb2", "k": "#59605c",
    "t": "#2f5560", "T": "#63a3a0", "c": "#86e0d8", "l": "#54503f", "L": "#7a7256", "m": "#b9a6d8",
    "r": "#4c3a36", "R": "#806458", "e": "#ff9a4a", "E": "#c65a2c", "b": "#352927",
}

GRASS = ["g.g", "gGg", ".G."]
TUFT = ["G...G", ".G.G.", ".GgG.", "..g.."]
FLOWER = [".y.", "ywy", ".y.", ".g."]
PINK = [".p.", "pyp", ".p.", ".g."]
PEBBLE = [".SS.", "SsSs", ".kk."]
LEAF = ["lL", "Ll"]
MOSS = [".T.T.", "TtTtT", ".tTt."]
SPORE = ["c"]
TWIG = ["l....", ".ll.L", "...l."]
CRACK = ["b.....", ".b..b.", "..bb..", "....b.", ".....b"]
EMBER = ["E"]
EMBER2 = [".E.", "EeE", ".E."]
RUBBLE = [".RR..", "RrRr.", ".bbRb"]
LILAC = [".m.", "mTm", ".t."]


def blob(seed: int, w: int, h: int, rings: list[str], wobble: float, spark: str, shift: int) -> Image.Image:
    """A pool seen from above: rings of colour from the rim inwards, glints that move with "shift"."""
    rng = random.Random(seed)
    bumps = [rng.uniform(-wobble, wobble) for _ in range(12)]
    img = Image.new("RGBA", (w, h))
    px = img.load()
    from math import atan2, pi

    for y in range(h):
        for x in range(w):
            dx, dy = (x + 0.5 - w / 2) / (w / 2), (y + 0.5 - h / 2) / (h / 2)
            turn = (atan2(dy, dx) / (2 * pi) % 1) * 12
            i = int(turn) % 12
            edge = bumps[i] + (bumps[(i + 1) % 12] - bumps[i]) * (turn % 1)
            far = (dx * dx + dy * dy) ** 0.5 / (0.9 + edge)
            if far >= 1:
                continue
            ring = min(len(rings) - 1, int((1 - far) * 5.5))
            px[x, y] = rgb(rings[ring])
    for _ in range(w * h // 110):
        x, y = rng.randrange(w), rng.randrange(h)
        if px[x, y][3] and px[x, y] == rgb(rings[-1]):
            for k in range(rng.randint(2, 5)):
                at = (x + k + shift) % w
                if px[at, y] == rgb(rings[-1]):
                    px[at, y] = rgb(spark)
    return img


def pool(seed: int, rings: list[str], spark: str) -> Image.Image:
    """Two frames side by side."""
    strip = Image.new("RGBA", (128, 44))
    for k in (0, 1):
        strip.paste(blob(seed, 64, 44, rings, 0.09, spark, k * 3), (k * 64, 0))
    return strip


def glow(color: str, strength: int, w: int = 64, h: int = 64) -> Image.Image:
    """A soft round light (drawn smoothed, not as pixel art)."""
    img = Image.new("RGBA", (w, h))
    px = img.load()
    r, g, b, _ = rgb(color)
    for y in range(h):
        for x in range(w):
            far = (((x + 0.5) / w * 2 - 1) ** 2 + ((y + 0.5) / h * 2 - 1) ** 2) ** 0.5
            px[x, y] = r, g, b, int(max(0, 1 - far) ** 1.4 * strength)
    return img


def vignette(color: str, strength: int, w: int = 96, h: int = 54) -> Image.Image:
    """Dark edges around a clear middle, stretched over the whole screen."""
    img = Image.new("RGBA", (w, h))
    px = img.load()
    r, g, b, _ = rgb(color)
    for y in range(h):
        for x in range(w):
            far = (((x + 0.5) / w * 2 - 1) ** 2 + ((y + 0.5) / h * 2 - 1) ** 2) ** 0.5
            px[x, y] = r, g, b, int(min(1, max(0, far - 0.55) / 0.85) ** 1.2 * strength)
    return img


# Soft light and shade: saved in full colour and drawn smoothed.
SOFT = {
    "deco-glow-warm": glow("#ffb35a", 120),
    "deco-glow-cool": glow("#8fdcff", 110),
    "deco-glow-mist": glow("#dff5f0", 70, 64, 32),
    "deco-dark-cave": vignette("#120806", 190),
    "deco-dark-forest": vignette("#06181c", 130),
}


def drawn() -> dict[str, tuple[Image.Image, int]]:
    """id -> (picture, frames)"""
    return {
        "deco-ground-meadow": (ground(11, ["#5d8f55", "#659a5a", "#6ea360", "#78ab66"], [
            (80, GRASS), (45, TUFT), (10, FLOWER), (8, PINK), (9, PEBBLE)]), 1),
        "deco-ground-forest": (ground(23, ["#42645f", "#496d66", "#51766c", "#5a7f72"], [
            (40, MOSS), (40, LEAF), (25, TWIG), (14, LILAC), (36, SPORE), (6, PEBBLE)]), 1),
        "deco-ground-cave": (ground(37, ["#6a564d", "#725d53", "#7b655a", "#846d61"], [
            (34, CRACK), (28, RUBBLE), (26, EMBER), (8, EMBER2), (10, PEBBLE)]), 1),
        "deco-pond": (pool(5, ["#9c8f63", "#4a86a8", "#5fa8c9", "#6cb9d8"], "#c9eef5"), 2),
        "deco-swamp": (pool(8, ["#3a4a3a", "#3f5f46", "#4d7050", "#587d58"], "#9fd07a"), 2),
        "deco-lava": (pool(13, ["#2f2322", "#8a2f1c", "#e0612a", "#ff9436"], "#ffe08a"), 2),
        "deco-dirt": (blob(3, 64, 44, ["#7d8a55", "#8f8a5c", "#9c9064"], 0.16, "#b3a578", 0), 1),
        "deco-mist-moss": (blob(6, 64, 44, ["#477068", "#4d7d70", "#558a79"], 0.16, "#86c9b0", 0), 1),
        "deco-ash": (blob(9, 64, 44, ["#5d4b45", "#52423e", "#483a38"], 0.16, "#75605a", 0), 1),
    }


def scenery(atlas: Path) -> tuple[dict[str, Image.Image], list[dict]]:
    import numpy as np

    tokens = np.load(atlas / "tokens.npy", mmap_mode="r", allow_pickle=False)
    palette = np.load(atlas / "palette.npy", allow_pickle=False)
    captions = json.loads((atlas / "captions.json").read_text())
    pictures, sources = {}, []
    for asset_id, row in SCENERY.items():
        k = np.array(tokens[row]).reshape(16, 16)
        pictures[asset_id] = Image.fromarray(np.dstack((palette[k], (k != 0).astype("uint8") * 255)).astype("uint8"))
        sources.append({"id": asset_id, "from": "Angais/pixel-art-atlas-1.4m", "row": row, "caption": captions[row]})
    return pictures, sources


def main(atlas: Path | None) -> None:
    pictures = drawn() | {i: (p, 1) for i, p in SOFT.items()}
    sources = [{"id": i, "from": "tools/assets/arena.py"} for i in pictures]
    if atlas is not None:
        found, more = scenery(atlas)
        pictures.update({i: (p, 1) for i, p in found.items()})
        sources += more
    path = LIB / "manifest.json"
    by_id = {a["id"]: a for a in json.loads(path.read_text())["assets"]}
    for asset_id, (img, frames) in pictures.items():
        soft = asset_id in SOFT
        (img if soft else img.quantize(64, dither=Image.Dither.NONE)).save(LIB / f"{asset_id}.png", optimize=True)
        by_id[asset_id] = {"id": asset_id, "group": "deco", "file": f"{asset_id}.png", "width": img.width // frames,
                           "height": img.height, "frames": frames, **({} if soft else {"pixel": True}),
                           "credit": "ai-generated"}
    path.write_text(json.dumps({"assets": sorted(by_id.values(), key=lambda a: a["id"])}, ensure_ascii=False, indent=2) + "\n")
    known = {s["id"]: s for s in json.loads(SOURCES.read_text())}
    known.update({s["id"]: s for s in sources})
    SOURCES.write_text(json.dumps(list(known.values()), ensure_ascii=False, indent=2) + "\n")
    print(f"{len(pictures)} arena pictures")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else None)
