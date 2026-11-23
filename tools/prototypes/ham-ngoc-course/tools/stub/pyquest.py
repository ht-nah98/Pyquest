"""A small stand-in for the real pyquest library: same commands, events kept in a list (tests only)."""
import random as _random

WIDTH = 600
HEIGHT = 600
SOUNDS = ["flap", "point", "hit", "fall", "win", "click"]
MUSIC = ["happy", "adventure", "calm"]
KEYS = ["left", "right", "up", "down", "space", "1", "2", "3"]
__all__ = [
    "WIDTH", "HEIGHT", "clear", "draw_rect", "draw_image", "draw_text", "key_pressed", "random_int", "print",
    "play_sound", "play_music", "stop_music", "draw_circle", "draw_line", "draw_triangle", "draw_polygon",
    "mouse_x", "mouse_y", "clicked",
]
S = {"events": [], "keys": set(), "tapped": False, "mouse": (0, 0), "clicked": False, "rng": _random.Random(1),
     "assets": set()}


def _num(v):
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        raise TypeError("not a number: " + repr(v))
    return v


def _emit(e):
    S["events"].append(e)


def clear(color="skyblue"):
    _emit({"t": "clear", "color": str(color)})


def draw_rect(x, y, w, h, color="green"):
    _emit({"t": "rect", "x": _num(x), "y": _num(y), "w": _num(w), "h": _num(h), "color": str(color)})


def draw_text(text, x, y, size=24, color="white"):
    _emit({"t": "text", "text": str(text), "x": _num(x), "y": _num(y), "size": _num(size), "color": str(color)})


def draw_circle(x, y, r, color="orange"):
    if _num(r) < 0:
        raise ValueError("r < 0")
    _emit({"t": "circle", "x": _num(x), "y": _num(y), "r": r, "color": str(color)})


def draw_line(x1, y1, x2, y2, color="black", width=3):
    if _num(width) <= 0:
        raise ValueError("width <= 0")
    _emit({"t": "line", "x": _num(x1), "y": _num(y1), "x2": _num(x2), "y2": _num(y2), "color": str(color),
           "width": width})


def draw_polygon(points, color="purple"):
    _emit({"t": "polygon", "x": points[0][0], "y": points[0][1], "points": list(points), "color": str(color)})


def draw_triangle(x1, y1, x2, y2, x3, y3, color="purple"):
    draw_polygon([(_num(x1), _num(y1)), (_num(x2), _num(y2)), (_num(x3), _num(y3))], color)


def draw_image(path, x, y, frame=0, flip=False, scale=1, mirror=False):
    if not (path.startswith("images/") and path.endswith(".png") and path[7:-4] in S["assets"]):
        raise ValueError("no picture " + path)
    if not _num(scale) > 0:
        raise ValueError("scale")
    _emit({"t": "sprite", "sprite": path[7:-4], "x": _num(x), "y": _num(y), "frame": int(frame), "flip": flip,
           "scale": scale, "mirror": mirror})


def key_pressed(key="space"):
    if key not in KEYS:
        raise ValueError("no key " + str(key))
    return key in S["keys"] or (key == "space" and S["tapped"])


def mouse_x():
    return S["mouse"][0]


def mouse_y():
    return S["mouse"][1]


def clicked():
    return S["clicked"]


def random_int(a, b):
    return S["rng"].randint(a, b)


def print(*values, sep=" ", end=""):
    _emit({"t": "say", "text": sep.join(str(v) for v in values)})


def play_sound(name):
    if name not in SOUNDS:
        raise ValueError("no sound " + str(name))
    _emit({"t": "sound", "name": name})


def play_music(name):
    if name not in MUSIC:
        raise ValueError("no music " + str(name))
    _emit({"t": "music", "name": name})


def stop_music():
    _emit({"t": "music", "name": None})
