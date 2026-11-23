// Python → block tree, using Python's own ast. Anything outside the supported subset becomes a raw-code
// block holding the exact source, so a child's code is never lost (ADR 0003).
import { KEYS } from '../keys';
import { MUSIC, SOUNDS } from '../sounds';

export const TOBLOCKS_SOURCE = String.raw`
import ast, io, json, re, tokenize

_OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/", ast.Mod: "%"}
# Functions defined in the file being converted: name -> parameters (set by to_blocks).
_DEFS = {}
_CALLS = {"print": ("pq_print", ["VALUE"]), "clear": ("pq_clear", ["COLOR"]),
          "draw_rect": ("pq_draw_rect", ["X", "Y", "W", "H", "COLOR"]),
          "draw_image": ("pq_draw_image", ["PATH", "X", "Y"]), "draw_text": ("pq_draw_text", ["TEXT", "X", "Y"]),
          "draw_circle": ("pq_draw_circle", ["X", "Y", "R", "COLOR"]),
          "draw_line": ("pq_draw_line", ["X1", "Y1", "X2", "Y2", "COLOR"]),
          "draw_triangle": ("pq_draw_triangle", ["X1", "Y1", "X2", "Y2", "X3", "Y3", "COLOR"])}
_SOUNDS = ${JSON.stringify(SOUNDS)}
_MUSIC = ${JSON.stringify(MUSIC)}
_KEYS = ${JSON.stringify(KEYS)}
_POINTER = {"mouse_x": "pq_mouse_x", "mouse_y": "pq_mouse_y", "clicked": "pq_clicked"}
_CMP = {ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">="}
_AUG = {ast.Add: "+=", ast.Sub: "-="}


def _between(src, start, end):
    """The text from one (line, column) to another."""
    return ast.get_source_segment(src, ast.Pass(lineno=start[0], col_offset=start[1],
                                                end_lineno=end[0], end_col_offset=end[1])) or ""


def _raw_expr(src, node, parent=None):
    """Code text with exactly the brackets typed around it inside its parent: -a + b, (a ** 2) + 1."""
    code = ast.get_source_segment(src, node)
    typed = False
    if parent is not None:
        before = _between(src, (parent.lineno, parent.col_offset), (node.lineno, node.col_offset)).rstrip()
        after = _between(src, (node.end_lineno, node.end_col_offset),
                         (parent.end_lineno, parent.end_col_offset)).lstrip()
        while before.endswith("(") and after.startswith(")"):
            code, typed = "(" + code + ")", True
            before, after = before[:-1].rstrip(), after[1:].lstrip()
    if not typed and not isinstance(node, ast.Starred):
        try:
            ast.parse(code, mode="eval")
        except SyntaxError:  # only valid inside its brackets: y := 1, code that goes on on the next line
            code = "(" + code + ")"
    return {"type": "pq_raw_expr", "fields": {"CODE": code}}


_INT = re.compile(r"-?[0-9]+")
# Decimals the number block writes back exactly as typed: 0.5, -2.25 (not 1.0, 0.50, 1e-7).
_DECIMAL = re.compile(r"-?(0|[1-9][0-9]{0,8})\.[0-9]{0,5}[1-9]")


def _plain_string(src, node):
    """A string block only when regenerating it gives back the same characters (review I1)."""
    seg = ast.get_source_segment(src, node) or ""
    v = node.value
    return (seg == '"' + v + '"' and '"' not in v and "\\" not in v and "\n" not in v)


def _as_typed(src, node):
    """True when the code is written the way blocks write it (one line, the usual spaces and brackets), so a
    block made from it gives back the same characters. Anything else stays code text (ADR 0011)."""
    seg = ast.get_source_segment(src, node) or ""
    return ast.unparse(node).replace("'", '"') == seg.replace("'", '"')


def _named_slot(src, node):
    """("mob", "x") for mob["x"] typed just so, else None (xs[i], xs['a'], mobs[0]["x"])."""
    if not (isinstance(node, ast.Subscript) and isinstance(node.value, ast.Name)
            and isinstance(node.slice, ast.Constant) and isinstance(node.slice.value, str)
            and _plain_string(src, node.slice)):
        return None
    name, key = node.value.id, node.slice.value
    return (name, key) if ast.get_source_segment(src, node) == name + '["' + key + '"]' else None


def _expr(src, node, parent=None):
    seg = ast.get_source_segment(src, node) or ""
    if isinstance(node, ast.Constant) and isinstance(node.value, bool) and seg in ("True", "False"):
        return {"type": "pq_bool", "fields": {"BOOL": seg}}
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
        return {"type": "pq_not", "inputs": {"A": _expr(src, node.operand, node)}}
    # Number blocks only for plain whole numbers; 1.0, 0x10, 1e3 stay as typed (review I1).
    if _INT.fullmatch(seg) and len(seg.lstrip("-")) <= 15:
        return {"type": "pq_number", "fields": {"NUM": int(seg)}}
    if _DECIMAL.fullmatch(seg):
        return {"type": "pq_number", "fields": {"NUM": float(seg)}}
    if isinstance(node, ast.Constant) and isinstance(node.value, str) and _plain_string(src, node):
        return {"type": "pq_text", "fields": {"TEXT": node.value}}
    if isinstance(node, ast.Name):
        return {"type": "pq_var_get", "fields": {"NAME": node.id}}
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and type(node.ops[0]) in _CMP:
        return {"type": "pq_compare", "fields": {"OP": _CMP[type(node.ops[0])]},
                "inputs": {"A": _expr(src, node.left, node), "B": _expr(src, node.comparators[0], node)}}
    if isinstance(node, ast.BoolOp) and not any(isinstance(v, ast.BoolOp) for v in node.values):
        # a and b and c → (a and b) and c: the generator writes a same-op left side without brackets.
        op = "and" if isinstance(node.op, ast.And) else "or"
        block = _expr(src, node.values[0], node)
        for v in node.values[1:]:
            block = {"type": "pq_logic", "fields": {"OP": op}, "inputs": {"A": block, "B": _expr(src, v, node)}}
        return block
    if isinstance(node, ast.List):
        return {"type": "pq_list", "extraState": {"items": len(node.elts)},
                "inputs": {"ITEM" + str(i): _expr(src, e) for i, e in enumerate(node.elts)}}
    if (isinstance(node, ast.Dict) and _as_typed(src, node)
            and all(isinstance(k, ast.Constant) and isinstance(k.value, str) and _plain_string(src, k)
                    for k in node.keys)):
        return {"type": "pq_dict", "extraState": {"items": len(node.keys)},
                "fields": {"KEY" + str(i): k.value for i, k in enumerate(node.keys)},
                "inputs": {"ITEM" + str(i): _expr(src, v) for i, v in enumerate(node.values)}}
    slot = _named_slot(src, node)
    if slot is not None:
        return {"type": "pq_key_get", "fields": {"NAME": slot[0], "KEY": slot[1]}}
    if (isinstance(node, ast.Subscript) and isinstance(node.value, ast.Name)
            and not isinstance(node.slice, (ast.Slice, ast.Tuple))):
        return {"type": "pq_index", "fields": {"NAME": node.value.id}, "inputs": {"INDEX": _expr(src, node.slice)}}
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
        if node.func.id == "len" and len(node.args) == 1:
            return {"type": "pq_len", "inputs": {"A": _expr(src, node.args[0])}}
        if node.func.id == "key_pressed" and not node.args:
            return {"type": "pq_key_pressed"}
        # A name the child gave to a def of their own stays a call of that def (below).
        if (node.func.id == "key_pressed" and "key_pressed" not in _DEFS and len(node.args) == 1
                and isinstance(node.args[0], ast.Constant) and node.args[0].value in _KEYS
                and seg == 'key_pressed("' + node.args[0].value + '")'):
            return {"type": "pq_key_held", "fields": {"KEY": node.args[0].value}}
        if node.func.id in _POINTER and node.func.id not in _DEFS and seg == node.func.id + "()":
            return {"type": _POINTER[node.func.id]}
        if node.func.id == "str" and len(node.args) == 1:
            return {"type": "pq_str", "inputs": {"A": _expr(src, node.args[0])}}
        if node.func.id == "abs" and "abs" not in _DEFS and len(node.args) == 1 and _as_typed(src, node):
            return {"type": "pq_abs", "inputs": {"A": _expr(src, node.args[0])}}
        if node.func.id == "random_int" and len(node.args) == 2:
            return {"type": "pq_random", "inputs": {"A": _expr(src, node.args[0]), "B": _expr(src, node.args[1])}}
        params = _DEFS.get(node.func.id)
        if params is not None and len(node.args) == len(params):
            return {"type": "pq_call_expr", "extraState": {"name": node.func.id, "params": params},
                    "inputs": {"ARG" + str(i): _expr(src, a) for i, a in enumerate(node.args)}}
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return {"type": "pq_arith", "fields": {"OP": _OPS[type(node.op)]},
                "inputs": {"A": _expr(src, node.left, node), "B": _expr(src, node.right, node)}}
    return _raw_expr(src, node, parent)


def _simple_params(node):
    """The parameter names of "def f(a, b):", or None when it has defaults, *args, types…"""
    a = node.args
    if (node.decorator_list or node.returns is not None or a.posonlyargs or a.kwonlyargs or a.vararg
            or a.kwarg or a.defaults or any(p.annotation is not None for p in a.args)):
        return None
    return [p.arg for p in a.args]


class _Ctx:
    def __init__(self, src, lines, comments, texts, defs):
        self.src, self.lines, self.comments = src, lines, comments
        # Lines where a word of several lines (""" """) starts: its own spaces must never be indented.
        self.texts = texts
        # Functions the child defined in this file: name -> parameters. Their calls become call blocks.
        self.defs = defs

    def has_comment(self, first, last):
        return any(n in self.comments for n in range(first, last + 1))

    def only_blank_or_comment(self, first, last):
        return all(self.lines[n - 1].strip() == "" or self.lines[n - 1].lstrip().startswith("#")
                   for n in range(first, last + 1))


def _range_args(node):
    it = node.iter
    if (isinstance(it, ast.Call) and isinstance(it.func, ast.Name) and it.func.id == "range"
            and not it.keywords and 1 <= len(it.args) <= 2):
        return it.args
    return None


def _else_line(ctx, node):
    """The line of else: for an if/else, or None when it is an elif or not found."""
    start = node.body[-1].end_lineno + 1
    for n in range(start, node.orelse[0].lineno + 1):
        text = ctx.lines[n - 1].strip()
        if text.startswith("elif"):
            return None
        if text.startswith("else") and text.rstrip().endswith(":") and text.replace(" ", "") == "else:":
            return n
    return None


def _elif_chain(ctx, node):
    """if / elif … / else as ([(test, body, header line)], else body, else line), or None if not a chain."""
    branches = [(node.test, node.body, node.lineno)]
    cur = node
    while len(cur.orelse) == 1 and isinstance(cur.orelse[0], ast.If):
        nxt = cur.orelse[0]
        if not ctx.lines[nxt.lineno - 1].lstrip().startswith("elif"):
            break
        if (ctx.has_comment(cur.body[-1].end_lineno + 1, nxt.lineno)
                or not ctx.only_blank_or_comment(nxt.lineno + 1, nxt.body[0].lineno - 1)):
            return None
        branches.append((nxt.test, nxt.body, nxt.lineno))
        cur = nxt
    if len(branches) == 1:
        return None
    if not cur.orelse:
        return branches, None, None
    else_at = _else_line(ctx, cur)
    if else_at is None or ctx.has_comment(cur.body[-1].end_lineno + 1, else_at):
        return None
    return branches, cur.orelse, else_at


def _stmt(ctx, node):
    src = ctx.src
    header_end = node.body[0].lineno - 1 if hasattr(node, "body") and isinstance(node.body, list) else None
    if header_end is not None:
        # Compound statement: one-line header, no comment on it; bodies are converted recursively.
        if any(node.lineno <= n <= node.end_lineno for n in ctx.texts):
            return None
        if ctx.has_comment(node.lineno, node.lineno) or not ctx.only_blank_or_comment(node.lineno + 1, header_end):
            return None
        if isinstance(node, ast.For) and not node.orelse and isinstance(node.target, ast.Name):
            args = _range_args(node)
            if args is None:
                return {"type": "pq_for_each", "fields": {"VAR": node.target.id},
                        "inputs": {"LIST": _expr(src, node.iter)},
                        "statements": {"DO": _body(ctx, node.body, node.lineno)}}
            do = _body(ctx, node.body, node.lineno)
            if len(args) == 1:
                return {"type": "pq_for", "fields": {"VAR": node.target.id},
                        "inputs": {"COUNT": _expr(src, args[0])}, "statements": {"DO": do}}
            return {"type": "pq_for_range", "fields": {"VAR": node.target.id},
                    "inputs": {"FROM": _expr(src, args[0]), "TO": _expr(src, args[1])}, "statements": {"DO": do}}
        if isinstance(node, ast.If) and _elif_chain(ctx, node) is not None:
            branches, else_body, else_at = _elif_chain(ctx, node)
            block = {"type": "pq_if_chain", "extraState": {"elifs": len(branches) - 1, "else": else_body is not None},
                     "inputs": {}, "statements": {}}
            for i, (test, body, line) in enumerate(branches):
                block["inputs"]["COND" + str(i)] = _expr(src, test)
                block["statements"]["DO" + str(i)] = _body(ctx, body, line)
            if else_body is not None:
                block["statements"]["ELSE"] = _body(ctx, else_body, else_at)
            return block
        if isinstance(node, ast.While) and not node.orelse:
            return {"type": "pq_while", "inputs": {"COND": _expr(src, node.test)},
                    "statements": {"DO": _body(ctx, node.body, node.lineno)}}
        if isinstance(node, ast.If):
            cond = _expr(src, node.test)
            if not node.orelse:
                return {"type": "pq_if", "inputs": {"COND": cond}, "statements": {"DO": _body(ctx, node.body, node.lineno)}}
            else_at = _else_line(ctx, node)
            if else_at is None or ctx.has_comment(node.body[-1].end_lineno + 1, else_at):
                return None
            return {"type": "pq_if_else", "inputs": {"COND": cond},
                    "statements": {"DO": _body(ctx, node.body, node.lineno),
                                   "ELSE": _body(ctx, node.orelse, else_at)}}
        if isinstance(node, ast.FunctionDef) and _simple_params(node) is not None:
            return {"type": "pq_def", "fields": {"NAME": node.name, "PARAMS": ", ".join(_simple_params(node))},
                    "statements": {"BODY": _body(ctx, node.body, node.lineno)}}
        return None

    if ctx.has_comment(node.lineno, node.end_lineno):
        return None
    # A table (dict, list of dicts) over several lines: the whole statement is code text, line by line.
    if node.end_lineno > node.lineno and any(isinstance(n, ast.Dict) for n in ast.walk(node)):
        return None
    if (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
            and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == "append"
            and isinstance(node.value.func.value, ast.Name) and len(node.value.args) == 1
            and not node.value.keywords):
        return {"type": "pq_append", "fields": {"NAME": node.value.func.value.id},
                "inputs": {"VALUE": _expr(src, node.value.args[0])}}
    if (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
            and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == "remove"
            and isinstance(node.value.func.value, ast.Name) and len(node.value.args) == 1
            and not node.value.keywords and _as_typed(src, node)):
        return {"type": "pq_remove", "fields": {"NAME": node.value.func.value.id},
                "inputs": {"VALUE": _expr(src, node.value.args[0])}}
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
        call = node.value
        spec = _CALLS.get(call.func.id)
        flip = (call.func.id == "draw_image" and len(call.keywords) == 1 and call.keywords[0].arg == "flip"
                and isinstance(call.keywords[0].value, ast.Constant) and call.keywords[0].value.value is True)
        if spec and (not call.keywords or flip) and len(call.args) == len(spec[1]):
            block = {"type": spec[0], "inputs": {name: _expr(src, a) for name, a in zip(spec[1], call.args)}}
            if spec[0] == "pq_draw_image":
                block["fields"] = {"FLIP": "TRUE" if flip else "FALSE"}
            return block
        if (call.func.id == "draw_image" and "draw_image" not in ctx.defs and len(call.args) == 3
                and [k.arg for k in call.keywords] == ["scale"] and _as_typed(src, node)):
            return {"type": "pq_draw_image_scale",
                    "inputs": {n: _expr(src, a) for n, a in zip(["PATH", "X", "Y", "SCALE"],
                                                                [*call.args, call.keywords[0].value])}}
        if call.func.id == "draw_text" and not call.keywords and len(call.args) == 4:
            return {"type": "pq_draw_text_size",
                    "inputs": {n: _expr(src, a) for n, a in zip(["TEXT", "X", "Y", "SIZE"], call.args)}}
        if call.func.id == "draw_line" and not call.keywords and len(call.args) == 6:
            return {"type": "pq_draw_line_width",
                    "inputs": {n: _expr(src, a) for n, a in zip(["X1", "Y1", "X2", "Y2", "COLOR", "WIDTH"], call.args)}}
        # Sounds: a block only for a name on the list; a typo stays raw so Python can say which name was meant.
        named = (len(call.args) == 1 and not call.keywords and isinstance(call.args[0], ast.Constant)
                 and isinstance(call.args[0].value, str))
        if call.func.id == "play_sound" and named and call.args[0].value in _SOUNDS:
            return {"type": "pq_play_sound", "fields": {"SOUND": call.args[0].value}}
        if call.func.id == "play_music" and named and call.args[0].value in _MUSIC:
            return {"type": "pq_play_music", "fields": {"MUSIC": call.args[0].value}}
        if call.func.id == "stop_music" and not call.args and not call.keywords:
            return {"type": "pq_stop_music"}
        params = ctx.defs.get(call.func.id)
        if params is not None and not call.keywords and len(call.args) == len(params):
            return {"type": "pq_call", "extraState": {"name": call.func.id, "params": params},
                    "inputs": {"ARG" + str(i): _expr(src, a) for i, a in enumerate(call.args)}}
    if isinstance(node, ast.Return):
        # A bare return (stop here) is the same block with its slot left empty.
        if node.value is None:
            return {"type": "pq_return"}
        return {"type": "pq_return", "inputs": {"VALUE": _expr(src, node.value)}}
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        return {"type": "pq_assign", "fields": {"NAME": node.targets[0].id},
                "inputs": {"VALUE": _expr(src, node.value)}}
    if isinstance(node, ast.Assign) and len(node.targets) == 1:
        t = node.targets[0]
        slot = _named_slot(src, t)
        if slot is not None:
            return {"type": "pq_key_set", "fields": {"NAME": slot[0], "KEY": slot[1]},
                    "inputs": {"VALUE": _expr(src, node.value)}}
        if (isinstance(t, ast.Subscript) and isinstance(t.value, ast.Name)
                and not isinstance(t.slice, (ast.Slice, ast.Tuple))):
            return {"type": "pq_index_set", "fields": {"NAME": t.value.id},
                    "inputs": {"INDEX": _expr(src, t.slice), "VALUE": _expr(src, node.value)}}
    if isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name) and type(node.op) in _AUG:
        return {"type": "pq_aug", "fields": {"NAME": node.target.id, "OP": _AUG[type(node.op)]},
                "inputs": {"VALUE": _expr(src, node.value)}}
    if (isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Subscript)
            and isinstance(node.target.value, ast.Name) and type(node.op) in _AUG
            and not isinstance(node.target.slice, (ast.Slice, ast.Tuple)) and _as_typed(src, node)):
        return {"type": "pq_key_aug", "fields": {"NAME": node.target.value.id, "OP": _AUG[type(node.op)]},
                "inputs": {"INDEX": _expr(src, node.target.slice), "VALUE": _expr(src, node.value)}}
    if (isinstance(node, ast.ImportFrom) and node.module == "pyquest" and node.level == 0
            and [a.name for a in node.names] == ["*"]):
        return {"type": "pq_import"}
    if isinstance(node, ast.Global):
        return {"type": "pq_global", "fields": {"NAMES": ", ".join(node.names)}}
    return None


def _raw(code):
    return {"type": "pq_raw", "extraState": {"code": code}}


# Blocks since ADR 0010: their statement is code text unless it is typed the way the blocks write it.
_EXACT = {"pq_key_held", "pq_mouse_x", "pq_mouse_y", "pq_clicked", "pq_dict", "pq_key_get", "pq_key_set",
          "pq_key_aug", "pq_abs", "pq_remove", "pq_draw_image_scale"}


def _with_inputs(block):
    yield block
    for child in block.get("inputs", {}).values():
        yield from _with_inputs(child)


def _keeps_text(ctx, node, block):
    """False when the block would lose a ; at the end, or indent the next lines of some code text again and again."""
    if "statements" in block:
        return True
    parts = list(_with_inputs(block))
    after = ctx.lines[node.end_lineno - 1].encode()[node.end_col_offset:].decode()
    if after.strip().startswith(";") and any(b["type"] in _EXACT for b in parts):
        return False
    return node.col_offset == 0 or not any(
        b["type"] == "pq_raw_expr" and "\n" in b["fields"]["CODE"] for b in parts)


def _start_of(node):
    decorators = getattr(node, "decorator_list", [])
    return min([node.lineno] + [d.lineno for d in decorators])


def _body(ctx, body, covered, trailing=False):
    """Blocks for a statement list. covered = last line already used (the header line).
    Raw text is dedented to the body's indentation so the generator can indent it again."""
    indent = body[0].col_offset
    out = []

    def dedent(text):
        return "\n".join(l[indent:] if l[:indent].strip() == "" else l.lstrip() for l in text.split("\n"))

    def gap(upto):
        for n in range(covered + 1, upto):
            text = ctx.lines[n - 1]
            if text.strip() == "" or text.lstrip().startswith("#"):
                out.append(_raw(text.strip()))

    # Statements sharing a physical line (a; b) form one group, kept as one raw block (review I1).
    groups = []
    for node in body:
        if groups and _start_of(node) <= groups[-1][-1].end_lineno:
            groups[-1].append(node)
        else:
            groups.append([node])
    for group in groups:
        first, last = _start_of(group[0]), group[-1].end_lineno
        gap(first)
        block = _stmt(ctx, group[0]) if len(group) == 1 and first == group[0].lineno else None
        if block and not _keeps_text(ctx, group[0], block):
            block = None
        text = ctx.lines[first - 1:last]
        if first <= covered:  # on the line of the header: if a: import math
            text[0] = text[0].encode()[group[0].col_offset:].decode()
        out.append(block if block else _raw(dedent("\n".join(text))))
        covered = last
    if trailing:
        gap(len(ctx.lines) + 1)
    return out


def to_blocks(src):
    try:
        tree = ast.parse(src)
    except SyntaxError as exc:
        return json.dumps({"ok": False, "type": type(exc).__name__, "msg": exc.msg, "line": exc.lineno})
    lines = src.splitlines()
    comment_lines, text_lines = set(), set()
    texts = (tokenize.STRING, tokenize.FSTRING_MIDDLE)
    try:
        for tok in tokenize.generate_tokens(io.StringIO(src).readline):
            if tok.type == tokenize.COMMENT:
                comment_lines.add(tok.start[0])
            elif tok.type in texts and tok.start[0] != tok.end[0]:
                text_lines.add(tok.start[0])
    except (tokenize.TokenError, SyntaxError):
        pass
    defs = {}
    for n in ast.walk(tree):
        if isinstance(n, ast.FunctionDef) and _simple_params(n) is not None:
            defs[n.name] = _simple_params(n)
    _DEFS.clear()
    _DEFS.update(defs)
    ctx = _Ctx(src, lines, comment_lines, text_lines, defs)
    if not tree.body:
        out = [_raw(l.strip()) for l in lines if l.strip() == "" or l.lstrip().startswith("#")]
        return json.dumps({"ok": True, "statements": out})
    return json.dumps({"ok": True, "statements": _body(ctx, tree.body, 0, trailing=True)})
`;
