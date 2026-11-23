"""Which blocks a program becomes, using the repo's own Python → blocks code (read from toblocks.py.ts)."""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
RUNTIME = os.path.join(REPO, "packages", "runtime", "src")


def load():
    with open(os.path.join(RUNTIME, "pyquest", "toblocks.py.ts"), encoding="utf-8") as f:
        text = f.read()
    source = text.split("String.raw`", 1)[1].rsplit("`", 1)[0]
    lists = {}
    for name in ("keys", "sounds"):
        with open(os.path.join(RUNTIME, name + ".ts"), encoding="utf-8") as f:
            for m in re.finditer(r"export const (\w+) = (\[[^\]]*\]) as const", f.read()):
                lists[m.group(1)] = m.group(2).replace("'", '"')
    for name, value in lists.items():
        source = source.replace("${JSON.stringify(" + name + ")}", value)
    g = {}
    exec(compile(source, "toblocks", "exec"), g)
    return g["to_blocks"]


to_blocks = load()


def walk(nodes, types, raw):
    for n in nodes:
        if n["type"] == "pq_raw":
            code = n["extraState"]["code"]
            if code.strip() and not code.strip().startswith("#") and code.strip() != "pass":
                raw.append(code.strip())
        elif n["type"] == "pq_raw_expr":
            raw.append(n["fields"]["CODE"])
        elif n["type"] not in ("pq_call", "pq_call_expr"):
            types.add(n["type"])
        walk(list(n.get("inputs", {}).values()), types, raw)
        for body in n.get("statements", {}).values():
            walk(body, types, raw)


def describe(starter, solution):
    types, raw = set(), []
    for code in (starter, solution):
        tree = json.loads(to_blocks(code))
        if not tree["ok"]:
            raise SystemExit("does not parse: " + tree["msg"] + "\n" + code)
        walk(tree["statements"], types, raw)
    return {"toolbox": sorted(types), "code_text": sorted(set(raw))}
