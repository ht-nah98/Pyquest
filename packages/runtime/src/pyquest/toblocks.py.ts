// Python → block tree, using Python's own ast. Anything outside the supported subset becomes a raw-code
// block holding the exact source, so a child's code is never lost (ADR 0003).
export const TOBLOCKS_SOURCE = String.raw`
import ast, io, json, re, tokenize

_OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/"}
_CALLS = {"draw_bird": ("pq_draw_bird", ["X", "Y"]), "print": ("pq_print", ["VALUE"]),
          "clear": ("pq_clear", ["COLOR"]), "draw_rect": ("pq_draw_rect", ["X", "Y", "W", "H", "COLOR"]),
          "draw_sprite": ("pq_draw_sprite", ["NAME", "X", "Y"]), "use_sprite": ("pq_use_sprite", ["NAME", "PATH"]), "draw_text": ("pq_draw_text", ["TEXT", "X", "Y"])}
_CMP = {ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">="}
_AUG = {ast.Add: "+=", ast.Sub: "-="}


_ATOMIC = (ast.Call, ast.Attribute, ast.Subscript, ast.Name, ast.Constant, ast.List, ast.Tuple, ast.Dict,
           ast.Set, ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp, ast.JoinedStr)


_BINDS_LOOSER_THAN_AND = (ast.BoolOp, ast.IfExp, ast.Lambda, ast.NamedExpr)


def _raw_expr(src, node, nested=False):
    code = ast.get_source_segment(src, node)
    # Keep the brackets an expression needs where it sits, or its meaning would change:
    # inside + - * / anything non-atomic; inside and/or only what binds looser than "and".
    if (nested == "logic" and isinstance(node, _BINDS_LOOSER_THAN_AND)) or (
            nested is True and not isinstance(node, _ATOMIC)):
        code = "(" + code + ")"
    return {"type": "pq_raw_expr", "fields": {"CODE": code}}


_INT = re.compile(r"-?[0-9]+")


def _plain_string(src, node):
    """A string block only when regenerating it gives back the same characters (review I1)."""
    seg = ast.get_source_segment(src, node) or ""
    v = node.value
    return (seg == '"' + v + '"' and '"' not in v and "\\" not in v and "\n" not in v)


def _expr(src, node, nested=False):
    seg = ast.get_source_segment(src, node) or ""
    # Number blocks only for plain whole numbers; 1.0, 0x10, 1e3 stay as typed (review I1).
    if _INT.fullmatch(seg) and len(seg.lstrip("-")) <= 15:
        return {"type": "pq_number", "fields": {"NUM": int(seg)}}
    if isinstance(node, ast.Constant) and isinstance(node.value, str) and _plain_string(src, node):
        return {"type": "pq_text", "fields": {"TEXT": node.value}}
    if isinstance(node, ast.Name):
        return {"type": "pq_var_get", "fields": {"NAME": node.id}}
    if isinstance(node, ast.Compare) and len(node.ops) == 1 and type(node.ops[0]) in _CMP:
        return {"type": "pq_compare", "fields": {"OP": _CMP[type(node.ops[0])]},
                "inputs": {"A": _expr(src, node.left, True), "B": _expr(src, node.comparators[0], True)}}
    if (isinstance(node, ast.BoolOp) and len(node.values) == 2
            and not any(isinstance(v, ast.BoolOp) for v in node.values)):
        return {"type": "pq_logic", "fields": {"OP": "and" if isinstance(node.op, ast.And) else "or"},
                "inputs": {"A": _expr(src, node.values[0], "logic"), "B": _expr(src, node.values[1], "logic")}}
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
        if node.func.id == "key_pressed" and not node.args:
            return {"type": "pq_key_pressed"}
        if node.func.id == "random_int" and len(node.args) == 2:
            return {"type": "pq_random", "inputs": {"A": _expr(src, node.args[0]), "B": _expr(src, node.args[1])}}
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return {"type": "pq_arith", "fields": {"OP": _OPS[type(node.op)]},
                "inputs": {"A": _expr(src, node.left, True), "B": _expr(src, node.right, True)}}
    return _raw_expr(src, node, nested)


class _Ctx:
    def __init__(self, src, lines, comments):
        self.src, self.lines, self.comments = src, lines, comments

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


def _stmt(ctx, node):
    src = ctx.src
    header_end = node.body[0].lineno - 1 if hasattr(node, "body") and isinstance(node.body, list) else None
    if header_end is not None:
        # Compound statement: one-line header, no comment on it; bodies are converted recursively.
        if ctx.has_comment(node.lineno, node.lineno) or not ctx.only_blank_or_comment(node.lineno + 1, header_end):
            return None
        if isinstance(node, ast.For) and not node.orelse and isinstance(node.target, ast.Name):
            args = _range_args(node)
            if args is None:
                return None
            do = _body(ctx, node.body, node.lineno)
            if len(args) == 1:
                return {"type": "pq_for", "fields": {"VAR": node.target.id},
                        "inputs": {"COUNT": _expr(src, args[0])}, "statements": {"DO": do}}
            return {"type": "pq_for_range", "fields": {"VAR": node.target.id},
                    "inputs": {"FROM": _expr(src, args[0]), "TO": _expr(src, args[1])}, "statements": {"DO": do}}
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
        if (isinstance(node, ast.FunctionDef) and not node.decorator_list and node.returns is None
                and not node.args.args and not node.args.posonlyargs and not node.args.kwonlyargs
                and node.args.vararg is None and node.args.kwarg is None):
            return {"type": "pq_def", "fields": {"NAME": node.name}, "statements": {"BODY": _body(ctx, node.body, node.lineno)}}
        return None

    if ctx.has_comment(node.lineno, node.end_lineno):
        return None
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
        call = node.value
        spec = _CALLS.get(call.func.id)
        if spec and not call.keywords and len(call.args) == len(spec[1]):
            return {"type": spec[0], "inputs": {name: _expr(src, a) for name, a in zip(spec[1], call.args)}}
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        return {"type": "pq_assign", "fields": {"NAME": node.targets[0].id},
                "inputs": {"VALUE": _expr(src, node.value)}}
    if isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name) and type(node.op) in _AUG:
        return {"type": "pq_aug", "fields": {"NAME": node.target.id, "OP": _AUG[type(node.op)]},
                "inputs": {"VALUE": _expr(src, node.value)}}
    if isinstance(node, ast.Global):
        return {"type": "pq_global", "fields": {"NAMES": ", ".join(node.names)}}
    return None


def _raw(code):
    return {"type": "pq_raw", "extraState": {"code": code}}


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
        out.append(block if block else _raw(dedent("\n".join(ctx.lines[first - 1:last]))))
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
    comment_lines = set()
    try:
        for tok in tokenize.generate_tokens(io.StringIO(src).readline):
            if tok.type == tokenize.COMMENT:
                comment_lines.add(tok.start[0])
    except (tokenize.TokenError, SyntaxError):
        pass
    ctx = _Ctx(src, lines, comment_lines)
    if not tree.body:
        out = [_raw(l.strip()) for l in lines if l.strip() == "" or l.lstrip().startswith("#")]
        return json.dumps({"ok": True, "statements": out})
    return json.dumps({"ok": True, "statements": _body(ctx, tree.body, 0, trailing=True)})
`;
