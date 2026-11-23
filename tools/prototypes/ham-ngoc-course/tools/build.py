"""Course builder: each exercise is the one before it plus small edits, so a fix travels down the whole chain.

ex(...) makes one exercise:
  base    whole starter text (only when the code is not the previous solution + edits)
  prep    [(old, new)]: edits on the previous solution that give the starter (each old must occur once)
  fills   what the child writes, one text per marker line "# Em viết tiếp ở đây"
  sol     [(old, new)]: edits after the fills (lines the child changes away from a marker)
  wrong   [(what is wrong, fills, sol)]: variants that must not pass
Other correct solutions, which must pass too, are in alts.py.
"""
import re

from alts import ALTS

MARK = "# Em viết tiếp ở đây"
EXERCISES = []
STATE = {"code": ""}


def edit(code, changes, where):
    for old, new in changes:
        if code.count(old) != 1:
            raise SystemExit(where + ": " + str(code.count(old)) + " matches for:\n" + old)
        code = code.replace(old, new)
    return code


def fill(code, texts, where):
    parts = re.compile(r"^( *)" + MARK + r"[^\n]*\n((?:\1pass\n)?)", re.M)
    found = list(parts.finditer(code))
    if len(found) != len(texts):
        raise SystemExit(where + ": " + str(len(found)) + " markers, " + str(len(texts)) + " texts")
    numbers = re.findall(MARK + r" \((\d)\)", code)
    if numbers != sorted(numbers):
        raise SystemExit(where + ": markers out of order " + str(numbers))
    out, at = "", 0
    for m, text in zip(found, texts):
        out += code[at:m.start()]
        lines = text.strip("\n").split("\n") if text.strip() else (["pass"] if m.group(2) else [])
        out += "".join((m.group(1) + line if line else "") + "\n" for line in lines)
        at = m.end()
    return out + code[at:]


def close_gaps(code):
    """A marker that ends its block gets a pass: a comment alone there would lose its indent going through blocks."""
    lines = code.split("\n")
    out = []
    for i, line in enumerate(lines):
        out.append(line)
        if line.strip().startswith(MARK) and line[0] == " ":
            indent = len(line) - len(line.lstrip())
            after = lines[i + 1]
            if not after.strip() or len(after) - len(after.lstrip()) != indent:
                out.append(" " * indent + "pass")
    return "\n".join(out)


def ex(id, title, task, walkthrough, hints, goals, base=None, prep=(), fills=(), sol=(), wrong=(), mode="game",
       test=None, new="", reorganised="", input="typing", keep=True):
    starter = base.lstrip("\n") if base is not None else edit(STATE["code"], prep, id)
    starter = close_gaps(starter)
    solution = edit(fill(starter, fills, id), sol, id + " solution")
    variants = []
    for what, wrong_fills, wrong_sol in wrong:
        variants.append((what, edit(fill(starter, wrong_fills, id), wrong_sol, id + " wrong")))
    others = [(what, edit(solution, changes, id + " alt")) for what, changes in ALTS.get(id, [])]
    for i, g in enumerate(goals):
        g["id"] = id + "-" + g.pop("key")
    spec = {"id": id, "title": title, "task": task, "mode": mode, "input": input, "walkthrough": walkthrough,
            "hints": hints}
    if mode == "game":
        spec["test"] = {"frames": test["frames"], "taps": test.get("taps", [])}
        for key in ("keys", "clicks"):
            if key in test:
                spec["test"][key] = test[key]
    spec["goals"] = goals
    spec["new_idea"] = new
    spec["reorganised"] = reorganised
    EXERCISES.append({"id": id, "spec": spec, "starter": starter, "solution": solution, "wrong": variants, "alts": others})
    if keep:
        STATE["code"] = solution


def goal(key, kind, label, **more):
    return {"key": key, "label": label, "kind": kind, **more}


def run_goal():
    return goal("run", "noError", "Chạy không lỗi")


def hold(key, start, end):
    return {"key": key, "from": start, "to": end}
