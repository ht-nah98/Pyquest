"""Checks every exercise on the stub library. python3 -B tools/check.py [h05 …] [--fuzz] [--png DIR]"""
import json
import os
import random
import sys
import time

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import grader  # noqa: E402
from grader import pyquest  # noqa: E402

ROOT = os.path.dirname(HERE)
LIMITS = {"title": 60, "task": 280}


def load():
    out = []
    for lesson in sorted(os.listdir(ROOT)):
        if lesson[0] == "h" and lesson[1:].isdigit():
            for part in sorted(os.listdir(os.path.join(ROOT, lesson))):
                folder = os.path.join(ROOT, lesson, part)
                read = {}
                for name in sorted(os.listdir(folder)):
                    with open(os.path.join(folder, name), encoding="utf-8") as f:
                        read[name] = f.read()
                out.append((json.loads(read["spec.json"]), read))
    return out


def check_text(spec, bad):
    for key, size in LIMITS.items():
        if not 0 < len(spec[key]) <= size:
            bad.append(key + " is " + str(len(spec[key])))
    if len(spec["walkthrough"]) > 8 or any(len(s) > 200 for s in spec["walkthrough"]):
        bad.append("walkthrough too long")
    if len(spec["hints"]) > 5 or any(len(s) > 160 for s in spec["hints"]):
        bad.append("hints too long")
    for g in spec["goals"]:
        if len(g["label"]) > 60:
            bad.append("label too long: " + g["label"])
    if spec["mode"] == "game":
        t = spec["test"]
        if t["frames"] > 600:
            bad.append("frames")
        for k in t.get("keys", []):
            if not k["from"] <= k["to"] < t["frames"]:
                bad.append("key range " + str(k))
        for c in t.get("clicks", []):
            if c["frame"] >= t["frames"]:
                bad.append("click frame")


def check_style(name, code, bad):
    for i, line in enumerate(code.split("\n")):
        if len(line) > 106:
            bad.append(name + " line " + str(i + 1) + " is " + str(len(line)) + " long")
    import ast
    for n in ast.walk(ast.parse(code)):
        if isinstance(n, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp, ast.Lambda, ast.JoinedStr, ast.Try,
                          ast.ClassDef, ast.Slice, ast.Tuple)):
            bad.append(name + " uses " + type(n).__name__)
        if isinstance(n, ast.arguments) and n.defaults:
            bad.append(name + " has default arguments")


def fuzz(code, seeds=10, frames=3000):
    """Random keys and clicks. Returns (error or None, most events in a frame, ms per frame, screens seen)."""
    most, spent, seen = 0, 0.0, set()
    for seed in range(1, seeds + 1):
        grader.reset(seed)
        g = {"__name__": "__main__"}
        rnd = random.Random(seed * 7919)
        try:
            exec(compile(code, "main.py", "exec"), g)
            keys, mouse = set(), (0, 0)
            for f in range(frames):
                if rnd.random() < 0.12:
                    keys = {k for k in ("left", "right", "up", "down") if rnd.random() < 0.35}
                extra = {k for k in ("space", "1", "2", "3") if rnd.random() < 0.04}
                clicked = rnd.random() < 0.03
                if clicked:
                    mouse = (rnd.uniform(-20, 620), rnd.uniform(-20, 620))
                pyquest.S.update(events=[], keys=keys | extra, tapped=clicked, mouse=mouse, clicked=clicked)
                t = time.perf_counter()
                g["update"]()
                g["draw"]()
                spent += time.perf_counter() - t
                most = max(most, len(pyquest.S["events"]))
                if "screen" in g:
                    seen.add(g["screen"])
        except Exception as exc:
            return type(exc).__name__ + ": " + str(exc) + " (seed " + str(seed) + ")", most, 0, seen
    return None, most, spent * 1000 / (seeds * frames), seen


def main():
    want = [a for a in sys.argv[1:] if a[0] == "h"]
    png = sys.argv[sys.argv.index("--png") + 1] if "--png" in sys.argv else None
    totals = {"exercises": 0, "goals": 0, "starters": 0, "wrong": 0, "alts": 0, "bad": 0}
    for spec, files in load():
        if want and spec["id"][:3] not in want and spec["id"] not in want:
            continue
        bad = []
        check_text(spec, bad)
        for name, code in files.items():
            if name in ("starter.py", "solution.py"):
                check_style(name, code, bad)
        sol = files["solution.py"]
        run, missed = grader.grade(sol, spec, sol)
        if missed:
            bad.append("solution misses " + ", ".join(missed) + " " + str(run.error))
        start_run, start_missed = grader.grade(files["starter.py"], spec, sol)
        if not start_missed:
            bad.append("starter already passes")
        if start_run.error:
            bad.append("starter crashes: " + start_run.error)
        for name, code in files.items():
            if name.startswith("wrong"):
                totals["wrong"] += 1
                r, m = grader.grade(code, spec, sol)
                if not m:
                    bad.append(name + " passes: " + spec["wrong"][int(name[5]) - 1])
                if "-v" in sys.argv:
                    print("   ", name, m, r.error or "")
            if name.startswith("alt"):
                totals["alts"] += 1
                r, m = grader.grade(code, spec, sol)
                if m:
                    bad.append(name + " misses " + ", ".join(m) + ": " + spec["alts"][int(name[3]) - 1])
        line = spec["id"] + " lines " + str(len(sol.splitlines())) + " goals " + str(len(spec["goals"]))
        line += " starter fails " + str(len(start_missed))
        if "-v" in sys.argv:
            print("   vars", run.vars)
        if spec["mode"] == "game" and "--fuzz" in sys.argv:
            err, most, ms, seen = fuzz(sol)
            line += " fuzz max " + str(most) + " events, " + str(round(ms, 3)) + " ms " + "/".join(sorted(seen))
            if err:
                bad.append("fuzz: " + err)
            if most > 350:
                bad.append("too many events: " + str(most))
        if png and run.frames:
            grader.render(run.frames[-1], os.path.join(png, spec["id"] + ".png"))
        totals["exercises"] += 1
        totals["goals"] += len(spec["goals"])
        totals["starters"] += 1 if start_missed else 0
        totals["bad"] += len(bad)
        print(line, "OK" if not bad else "")
        for b in bad:
            print("    !!", b)
    print(totals)
    return 1 if totals["bad"] else 0


if __name__ == "__main__":
    sys.exit(main())
