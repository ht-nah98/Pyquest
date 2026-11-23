"""Puts the coach-picked 16x16 pixel sprites and pixelfx strips into the library (docs/playbooks/add-asset.md).

usage: python3 tools/assets/pixel.py PICKS_DIR FX_DIR
Files are copied byte for byte (native pixels, never resampled); sources go to assets/pixel-sources.json.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / "content/assets/library"
SOURCES = ROOT / "assets/pixel-sources.json"
# Floors are drawn by code (the dataset has no seamless tiles); these two effects use option 2.
SKIP = {"tile-floor", "tile-wall"}
FX_OPTION = {"fx-fire": 2, "fx-explosion": 2}
GROUPS = {"hero": "hero", "mob": "mob", "boss": "mob", "item": "item", "shot": "shot", "skill": "skill",
          "deco": "deco", "fx": "fx"}


def entry(asset_id: str, w: int, h: int, frames: int, credit: str) -> dict:
    return {"id": asset_id, "group": GROUPS[asset_id.split("-")[0]], "file": f"{asset_id}.png", "width": w,
            "height": h, "frames": frames, "pixel": True, "credit": credit}


def main(picks: Path, fx: Path) -> None:
    entries, sources = [], []
    for p in json.loads((picks / "picks.json").read_text()):
        if p["k"] != 1 or p["asset"] in SKIP:
            continue
        shutil.copyfile(picks / p["file"], LIB / f"{p['asset']}.png")
        entries.append(entry(p["asset"], 16, 16, 1, "ai-generated"))
        sources.append({"id": p["asset"], "from": "Angais/pixel-art-atlas-1.4m", "row": p["row"], "caption": p["caption"]})
    for f in json.loads((fx / "fx.json").read_text()):
        if f["k"] != FX_OPTION.get(f["id"], 1):
            continue
        shutil.copyfile(fx / f["file"], LIB / f"{f['id']}.png")
        entries.append(entry(f["id"], f["frameWidth"], f["frameHeight"], f["frames"], "pixelfx-mit"))
        sources.append({"id": f["id"], "from": "pixelfx", "effect": f["source"], "adapted": f["adaptedFrom"]})
    path = LIB / "manifest.json"
    by_id = {a["id"]: a for a in json.loads(path.read_text())["assets"]}
    by_id.update({e["id"]: e for e in entries})
    path.write_text(json.dumps({"assets": sorted(by_id.values(), key=lambda a: a["id"])}, ensure_ascii=False, indent=2) + "\n")
    SOURCES.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(entries)} pixel assets")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
