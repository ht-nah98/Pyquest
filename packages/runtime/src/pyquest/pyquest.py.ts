// The `pyquest` module children import. Kept as a TS string so Vite, Vitest and tsx all load it the same way.
// Names are English (spec §5); every call appends one draw event the page turns into pictures (or sound).
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
    "play_sound", "play_music", "stop_music",
]

# Made by the page itself (8-bit synth): the names are the whole list, there are no sound files.
_SOUNDS = ${JSON.stringify(SOUNDS)}
_MUSIC = ${JSON.stringify(MUSIC)}


class PyQuestError(Exception):
    """An error whose message is already Vietnamese and meant for the child."""


class _EventLimit(Exception):
    pass


_state = {"events": [], "max": 5000, "keys": set(), "tapped": False, "rng": _random.Random(1),
          "assets": set(), "stack": [], "calls": [], "calls_truncated": False}


def _reset(seed, max_events):
    _state["events"] = []
    _state["max"] = max_events
    _state["keys"] = set()
    _state["tapped"] = False
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
    return value


def clear(color="skyblue"):
    """Fill the whole stage with one color."""
    _emit({"t": "clear", "color": str(color)})


def draw_rect(x, y, w, h, color="green"):
    """Fill a box w wide and h tall, its top-left corner at (x, y)."""
    _emit({"t": "rect", "x": _num(x, "x"), "y": _num(y, "y"), "w": _num(w, "w"), "h": _num(h, "h"),
           "color": str(color)})


def draw_text(text, x, y, size=24, color="white"):
    """Write text with its centre at (x, y)."""
    _emit({"t": "text", "text": str(text), "x": _num(x, "x"), "y": _num(y, "y"), "size": _num(size, "size"),
           "color": str(color)})


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


def draw_image(path, x, y, frame=0, flip=False):
    """Paste a whole picture file with its top-left corner at (x, y). flip=True draws it upside down."""
    event = {"t": "sprite", "sprite": _picture(path), "x": _num(x, "x"), "y": _num(y, "y"), "frame": int(frame)}
    if flip:
        event["flip"] = True
    _emit(event)


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


def _known(name, names, what, call):
    """The sound or tune name, or a Vietnamese error that lists the right ones."""
    import difflib
    name = str(name)
    if name in names:
        return name
    close = difflib.get_close_matches(name.lower(), names, n=1, cutoff=0.5)
    hint = ". Có phải em muốn " + call + '("' + close[0] + '")?' if close else ""
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
