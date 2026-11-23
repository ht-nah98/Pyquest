"""A simple player for the finished game: keeps away from monsters, walks to gems, takes random or planned cards.
python3 -B tools/bot.py [exercise=h18/e3] [games=20]"""
import os
import random
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import grader  # noqa: E402
from grader import pyquest  # noqa: E402

MOVES = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)]


def choose(g):
    hero, best, pick = g["hero"], None, (0, 0)
    for dx, dy in MOVES:
        x = min(576, max(24, hero["x"] + dx * 24))
        y = min(576, max(24, hero["y"] + dy * 24))
        score = -(abs(x - 300) + abs(y - 300)) * 0.02
        for mob in g["mobs"]:
            far = abs(mob["x"] - x) + abs(mob["y"] - y) - 10 * mob["size"]
            score -= 4000 / (max(far, 8) ** 1.7)
        gems = [abs(q["x"] - x) + abs(q["y"] - y) for q in g["gems"]]
        if gems:
            score -= min(gems) * 0.02
        if best is None or score > best:
            best, pick = score, (dx, dy)
    return pick


def play(code, hero, seed, frames=12000, plan="random", slow=6, noise=0.0):
    grader.reset(seed)
    g = {"__name__": "__main__"}
    exec(code, g)
    rnd = random.Random(seed)
    keys = set()
    for f in range(frames):
        screen = g["screen"]
        if screen == "title":
            keys = {str(hero)} if f % 2 == 0 else set()
        elif screen == "cards":
            n = rnd.randint(1, 3)
            if plan != "random":
                for i, card in enumerate(g["cards"]):
                    if card["branch"] == plan:
                        n = i + 1
            keys = {str(n)} if f % 4 == 0 else set()
        elif screen == "play":
            if plan == "still":
                keys = set()
            elif f % slow == 0 or not keys & {"left", "right", "up", "down"}:
                dx, dy = choose(g)
                if rnd.random() < noise:
                    dx, dy = rnd.choice(MOVES)
                keys = set()
                if dx:
                    keys.add("left" if dx < 0 else "right")
                if dy:
                    keys.add("up" if dy < 0 else "down")
        else:
            return screen, g["tick"], g["wave"], g["level"], g["kills"], g["hero"]["hp"]
        pyquest.S.update(events=[], keys=keys, tapped=False, mouse=(0, 0), clicked=False)
        g["update"]()
        g["draw"]()
    return "timeout", g["tick"], g["wave"], g["level"], g["kills"], g["hero"]["hp"]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "h18/e3"
    games = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    with open(os.path.join(os.path.dirname(HERE), path, "solution.py"), encoding="utf-8") as f:
        code = compile(f.read(), "main.py", "exec")
    players = [("good", "random", 6, 0), ("good", "fire", 6, 0), ("good", "ice", 6, 0), ("good", "spark", 6, 0),
               ("beginner", "random", 30, 0.35), ("standing", "still", 6, 0)]
    for who, plan, slow, noise in players:
        for hero in (1, 2, 3):
            out = [play(code, hero, seed, plan=plan, slow=slow, noise=noise) for seed in range(1, games + 1)]
            wins = [o for o in out if o[0] == "win"]
            mean = lambda i: round(sum(o[i] for o in out) / len(out), 1)  # noqa: E731
            print(who, plan, "hero", hero, "wins", len(wins), "/", games, "seconds", round(mean(1) / 60), "wave", mean(2),
                  "level", mean(3), "kills", mean(4), "hp", mean(5), [o[0] for o in out].count("timeout"), "timeouts")


if __name__ == "__main__":
    main()
