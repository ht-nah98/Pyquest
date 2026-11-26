// The `pyquest` module children import. Kept as a TS string so Vite, Vitest and tsx all load it the same way.
// Names are English (spec §5); every call appends one draw event the page turns into pictures (or sound).
import { KEYS } from '../keys';
import { MUSIC, SOUNDS } from '../sounds';

export const PYQUEST_SOURCE = String.raw`
"""PyQuest drawing library. Coordinates: origin top-left, y grows downward."""
import random as _random

WIDTH = 400
HEIGHT = 600

# Only the smallest pieces: what plain Python cannot do by itself (paint the screen, read the keyboard,
# load a picture file). Everything a game needs on top, like draw_bird, the child writes with def.
__all__ = [
    "WIDTH", "HEIGHT", "clear", "draw_rect", "draw_image", "draw_text", "key_pressed", "random_int", "print",
    "play_sound", "play_music", "stop_music", "draw_circle", "draw_line", "draw_triangle", "draw_polygon",
    "draw_ellipse", "draw_arc", "mouse_x", "mouse_y", "clicked",
]

# Made by the page itself (8-bit synth): the names are the whole list, there are no sound files.
_SOUNDS = ${JSON.stringify(SOUNDS)}
_MUSIC = ${JSON.stringify(MUSIC)}
# The keys the page reports (it turns W A S D into the arrows).
_KEYS = ${JSON.stringify(KEYS)}
_OTHER_KEYS = {"w": "up", "a": "left", "s": "down", "d": "right", " ": "space"}


class PyQuestError(Exception):
    """An error whose message is already Vietnamese and meant for the child."""


class _EventLimit(Exception):
    pass


_state = {"events": [], "max": 5000, "keys": set(), "tapped": False, "mouse": (0, 0), "clicked": False, "rng": _random.Random(1),
          "assets": set(), "stack": [], "calls": [], "calls_truncated": False}


def _reset(seed, max_events, width=400, height=600):
    # The stage size is set per course (ADR 0009): "from pyquest import *" reads these at import time.
    global WIDTH, HEIGHT
    WIDTH, HEIGHT = width, height
    _state["events"] = []
    _state["max"] = max_events
    _state["keys"] = set()
    _state["tapped"] = False
    _state["mouse"] = (0, 0)
    _state["clicked"] = False
    _state["rng"] = _random.Random(seed)
    _state["stack"] = []
    _state["calls"] = []
    _state["calls_truncated"] = False


def _emit(event):
    """Sends one drawing order to the page. "by" says which of the child's calls drew it."""
    if len(_state["events"]) >= _state["max"]:
        raise _EventLimit()
    if _state["stack"] and _state["stack"][-1] is not None:
        event["by"] = _state["stack"][-1]
    _state["events"].append(event)


def _num(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(name + " phải là một số")
    if not -1e15 <= value <= 1e15:
        too_big = isinstance(value, int) or abs(value) < float("inf")
        raise PyQuestError(name + " không được là " + ("số quá lớn" if too_big else str(value)))
    return value


def _frame(value):
    """frame= as a whole number."""
    return int(_num(value if isinstance(value, float) else int(value), "frame"))


def clear(color="skyblue"):
    """Fill the whole stage with one color."""
    _emit({"t": "clear", "color": str(color)})


def _paint(event, color, border):
    """Adds the fill and the outline to a shape. color=None: only the outline (border= says its colour)."""
    if color is None and border is None:
        raise PyQuestError('color=None là không tô màu, nên cần border="màu viền"')
    event["color"] = "none" if color is None else str(color)
    if border is not None:
        event["border"] = str(border)
    _emit(event)


def draw_rect(x, y, w, h, color="green", border=None):
    """Fill a box w wide and h tall, its top-left corner at (x, y). border="black" adds an outline."""
    _paint({"t": "rect", "x": _num(x, "x"), "y": _num(y, "y"), "w": _num(w, "w"), "h": _num(h, "h")}, color, border)


def draw_text(text, x, y, size=24, color="white"):
    """Write text with its centre at (x, y)."""
    _emit({"t": "text", "text": str(text), "x": _num(x, "x"), "y": _num(y, "y"), "size": _num(size, "size"),
           "color": str(color)})


def _radius(r):
    r = _num(r, "r")
    if r < 0:
        raise PyQuestError("Bán kính r không được nhỏ hơn 0")
    return r


def draw_circle(x, y, r, color="orange", border=None):
    """Fill a circle with its centre at (x, y) and radius r. border="black" adds an outline."""
    r = _radius(r)
    _paint({"t": "circle", "x": _num(x, "x"), "y": _num(y, "y"), "r": r}, color, border)


def draw_ellipse(x, y, w, h, color="pink", border=None):
    """Fill an oval with its centre at (x, y), w wide and h tall. border="black" adds an outline."""
    event = {"t": "ellipse", "x": _num(x, "x"), "y": _num(y, "y"), "w": _num(w, "w"), "h": _num(h, "h")}
    if event["w"] < 0 or event["h"] < 0:
        raise PyQuestError("Chiều rộng w và chiều cao h không được nhỏ hơn 0")
    _paint(event, color, border)


def draw_arc(x, y, r, start, end, color="black", width=3):
    """Draw part of a circle's edge, centre (x, y), from angle start to angle end in degrees.
    0 is to the right and angles turn clockwise, so draw_arc(x, y, 15, 0, 180) is a smile."""
    r = _radius(r)
    event = {"t": "arc", "x": _num(x, "x"), "y": _num(y, "y"), "r": r, "start": _num(start, "start"),
             "end": _num(end, "end")}
    width = _num(width, "width")
    if width <= 0:
        raise PyQuestError("Độ dày width phải lớn hơn 0")
    event["color"] = str(color)
    event["width"] = width
    _emit(event)


def draw_line(x1, y1, x2, y2, color="black", width=3):
    """Draw a straight line from (x1, y1) to (x2, y2), width thick."""
    width = _num(width, "width")
    if width <= 0:
        raise PyQuestError("Độ dày width phải lớn hơn 0")
    _emit({"t": "line", "x1": _num(x1, "x1"), "y1": _num(y1, "y1"), "x2": _num(x2, "x2"), "y2": _num(y2, "y2"),
           "color": str(color), "width": width})


def _corner(point):
    """One corner (x, y) of a shape, as a list of two numbers."""
    if not isinstance(point, (list, tuple)) or len(point) != 2:
        raise PyQuestError("Mỗi góc phải là một cặp số (x, y)")
    return [_num(point[0], "x"), _num(point[1], "y")]


def draw_polygon(points, color="purple", border=None):
    """Fill a shape through the corners in points, a list of (x, y) pairs, in order. border= adds an outline."""
    if not isinstance(points, (list, tuple)):
        raise PyQuestError("points phải là một danh sách các góc (x, y)")
    if len(points) < 3:
        raise PyQuestError("Một hình cần ít nhất 3 góc")
    _paint({"t": "polygon", "points": [_corner(p) for p in points]}, color, border)


def draw_triangle(x1, y1, x2, y2, x3, y3, color="purple", border=None):
    """Fill a triangle with corners (x1, y1), (x2, y2) and (x3, y3). border= adds an outline."""
    draw_polygon([(_num(x1, "x1"), _num(y1, "y1")), (_num(x2, "x2"), _num(y2, "y2")),
                  (_num(x3, "x3"), _num(y3, "y3"))], color, border)


def _closest_asset(asset):
    """The library picture a mistyped name most likely meant, or None."""
    import difflib
    names = sorted(_state["assets"])
    low = asset.lower().replace("_", "-").replace(" ", "-")
    if low in names:
        return low
    inside = [n for n in names if low and low in n]
    if len(inside) == 1:
        return inside[0]
    close = difflib.get_close_matches(low, names, n=1, cutoff=0.6)
    return close[0] if close else None


def _picture(path):
    """images/bird-cu.png -> "bird-cu", the picture's name in the library."""
    path = str(path)
    if not (path.startswith("images/") and path.endswith(".png")):
        raise PyQuestError("Ảnh phải nằm trong thư mục images/ và có đuôi .png")
    asset = path[len("images/"):-len(".png")]
    if asset not in _state["assets"]:
        guess = _closest_asset(asset)
        hint = "" if guess is None else ". Có phải em muốn images/" + guess + ".png?"
        raise PyQuestError("Không tìm thấy file " + path + hint)
    return asset


def draw_image(path, x, y, frame=0, flip=False, scale=1, mirror=False):
    """Paste a whole picture file with its top-left corner at (x, y). flip=True draws it upside down,
    mirror=True swaps left and right, scale=2 draws it twice as big."""
    event = {"t": "sprite", "sprite": _picture(path), "x": _num(x, "x"), "y": _num(y, "y"), "frame": _frame(frame)}
    if flip:
        event["flip"] = True
    if _num(scale, "scale") <= 0:
        raise PyQuestError("scale phải lớn hơn 0")
    if scale != 1:
        event["scale"] = scale
    if mirror not in (True, False):
        raise PyQuestError("mirror phải là True hoặc False")
    if mirror:
        event["mirror"] = True
    _emit(event)


def key_pressed(key="space"):
    """True while the key is held. A tap on the screen counts as space."""
    key = _key_name(key)
    if key == "space" and _state["tapped"]:
        return True
    return key in _state["keys"]


def _key_name(key):
    """The key's name on the list: "Left", "w" and " " are other ways to write one."""
    low = str(key).lower()
    low = _OTHER_KEYS.get(low, low)
    return low if low in _KEYS else _known(key, _KEYS, "phím", "key_pressed")


def mouse_x():
    """Where the mouse or finger is, across the stage. 0 until it has been on the stage."""
    return _state["mouse"][0]


def mouse_y():
    """Where the mouse or finger is, down the stage. 0 until it has been on the stage."""
    return _state["mouse"][1]


def clicked():
    """True for one frame when the mouse or a finger presses the stage."""
    return _state["clicked"]


def random_int(a, b):
    """A whole number from a to b. The same seed always gives the same numbers."""
    return _state["rng"].randint(a, b)


def print(*values, sep=" ", end=""):
    """print() shows a speech bubble on the stage instead of a log line."""
    _emit({"t": "say", "text": sep.join(str(v) for v in values)})


def _known(name, names, what, call):
    """The sound, tune or key name, or a Vietnamese error that lists the right ones."""
    import difflib
    word = isinstance(name, str)
    name = str(name)
    if name in names:
        return name
    close = difflib.get_close_matches(name.lower(), names, n=1, cutoff=0.5) if word else []
    hint = ". Có phải em muốn " + call + '("' + close[0] + '")?' if close else "."
    raise PyQuestError("Không có " + what + ' "' + name + '"' + hint + " Có: " + ", ".join(names))


def play_sound(name):
    """Play a short sound once: "flap", "point", "hit", "fall", "win", "click"."""
    _emit({"t": "sound", "name": _known(name, _SOUNDS, "tiếng", "play_sound")})


def play_music(name):
    """Start a tune that loops until stop_music() or ■ Dừng: "happy", "adventure", "calm"."""
    _emit({"t": "music", "name": _known(name, _MUSIC, "bản nhạc", "play_music")})


def stop_music():
    """Stop the tune."""
    _emit({"t": "music", "name": None})
`;
