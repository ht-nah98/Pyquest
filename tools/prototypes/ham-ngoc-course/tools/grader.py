"""Runs a program on the stub library and judges goals the way packages/checker does (kinds used by the course)."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(HERE, "stub"))
import pyquest  # noqa: E402
import random  # noqa: E402

LIBRARY = os.path.join(REPO, "content", "assets", "library")
with open(os.path.join(LIBRARY, "manifest.json"), encoding="utf-8") as f:
    ASSETS = {a["id"]: a for a in json.load(f)["assets"]}
pyquest.S["assets"] = set(ASSETS)


def reset(seed):
    pyquest.S.update(events=[], keys=set(), tapped=False, mouse=(0, 0), clicked=False, rng=random.Random(seed))


def visible(g):
    return {k: v for k, v in g.items() if not k.startswith("_") and k not in ("WIDTH", "HEIGHT")
            and isinstance(v, (bool, int, float, str))}


def test_input(test, frame):
    keys, tapped = set(), frame in test.get("taps", [])
    for k in test.get("keys", []):
        if k["from"] <= frame <= k["to"]:
            keys.add(k["key"])
            if k["key"] == "space" and frame == k["from"]:
                tapped = True
    last = None
    for c in test.get("clicks", []):
        if c["frame"] <= frame and (last is None or c["frame"] >= last["frame"]):
            last = c
    mouse, clicked = (0, 0), False
    if last is not None:
        mouse = (last["x"], last["y"])
        if last["frame"] == frame:
            clicked = tapped = True
            keys.add("space")
    return keys, tapped, mouse, clicked


class Run:
    """frames: list of event lists; vars_by_frame; error; calls: [(name, args)]."""

    def __init__(self):
        self.frames, self.vars_by_frame, self.error, self.calls, self.vars, self.game = [], [], None, [], {}, None


def profiler(run, count):
    def prof(frame, event, arg):
        code = frame.f_code
        if event == "call" and code.co_filename == "main.py" and not code.co_name.startswith("<"):
            if count[0] < 300:
                count[0] += 1
                names = code.co_varnames[:code.co_argcount]
                run.calls.append((code.co_name, tuple(repr(frame.f_locals.get(n))[:30] for n in names)))
    return prof


def run_code(code, mode, test=None, seed=1, track=False):
    run = Run()
    reset(seed)
    g = {"__name__": "__main__"}
    count = [0]
    if track:
        sys.setprofile(profiler(run, count))
    try:
        exec(compile(code, "main.py", "exec"), g)
        run.vars = visible(g)
        if mode == "script":
            run.frames = [pyquest.S["events"]]
            return run
        run.game = g
        if not callable(g.get("update")):
            raise RuntimeError("missing update")
        first = [e for e in pyquest.S["events"] if e["t"] in ("sound", "music")]
        for f in range(test["frames"]):
            pyquest.S["events"] = first
            first = []
            count[0] = 0
            keys, tapped, mouse, clicked = test_input(test, f)
            pyquest.S.update(keys=keys, tapped=tapped, mouse=mouse, clicked=clicked)
            g["update"]()
            if callable(g.get("draw")):
                g["draw"]()
            run.frames.append(pyquest.S["events"])
            run.vars = visible(g)
            run.vars_by_frame.append(run.vars)
    except Exception as exc:
        run.error = type(exc).__name__ + ": " + str(exc)
        if mode == "script":
            run.frames = [pyquest.S["events"]]
    finally:
        sys.setprofile(None)
    return run


def in_group(sprite, group):
    return sprite == group or sprite.startswith(group + "-")


def track_of(run, sprite, axis):
    out = []
    for f in run.frames:
        found = [e for e in f if e["t"] == "sprite" and in_group(e["sprite"], sprite)]
        out.append(found[0][axis] if found else None)
    return out


def picture(run):
    last = run.frames[-1] if run.frames else []
    sky = [e["color"] for e in last if e["t"] == "clear"][-1:]
    out = []
    for e in last:
        if e["t"] in ("rect", "sprite", "text", "circle", "line", "polygon"):
            skip = ("color",) if e["t"] == "text" else ()
            out.append(json.dumps({k: v for k, v in e.items() if k not in skip}, sort_keys=True, default=str))
    return sky, sorted(out)


def compare(goal, v):
    if v is None:
        return False
    op, want = goal["op"], goal["value"]
    if op == "!=":
        return v != want
    if not isinstance(v, (int, float)):
        return False
    return v >= want if op == ">=" else v <= want


def meets(goal, run, expected):
    kind = goal["kind"]
    sprites = [[e for e in f if e["t"] == "sprite"] for f in run.frames]
    if kind == "noError":
        return run.error is None
    if kind == "matches":
        return run.error is None and expected is not None and picture(run) == picture(expected)
    if kind == "varEquals":
        v = run.vars.get(goal["name"])
        return v is not None and type(v) in (int, float, type(goal["value"])) and v == goal["value"]
    if kind == "varCompare":
        if goal.get("when") == "ever":
            return any(compare(goal, v.get(goal["name"])) for v in run.vars_by_frame)
        return compare(goal, run.vars.get(goal["name"]))
    if kind == "drew":
        tol = goal.get("tolerance", 0)
        return any(in_group(e["sprite"], goal["sprite"]) and ("at" not in goal or (
            abs(e["x"] - goal["at"][0]) <= tol and abs(e["y"] - goal["at"][1]) <= tol)) for f in sprites for e in f)
    if kind == "drewText":
        return any(e["t"] == "text" and e["text"] == goal["text"] for f in run.frames for e in f)
    if kind == "printed":
        return any(e["t"] == "say" and e["text"].strip() == goal["text"].strip() for f in run.frames for e in f)
    if kind == "drewCount":
        return any(sum(in_group(e["sprite"], goal["sprite"]) for e in f) >= goal["min"] for f in sprites)
    if kind == "distinctCount":
        return len({e[goal["axis"]] for f in sprites for e in f if in_group(e["sprite"], goal["sprite"])}) >= goal["min"]
    if kind == "drewRects":
        for f in run.frames:
            boxes = [e for e in f if e["t"] == "rect" and not (e["w"] >= 600 and e["h"] >= 600)]
            if len(boxes) >= goal["min"] and ("at" not in goal or any([e["x"], e["y"]] == goal["at"] for e in boxes)):
                return True
        return False
    if kind == "moves":
        pos = [p for p in track_of(run, goal["sprite"], goal["axis"]) if p is not None]
        return len(pos) > 0 and (pos[-1] - pos[0]) * goal["dir"] > 0
    if kind == "staysWithin":
        pos = track_of(run, goal["sprite"], goal["axis"])
        if "frames" in goal:
            pos = pos[goal["frames"][0]:goal["frames"][1] + 1]
        pos = [p for p in pos if p is not None]
        return len(pos) > 0 and all(p >= goal.get("min", p) and p <= goal.get("max", p) for p in pos)
    if kind == "played":
        ev = [e for f in run.frames for e in f]
        if "sound" in goal:
            return sum(e["t"] == "sound" and e["name"] == goal["sound"] for e in ev) >= goal.get("min", 1)
        return any(e["t"] == "music" and e["name"] is not None and goal["music"] in ("*", e["name"]) for e in ev)
    if kind == "called":
        calls = [c for c in run.calls if c[0] == goal["name"]]
        return (len(set(calls)) if goal.get("distinct") else len(calls)) >= goal.get("min", 1)
    raise ValueError("goal kind " + kind)


def grade(code, spec, solution):
    goals = spec["goals"]
    track = any(g["kind"] == "called" for g in goals)
    run = run_code(code, spec["mode"], spec.get("test"), track=track)
    expected = None
    if any(g["kind"] == "matches" for g in goals):
        expected = run_code(solution, spec["mode"], spec.get("test"))
    return run, [g["id"] for g in goals if not meets(g, run, expected)]


def render(events, path):
    from PIL import Image, ImageDraw, ImageFont, ImageColor
    im = Image.new("RGBA", (600, 600), "white")
    for e in events:
        layer = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        if e["t"] == "clear":
            d.rectangle([0, 0, 600, 600], fill=e["color"])
        elif e["t"] == "rect" and e["w"] > 0 and e["h"] > 0:
            d.rectangle([e["x"], e["y"], e["x"] + e["w"], e["y"] + e["h"]], fill=e["color"])
        elif e["t"] == "circle":
            d.ellipse([e["x"] - e["r"], e["y"] - e["r"], e["x"] + e["r"], e["y"] + e["r"]], fill=e["color"])
        elif e["t"] == "line":
            d.line([e["x"], e["y"], e["x2"], e["y2"]], fill=e["color"], width=int(e["width"]))
        elif e["t"] == "text":
            font = ImageFont.load_default(size=e["size"] * 0.75)
            name = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
            if os.path.exists(name):
                font = ImageFont.truetype(name, int(e["size"] * 0.7))
            d.text((e["x"], e["y"]), e["text"], fill=e["color"], font=font, anchor="mm", stroke_width=1,
                   stroke_fill="black")
        elif e["t"] == "sprite":
            a = ASSETS[e["sprite"]]
            sheet = Image.open(os.path.join(LIBRARY, a["file"])).convert("RGBA")
            n = e["frame"] % a["frames"]
            one = sheet.crop((n * a["width"], 0, (n + 1) * a["width"], a["height"]))
            one = one.resize((max(1, int(a["width"] * e["scale"])), max(1, int(a["height"] * e["scale"]))), 0)
            layer.paste(one, (int(e["x"]), int(e["y"])), one)
        im = Image.alpha_composite(im, layer)
    im.convert("RGB").save(path)
