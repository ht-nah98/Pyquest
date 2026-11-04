// Python side of the runner: writes the child's files, runs them with limits, and returns JSON.
export const HOST_SOURCE = String.raw`
import json, os, shutil, sys, types
import pyquest

PROJECT = "/home/pyodide/project"
_game = {"globals": None, "files": set()}


class _LineLimit(Exception):
    pass


def _write_files(files):
    os.chdir("/")
    shutil.rmtree(PROJECT, ignore_errors=True)
    os.makedirs(PROJECT, exist_ok=True)
    for path, text in files.items():
        full = os.path.join(PROJECT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(text)
    os.chdir(PROJECT)
    if PROJECT not in sys.path:
        sys.path.insert(0, PROJECT)
    # Forget modules imported from an earlier run's files.
    for name, mod in list(sys.modules.items()):
        origin = getattr(mod, "__file__", None) or ""
        if origin.startswith(PROJECT):
            del sys.modules[name]
    return {os.path.join(PROJECT, p) for p in files}


def _vars(g):
    out = {}
    for k, v in g.items():
        if k.startswith("_") or k in pyquest.__all__:
            continue
        if isinstance(v, (bool, int, float, str)):
            out[k] = v
    return out


def _error(exc, user_files):
    line = None
    if isinstance(exc, SyntaxError) and exc.filename in user_files:
        line = exc.lineno
    else:
        tb = exc.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename in user_files:
                line = tb.tb_lineno
            tb = tb.tb_next
    msg = exc.msg if isinstance(exc, SyntaxError) else str(exc)
    return {"type": type(exc).__name__, "msg": msg, "line": line}


def _tracer(user_files, max_lines):
    count = [0]

    def local(frame, event, arg):
        if event == "line":
            count[0] += 1
            if count[0] > max_lines:
                raise _LineLimit()
        return local

    def global_(frame, event, arg):
        return local if frame.f_code.co_filename in user_files else None

    return global_


def _exec(fn, user_files, max_lines):
    """Runs fn() under the line limit. Returns (error, stopped_by_limit)."""
    sys.settrace(_tracer(user_files, max_lines))
    try:
        fn()
        return None, False
    except (pyquest._EventLimit, _LineLimit):
        return None, True
    except BaseException as exc:  # the child's own error, reported in Vietnamese
        return _error(exc, user_files), False
    finally:
        sys.settrace(None)


def _module_globals(main):
    g = {"__name__": "__main__", "__file__": os.path.join(PROJECT, main), "__builtins__": __builtins__}
    exec("from pyquest import *", g)
    return g


def _run_module(files, main, seed, max_events, max_lines):
    pyquest._reset(seed, max_events)
    user_files = _write_files(files)
    path = os.path.join(PROJECT, main)
    g = _module_globals(main)

    def go():
        with open(path, encoding="utf-8") as f:
            code = compile(f.read(), path, "exec")
        exec(code, g)

    err, stopped = _exec(go, user_files, max_lines)
    return g, user_files, err, stopped


def _result(g, err, stopped):
    out = {"events": pyquest._state["events"], "vars": _vars(g) if g else {}, "stoppedByLimit": stopped}
    if err is not None:
        out["error"] = err
    return json.dumps(out)


def run_script(files_json, main, seed, max_events, max_lines):
    g, _, err, stopped = _run_module(json.loads(files_json), main, seed, max_events, max_lines)
    return _result(g, err, stopped)


def start_game(files_json, main, seed, max_lines):
    g, user_files, err, stopped = _run_module(json.loads(files_json), main, seed, 100000, max_lines)
    if err is None and not stopped and not callable(g.get("update")):
        err = {"type": "PyQuestError", "msg": "missing update", "line": None}
    _game["globals"] = None if err else g
    _game["files"] = user_files
    _game["max_lines"] = max_lines
    return _result(g, err, stopped)


def step(keys_json, tapped):
    g = _game["globals"]
    if g is None:
        return json.dumps({"events": [], "vars": {}, "stoppedByLimit": False,
                           "error": {"type": "PyQuestError", "msg": "not started", "line": None}})
    pyquest._state["events"] = []
    pyquest._state["keys"] = set(json.loads(keys_json))
    pyquest._state["tapped"] = bool(tapped)

    def frame():
        g["update"]()
        if callable(g.get("draw")):
            g["draw"]()
        pyquest._emit({"t": "frame"})

    err, stopped = _exec(frame, _game["files"], _game["max_lines"])
    if err is not None:
        _game["globals"] = None
    return _result(g, err, stopped)
`;
