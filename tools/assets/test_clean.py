"""Tests for clean.py. Run: python3 -m unittest discover -s tools/assets"""
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import clean


def magenta_sheet(path: Path, frames: int = 3, cell: int = 40) -> None:
    img = Image.new("RGB", (cell * frames, cell), (255, 0, 255))
    for f in range(frames):
        for x in range(f * cell + 10, f * cell + 26):
            for y in range(12, 28):
                img.putpixel((x, y), (200, 40, 40))
    img.save(path)


class CleanTest(unittest.TestCase):
    def test_sheet_becomes_transparent_frames_of_target_size(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "bird-lua.png"
            magenta_sheet(src)
            out = clean.clean(src, Path(d) / "out.png", frames=3, width=32, height=24)
            img = Image.open(out)
            self.assertEqual(img.mode, "RGBA")
            self.assertEqual(img.size, (96, 24))
            self.assertEqual(img.getpixel((0, 0))[3], 0)  # background gone
            self.assertGreater(img.getpixel((16, 12))[3], 0)  # bird kept

    def test_soft_magenta_edges_are_removed(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "x.png"
            img = Image.new("RGB", (40, 40), (250, 10, 245))  # not exactly #FF00FF
            img.putpixel((20, 20), (10, 10, 10))
            img.save(src)
            out = Image.open(clean.clean(src, Path(d) / "o.png", frames=1, width=8, height=8))
            opaque = [out.getpixel((x, y)) for x in range(8) for y in range(8) if out.getpixel((x, y))[3] > 0]
            self.assertTrue(opaque)
            self.assertTrue(all(p[0] < 50 and p[2] < 50 for p in opaque))  # no magenta fringe survives


if __name__ == "__main__":
    unittest.main()
