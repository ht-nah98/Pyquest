"""Tests for clean.py. Run: npm run assets:test"""
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

import clean

S = clean.SCALE


def bird_sheet(path: Path, bg=(255, 255, 255)) -> None:
    """3 frames, each a dark-outlined red body with a white belly enclosed by the outline."""
    img = Image.new("RGB", (300, 100), bg)
    d = ImageDraw.Draw(img)
    for f in range(3):
        ox = f * 100
        d.ellipse([ox + 20, 20 + f * 5, ox + 80, 70 + f * 5], fill=(220, 40, 40), outline=(60, 10, 10), width=3)
        d.ellipse([ox + 40, 40 + f * 5, ox + 60, 60 + f * 5], fill=(255, 255, 255))
    img.save(path)


def pillar(path: Path) -> None:
    img = Image.new("RGB", (300, 1200), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.ellipse([60, 0, 240, 120], fill=(40, 160, 60), outline=(10, 40, 10), width=3)  # wide crown
    d.rectangle([110, 80, 190, 1190], fill=(120, 80, 40), outline=(40, 20, 10), width=3)  # 80 px trunk
    img.save(path)


class CleanTest(unittest.TestCase):
    def test_white_background_goes_but_an_enclosed_white_belly_stays(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "bird.png"
            bird_sheet(src)
            out = Image.open(clean.clean_bird(src, Path(d) / "o.png")).convert("RGBA")
            w, h = clean.BIRD
            self.assertEqual(out.size, (3 * w * S, h * S))
            self.assertEqual(out.getpixel((0, 0))[3], 0)
            # the centre of frame 0 is the white belly: still opaque white
            r, g, b, a = out.getpixel((w * S // 2, h * S // 2))
            self.assertGreater(a, 200)
            self.assertGreater(min(r, g, b), 200)

    def test_magenta_background_is_removed_too(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "bird.png"
            bird_sheet(src, bg=(255, 0, 255))
            out = Image.open(clean.clean_bird(src, Path(d) / "o.png")).convert("RGBA")
            self.assertEqual(out.getpixel((0, 0))[3], 0)

    def test_pillar_trunk_is_52_wide_centred_and_the_size_is_fixed(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "p.png"
            pillar(src)
            out = Image.open(clean.clean_pillar(src, Path(d) / "o.png")).convert("RGBA")
            w, h = clean.PILLAR
            self.assertEqual(out.size, (w * S, h * S))
            row = h * S - 4  # near the bottom: trunk only
            opaque = [x for x in range(out.width) if out.getpixel((x, row))[3] > 128]
            self.assertAlmostEqual(len(opaque), clean.TRUNK * S, delta=3 * S)
            self.assertAlmostEqual((opaque[0] + opaque[-1]) / 2, out.width / 2, delta=2 * S)
            self.assertGreater(out.getpixel((out.width // 2, 2))[3], 0)  # crown at the top

    def test_background_covers_the_stage_and_ground_tiles_seamlessly(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "bg.png"
            img = Image.new("RGB", (470, 836))
            for y in range(836):
                for x in range(470):
                    img.putpixel((x, y), (x % 256, y % 256, 100))
            img.save(src)
            bg, ground = clean.clean_background(src, Path(d) / "bg-o.png", Path(d) / "g-o.png")
            self.assertEqual(Image.open(bg).size, (400 * S, 600 * S))
            g = Image.open(ground).convert("RGB")
            self.assertEqual(g.size, (800 * S, 80 * S))
            for y in (0, 40 * S, 80 * S - 1):
                self.assertEqual(g.getpixel((0, y)), g.getpixel((g.width - 1, y)))  # wraps
                self.assertEqual(g.getpixel((400 * S - 1, y)), g.getpixel((400 * S, y)))  # mirror seam


if __name__ == "__main__":
    unittest.main()
