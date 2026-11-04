// Python → block tree, using Python's own ast. Anything outside the supported subset becomes a raw-code
// block holding the exact source, so a child's code is never lost (ADR 0003).
export const TOBLOCKS_SOURCE = String.raw`
import ast, io, json, re, tokenize

_OPS = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/"}
_CALLS = {"draw_bird": ("pq_draw_bird", ["X", "Y"]), "print": ("pq_print", ["VALUE"]),
          "clear": ("pq_clear", ["COLOR"]), "draw_rect": ("pq_draw_rect", ["X", "Y", "W", "H", "COLOR"])}


_ATOMIC = (ast.Call, ast.Attribute, ast.Subscript, ast.Name, ast.Constant, ast.List, ast.Tuple, ast.Dict,
           ast.Set, ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp, ast.JoinedStr)


def _raw_expr(src, node, nested=False):
    code = ast.get_source_segment(src, node)
    # Inside + - * / a low-precedence expression keeps its brackets, or its meaning would change.
    if nested and not isinstance(node, _ATOMIC):
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
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return {"type": "pq_arith", "fields": {"OP": _OPS[type(node.op)]},
                "inputs": {"A": _expr(src, node.left, True), "B": _expr(src, node.right, True)}}
    return _raw_expr(src, node, nested)


def _stmt(src, node):
    if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
        call = node.value
        spec = _CALLS.get(call.func.id)
        if spec and not call.keywords and len(call.args) == len(spec[1]):
            return {"type": spec[0], "inputs": {name: _expr(src, a) for name, a in zip(spec[1], call.args)}}
    if (isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name)):
        return {"type": "pq_assign", "fields": {"NAME": node.targets[0].id},
                "inputs": {"VALUE": _expr(src, node.value)}}
    return None


def _raw(code):
    return {"type": "pq_raw", "extraState": {"code": code}}


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
    out = []
    covered = 0

    def gap(upto):
        # Comment lines and blank lines between statements are kept as they are.
        for n in range(covered + 1, upto):
            text = lines[n - 1]
            if text.strip() == "" or text.lstrip().startswith("#"):
                out.append(_raw(text.strip()))

    def start_of(node):
        decorators = getattr(node, "decorator_list", [])
        return min([node.lineno] + [d.lineno for d in decorators])

    # Statements sharing a physical line (a; b) form one group, kept as one raw block (review I1).
    groups = []
    for node in tree.body:
        if groups and start_of(node) <= groups[-1][-1].end_lineno:
            groups[-1].append(node)
        else:
            groups.append([node])

    for group in groups:
        first, last = start_of(group[0]), group[-1].end_lineno
        gap(first)
        span = range(first, last + 1)
        block = None
        if len(group) == 1 and first == group[0].lineno and not any(n in comment_lines for n in span):
            block = _stmt(src, group[0])
        out.append(block if block else _raw("\n".join(lines[first - 1:last])))
        covered = last
    gap(len(lines) + 1)
    return json.dumps({"ok": True, "statements": out})
`;
