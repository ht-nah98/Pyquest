"""Writes every exercise folder (hNN/eK/{starter,solution,wrongN}.py + spec.json). Run: python3 -B tools/make.py"""
import json
import os
import shutil
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build  # noqa: E402
for name in ("src1", "src2", "src3"):
    if os.path.exists(os.path.join(HERE, name + ".py")):
        __import__(name)
import blocks  # noqa: E402

OUT = os.path.dirname(HERE)


def main():
    for old in os.listdir(OUT):
        if old[0] == "h" and old[1:].isdigit():
            shutil.rmtree(os.path.join(OUT, old))
    for e in build.EXERCISES:
        lesson, part = e["id"].split("-")
        folder = os.path.join(OUT, lesson, part)
        os.makedirs(folder)
        found = blocks.describe(e["starter"], e["solution"])
        e["spec"]["toolbox"] = found["toolbox"]
        e["spec"]["blocks_expected"] = {"code_text": found["code_text"]}
        files = {"starter.py": e["starter"], "solution.py": e["solution"],
                 "spec.json": json.dumps(e["spec"], ensure_ascii=False, indent=2) + "\n"}
        for i, (what, code) in enumerate(e["wrong"]):
            files["wrong" + str(i + 1) + ".py"] = code
        e["spec"]["wrong"] = [w for w, _ in e["wrong"]]
        files["spec.json"] = json.dumps(e["spec"], ensure_ascii=False, indent=2) + "\n"
        for name, text in files.items():
            with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
                f.write(text)
    print(len(build.EXERCISES), "exercises")


main()
