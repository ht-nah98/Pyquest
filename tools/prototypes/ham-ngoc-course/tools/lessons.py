"""Builds content/courses/ham-ngoc/lessons/hNN.json from slides/hNN.json + hNN/eK (spec, starter, solution).

usage: python3 -B tools/lessons.py   (after tools/make.py; lessons without a slides file are left out)
Every lesson stays "draft": only the coach removes that (AGENTS.md 9.7).
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
COURSE = HERE.parents[2] / "content/courses/ham-ngoc"
FIELDS = ["id", "title", "task", "input", "toolbox", "mode", "goals", "test", "walkthrough", "hints"]
PARTS = [
    ("A. Bức tranh toàn cảnh", 0, 0), ("B. Nhân vật", 1, 3), ("C. Quái", 4, 6), ("D. Tự đánh", 7, 9),
    ("E. Lên cấp và skill", 10, 14), ("F. Vượt ải và ra mắt", 15, 18),
]


def exercise(folder: Path) -> dict:
    spec = json.loads((folder / "spec.json").read_text())
    out = {k: spec[k] for k in FIELDS if spec.get(k) is not None}
    out["main"] = "main.py"
    for kind in ("starter", "solution"):
        out[kind] = {"main.py": (folder / f"{kind}.py").read_text()}
    return out


def main() -> None:
    made = ["h00"]
    for n in range(1, 19):
        lid = f"h{n:02d}"
        src = HERE / "slides" / f"{lid}.json"
        if not src.exists():
            continue
        s = json.loads(src.read_text())
        lesson = {"id": lid, "courseId": "ham-ngoc", "order": n, "title": s["title"], "draft": True,
                  "summary": s["summary"], "steps": s["steps"],
                  "exercises": [exercise(e) for e in sorted((HERE / lid).glob("e*"))],
                  "unlocksRoadmap": s["unlocksRoadmap"], "docsUnlocked": s.get("docsUnlocked", [])}
        (COURSE / "lessons" / f"{lid}.json").write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
        made.append(lid)
    path = COURSE / "course.json"
    course = json.loads(path.read_text())
    course["lessonIds"] = made
    parts = [{"title": t, "lessonIds": [f"h{i:02d}" for i in range(a, b + 1) if f"h{i:02d}" in made]} for t, a, b in PARTS]
    course["parts"] = [p for p in parts if p["lessonIds"]]
    path.write_text(json.dumps(course, ensure_ascii=False, indent=2) + "\n")
    print(len(made), "lessons")


if __name__ == "__main__":
    main()
