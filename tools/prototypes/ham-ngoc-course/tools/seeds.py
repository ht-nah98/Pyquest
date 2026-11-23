"""How safe are the thresholds? Grades every game exercise with other random seeds: a correct solution that draws
random numbers in another order is like another seed. python3 -B tools/seeds.py [seeds=30] [h05 …]"""
import sys

sys.dont_write_bytecode = True
import check  # noqa: E402
import grader  # noqa: E402

count = int(sys.argv[1]) if len(sys.argv) > 1 else 30
want = sys.argv[2:]
for spec, files in check.load():
    if spec["mode"] != "game" or (want and spec["id"][:3] not in want):
        continue
    misses, escapes = {}, {}
    real = grader.run_code
    for seed in range(1, count + 1):
        grader.run_code = lambda *a, **k: real(*a, **dict(k, seed=seed))
        _, m = grader.grade(files["solution.py"], spec, files["solution.py"])
        for g in m:
            misses[g] = misses.get(g, 0) + 1
        for name in files:
            if name.startswith("wrong"):
                _, w = grader.grade(files[name], spec, files["solution.py"])
                if not w:
                    escapes[name] = escapes.get(name, 0) + 1
    grader.run_code = real
    if misses or escapes:
        print(spec["id"], "solution misses", misses, "wrong passes", escapes, flush=True)
print("done", count)
