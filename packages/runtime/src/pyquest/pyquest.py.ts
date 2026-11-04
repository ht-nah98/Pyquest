// The `pyquest` module children import. Kept as a TS string so Vite, Vitest and tsx all load it the same way.
// Names are English (spec §5); every call appends one draw event the page turns into pictures.
export const PYQUEST_SOURCE = String.raw`
"""PyQuest drawing library. Coordinates: origin top-left, y grows downward."""
import random as _random

WIDTH = 400
HEIGHT = 600

__all__ = [
    "WIDTH", "HEIGHT", "clear", "draw_bird", "draw_sprite", "draw_rect", "draw_text",
    "key_pressed", "random_int", "print",
]


class _EventLimit(Exception):
    pass


_state = {"events": [], "max": 5000, "keys": set(), "tapped": False, "rng": _random.Random(1)}


def _reset(seed, max_events):
    _state["events"] = []
    _state["max"] = max_events
    _state["keys"] = set()
    _state["tapped"] = False
    _state["rng"] = _random.Random(seed)


def _emit(event):
    if len(_state["events"]) >= _state["max"]:
        raise _EventLimit()
    _state["events"].append(event)


def _num(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(name + " phải là một số")
    return value


def clear(color="skyblue"):
    """Fill the whole stage with one color."""
    _emit({"t": "clear", "color": str(color)})


def draw_bird(x, y, frame=0):
    """Draw the bird with its top-left corner at (x, y)."""
    draw_sprite("bird", x, y, frame)


def draw_sprite(name, x, y, frame=0, flip=False):
    """Draw a picture from the asset library. flip=True draws it upside down."""
    event = {"t": "sprite", "sprite": str(name), "x": _num(x, "x"), "y": _num(y, "y"), "frame": int(frame)}
    if flip:
        event["flip"] = True
    _emit(event)


def draw_rect(x, y, w, h, color="green"):
    _emit({"t": "rect", "x": _num(x, "x"), "y": _num(y, "y"), "w": _num(w, "w"), "h": _num(h, "h"),
           "color": str(color)})


def draw_text(text, x, y, size=24, color="white"):
    _emit({"t": "text", "text": str(text), "x": _num(x, "x"), "y": _num(y, "y"), "size": _num(size, "size"),
           "color": str(color)})


def key_pressed(key="space"):
    """True while the key is held. A tap on the screen counts as space."""
    if key == "space" and _state["tapped"]:
        return True
    return key in _state["keys"]


def random_int(a, b):
    """A whole number from a to b. The same seed always gives the same numbers."""
    return _state["rng"].randint(a, b)


def print(*values, sep=" ", end=""):
    """print() shows a speech bubble on the stage instead of a log line."""
    _emit({"t": "say", "text": sep.join(str(v) for v in values)})
`;
