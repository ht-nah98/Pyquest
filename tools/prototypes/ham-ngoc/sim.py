"""Plays main.py headless with simple bots to check the rules and the balance. Standard library only.

  python3 -B sim.py                 balance report (seeds x heroes x bots)
  python3 -B sim.py --seeds 100     more games per row
  python3 -B sim.py --edge          edge cases (stacked level-ups, no cards left, double knock-out...)
  python3 -B sim.py --png DIR       render a few frames to PNG (needs Pillow)
"""
import argparse
import os
import random
import sys
import types
from collections import Counter, defaultdict
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 60
STAGE = 600
MAX_FRAMES = 15 * 60 * FPS      # a run longer than 15 minutes counts as stuck
MAX_EVENTS = 350
BRANCHES = ["fire", "ice", "spark"]
MOVES = [(0, 0)] + [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]

with open(os.path.join(HERE, "main.py"), encoding="utf-8") as f:
    CODE = compile(f.read(), "main.py", "exec")


class Engine:
    """Stands in for the pyquest module: same names as the real one, plus the contract of design §4."""

    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.keys = set()
        self.mouse = (0, 0)
        self.click = False
        self.events = []

    def module(self):
        m = types.ModuleType("pyquest")
        def emit(kind):
            return lambda *args: self.events.append((kind, args))
        m.WIDTH = m.HEIGHT = STAGE
        for name in ["clear", "draw_rect", "draw_image", "draw_text", "draw_circle", "draw_line", "draw_triangle",
                     "draw_polygon", "play_sound", "play_music", "stop_music"]:
            setattr(m, name, emit(name))
        m.key_pressed = lambda key="space": key in self.keys
        m.random_int = self.rng.randint
        m.mouse_x = lambda: self.mouse[0]
        m.mouse_y = lambda: self.mouse[1]
        m.clicked = lambda: self.click
        return m


class Game:
    def __init__(self, seed):
        self.engine = Engine(seed)
        sys.modules["pyquest"] = self.engine.module()
        self.g = {"__name__": "__main__"}
        exec(CODE, self.g)
        self.max_events = 0
        self.max_mobs = 0

    def step(self, keys=(), click=None):
        e = self.engine
        e.keys = set(keys)
        e.click = click is not None
        if click is not None:
            e.mouse = click
        e.events = []
        self.g["update"]()
        self.g["draw"]()
        self.max_events = max(self.max_events, len(e.events))
        self.max_mobs = max(self.max_mobs, len(self.g["mobs"]))
        self.check()

    def check(self):
        """What must hold on every frame, whatever the player does."""
        g = self.g
        hero = g["hero"]
        assert 0 <= hero.hp <= hero.max_hp, ("hp", hero.hp, hero.max_hp)
        assert len(self.engine.events) <= MAX_EVENTS, ("events", len(self.engine.events))
        for things in ["mobs", "shots", "gems", "zones"]:
            for t in g[things] + [hero]:
                # A comparison with NaN is False, so this also catches positions that are not finite.
                assert 0 <= t.x <= STAGE and g["TOP"] <= t.y <= g["BOTTOM"], (things, t.x, t.y)
        for things, cap in [("mobs", "MAX_MOBS"), ("shots", "MAX_SHOTS"), ("gems", "MAX_GEMS"),
                            ("zones", "MAX_ZONES"), ("effects", "MAX_EFFECTS")]:
            assert len(g[things]) <= g[cap], (things, len(g[things]))
        if self.state == "cards":
            left = sum(hero.skills.get(s, 0) < g["MAX_LEVEL"] for s in g["SKILLS"])
            assert len(set(g["cards"])) == len(g["cards"]) == min(3, left), g["cards"]
        assert all(0 < level <= g["MAX_LEVEL"] for level in hero.skills.values()), hero.skills

    @property
    def state(self):
        return self.g["game"]["state"]


class Bot:
    """Kites mobs and walks to gems. Looks again only every few frames, like a person would."""

    def __init__(self, seed, branch=None, idle=False, reaction=9):
        self.rng = random.Random(seed * 7 + 1)
        self.branch = branch
        self.idle = idle
        self.reaction = reaction
        self.keys = set()
        self.frame = 0

    def play_keys(self, g):
        if self.idle:
            return set()
        self.frame += 1
        if self.frame % self.reaction == 0:
            dx, dy = max(MOVES, key=lambda m: self.score(g, m))
            self.keys = {k for k, on in [("left", dx < 0), ("right", dx > 0), ("up", dy < 0), ("down", dy > 0)] if on}
        return self.keys

    def score(self, g, move):
        hero = g["hero"]
        x = min(STAGE - 12, max(12, hero.x + move[0] * hero.speed * 14))
        y = min(g["BOTTOM"] - 12, max(g["TOP"] + 12, hero.y + move[1] * hero.speed * 14))
        far = lambda t: ((t.x - x) ** 2 + (t.y - y) ** 2) ** 0.5
        total = -abs(x - 300) * 0.02 - abs(y - 311) * 0.02 + self.rng.random() * 0.5
        for mob in g["mobs"]:
            d = far(mob) - mob.size
            total -= max(0, 75 - d) * 0.14
            if "boss" in mob.data:
                total -= max(0, 110 - d) * 0.12
        for shot in g["shots"]:
            if shot.kind == "spore":
                total -= max(0, 55 - far(shot)) * 0.15
        for zone in g["zones"]:
            if zone.kind == "rock":
                total -= max(0, zone.r + 15 - far(zone)) * 0.2
        if g["gems"]:
            total -= min(far(gem) for gem in g["gems"]) * 0.035
        elif g["mobs"]:
            near = min(far(mob) for mob in g["mobs"])
            total -= abs(near - hero.data["range"] * 0.85) * 0.03
        return total

    def pick(self, g):
        cards = g["cards"]
        wanted = [i for i, c in enumerate(cards) if g["SKILLS"][c]["branch"] == self.branch]
        return self.rng.choice(wanted or list(range(len(cards))))


def play(job):
    """One whole game; returns a plain dict with what happened."""
    hero_no, seed, branch, idle = job
    game, bot = Game(seed), Bot(seed, branch, idle)
    g = game.g
    frames = 0
    floor_frames = Counter()
    gap = 0                     # frames to let go of the keys, so the next press is a fresh one
    while game.state not in ("win", "lose") and frames < MAX_FRAMES:
        state = game.state
        if state == "play":
            frames += 1
            floor_frames[g["game"]["floor"]] += 1
            game.step(bot.play_keys(g))
            gap = 40
        elif gap > 0:
            gap -= 1
            game.step()
        else:
            gap = 60
            number = hero_no if state == "hero" else bot.pick(g) if state == "cards" else None
            game.step({"space"} if number is None else {str(number + 1)})
    hero = g["hero"]
    return {"hero": hero_no, "branch": branch, "idle": idle, "win": game.state == "win", "stuck": frames >= MAX_FRAMES,
            "frames": frames, "floor": g["game"]["floor"], "floors": dict(floor_frames), "level": hero.level,
            "skills": dict(hero.skills), "combos": list(g["combos"]), "events": game.max_events, "mobs": game.max_mobs,
            "hp": hero.hp}


def pct(part, whole):
    return f"{100 * part / whole:.0f}%" if whole else "-"


def row(label, games, floors=3):
    n = len(games)
    lost = Counter(r["floor"] + 1 for r in games if not r["win"])
    per_floor = []
    for f in range(floors):
        done = [r["floors"][f] for r in games if f in r["floors"] and (r["win"] or r["floor"] > f)]
        per_floor.append(f"{sum(done) / len(done) / FPS:.0f}" if done else "-")
    print(f"{label:24} win {pct(sum(r['win'] for r in games), n):>4}  sec {sum(r['frames'] for r in games) / n / FPS:4.0f}"
          f"  floor sec {'/'.join(per_floor):9}  lost on 1/2/3 {lost[1]}/{lost[2]}/{lost[3]}"
          f"  level {sum(r['level'] for r in games) / n:4.1f}  max events {max(r['events'] for r in games)}"
          f"  mobs {max(r['mobs'] for r in games)}  stuck {sum(r['stuck'] for r in games)}")


def report(seeds):
    names = ["knight", "mage", "archer"]
    jobs = [(h, s, b, False) for h in range(3) for b in [None] + BRANCHES for s in range(1, seeds + 1)]
    jobs += [(h, s, None, True) for h in range(3) for s in range(1, min(seeds, 20) + 1)]
    with Pool() as pool:
        results = pool.map(play, jobs, chunksize=2)
    active = [r for r in results if not r["idle"]]
    print(f"{len(results)} games")
    for h in range(3):
        row(names[h] + ", any card", [r for r in active if r["hero"] == h and r["branch"] is None])
    for b in BRANCHES:
        row("all heroes, likes " + b, [r for r in active if r["branch"] == b])
        for h in range(3):
            row(f"  {names[h]}, likes {b}", [r for r in active if r["branch"] == b and r["hero"] == h])
    for h in range(3):
        row(names[h] + ", does nothing", [r for r in results if r["idle"] and r["hero"] == h])
    free = [r for r in active if r["branch"] is None]
    everyone = defaultdict(list)
    for r in free:
        for name in r["skills"]:
            everyone[name].append(r)
        for name in r["combos"]:
            everyone["+" + name].append(r)
    print(f"\nbot that takes any card ({len(free)} games, {pct(sum(r['win'] for r in free), len(free))} win)")
    for name in sorted(everyone):
        got = everyone[name]
        levels = sum(r["skills"].get(name, 0) for r in got) / len(got)
        print(f"  {name:13} owned in {pct(len(got), len(free)):>4}  level {levels:.1f}  "
              f"win when owned {pct(sum(r['win'] for r in got), len(got)):>4}")


def start(seed=1, hero_no=0):
    game = Game(seed)
    for _ in range(40):
        game.step()
    game.step({str(hero_no + 1)})
    assert game.state == "play"
    return game


def edge_cases():
    # A key held since the last screen must not pick a card; letting go and pressing again must.
    game = start()
    for _ in range(80):
        game.step({"1"})
    game.g["hero"].xp = 7
    for _ in range(120):
        game.step({"1"})
    assert game.state == "cards", "a held key picked a card"
    game.step()
    game.step({"1"})
    assert game.state == "play" and len(game.g["hero"].skills) == 1
    print("ok  held key does not pick, a fresh press does")

    # Click on the second card; clicks outside the cards do nothing.
    game = start()
    game.g["hero"].xp = 7
    for _ in range(40):
        game.step()
    second = game.g["cards"][1]
    game.step(click=(10, 10))
    assert game.state == "cards"
    game.step(click=(300, game.g["row_top"](1) + 20))
    assert second in game.g["hero"].skills
    print("ok  click picks the card under it")

    # Several level-ups at once come one after the other.
    game = start()
    game.g["hero"].xp = 100
    picks = 0
    while game.g["hero"].xp >= game.g["xp_needed"]() or game.state == "cards":
        if game.state == "cards":
            for _ in range(30):
                game.step()
            game.step({"1"})
            picks += 1
        game.step()
    assert picks == game.g["hero"].level - 1 and picks > 3
    print("ok ", picks, "stacked level-ups, one screen each")

    # Fewer than three cards left, then none.
    game = start()
    g = game.g
    g["hero"].skills = {name: 3 for name in g["SKILLS"]}
    g["hero"].skills["heart"] = 2
    for expected in (1, 0):
        g["hero"].xp = g["xp_needed"]()
        game.step()
        assert len(g["cards"]) == expected
        if expected:
            for _ in range(30):
                game.step()
            game.step({"3"})        # a card that is not there
            assert game.state == "cards"
            game.step()
            game.step({"1"})
    assert game.state == "play"
    for _ in range(600):
        g["hero"].hp = g["hero"].max_hp
        game.step()
    print("ok  one card left, then none; every skill at level 3 runs")

    # Mob exactly on the hero, two mobs exactly on each other.
    game = start(hero_no=2)
    g = game.g
    for kind in g["MOBS"]:
        for _ in range(2):
            mob = g["Mob"](kind, g["hero"].x, g["hero"].y, 1)
            mob.age = 100
            g["mobs"].append(mob)
    for _ in range(300):
        g["hero"].hp = g["hero"].max_hp
        game.step()
        if game.state != "play":
            break
    print("ok  mobs standing on the hero")

    # Boss and hero fall on the same frame: the player gets the win.
    for floor, state in [(0, "next"), (2, "win")]:
        game = start()
        g = game.g
        g["start_floor"](floor)
        boss = g["Mob"](g["WAVES"][floor]["boss"], 100, 100, 1)
        boss.age, boss.hp = 100, 0
        g["mobs"].append(boss)
        g["mobs"].append(g["Mob"]("slime", 200, 200, 1))
        g["hero"].hp = 0
        g["hero"].xp = g["xp_needed"]()         # a level-up comes first: leftovers must not hurt meanwhile
        g["zones"].append(g["Zone"]("rock", g["hero"].x, g["hero"].y, 40, 1, 2))
        g["shots"].append(g["Shot"]("spore", g["hero"].x - 24, g["hero"].y, 1, 0, 2, 1))
        g["hero"].safe = 0
        game.step()
        while game.state == "cards":        # the boss gems may give a level first
            for _ in range(30):
                game.step()
            game.step({"1"})
            game.step()
        assert game.state == state and g["hero"].hp >= 1, (game.state, g["hero"].hp)
    print("ok  boss and hero fall together")

    # Losing, then playing again starts clean.
    game = start()
    g = game.g
    g["hero"].skills = {"fire_hit": 3}
    g["hero"].hp = 0
    game.step()
    assert game.state == "lose"
    for _ in range(60):
        game.step()
    game.step({"space"})
    assert game.state == "hero"
    for _ in range(40):
        game.step({"space"})
    game.step({"2"})
    assert game.state == "play" and g["hero"].skills == {} and g["hero"].hp == 5 and g["combos"] == []
    print("ok  play again starts clean")

    # Every skill alone at every level, and every combo, on all heroes.
    g = start().g
    for name in g["SKILLS"]:
        for level in (1, 2, 3):
            for hero_no in range(3):
                game = start(hero_no=hero_no)
                game.g["hero"].skills = {name: level}
                game.g["combos"].extend(game.g["COMBOS"])
                bot = Bot(1)
                for _ in range(400):
                    if game.state != "play":
                        break
                    game.step(bot.play_keys(game.g))
    print("ok  every skill x level x hero runs with every combo on")


def same_run_twice():
    assert play((1, 5, None, False)) == play((1, 5, None, False)), "same seed, different game"
    print("ok  same seed gives the same game")


FONTS = os.path.join(HERE, "../../../apps/web/public/fonts")
NAMED = {"white": "#ffffff", "black": "#000000", "green": "#008000", "orange": "#ffa500", "skyblue": "#87ceeb"}


def rgba(color):
    color = NAMED.get(color, color).lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in range(0, len(color), 2))


def render(events, path):
    """The same picture render.ts makes, close enough to check the layout by eye."""
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (STAGE, STAGE), "#bfe3f2")
    d = ImageDraw.Draw(img, "RGBA")
    for kind, a in events:
        a = list(a)
        if kind == "clear":
            d.rectangle([0, 0, STAGE, STAGE], fill=rgba(a[0]))
        elif kind == "draw_rect":
            x, y, w, h, color = a
            if w > 0 and h > 0:
                d.rectangle([x, y, x + w - 1, y + h - 1], fill=rgba(color))
        elif kind == "draw_circle":
            x, y, r, color = a
            d.ellipse([x - r, y - r, x + r, y + r], fill=rgba(color))
        elif kind == "draw_line":
            d.line(a[:4], fill=rgba(a[4]), width=round(a[5]))
        elif kind == "draw_triangle":
            d.polygon(a[:6], fill=rgba(a[6]))
        elif kind == "draw_text":
            text, x, y = a[:3]
            size = a[3] if len(a) > 3 else 24
            color = a[4] if len(a) > 4 else "white"
            latin, viet = (ImageFont.truetype(f"{FONTS}/vt323-{n}.woff2", size) for n in ("latin", "vietnamese"))
            x -= sum(latin.getlength("a") for _ in text) / 2
            for c in text:
                # Each letter comes from the font file that has it, as the browser does with unicode-range.
                font = latin if ord(c) < 256 else viet
                d.text((x, y), c, font=font, fill=rgba(color), anchor="lm", stroke_width=max(1, round(size / 20)),
                       stroke_fill="#1b2233")
                x += latin.getlength("a")
    img.save(path)


def pictures(out):
    os.makedirs(out, exist_ok=True)
    def shot(name, game):
        game.step()
        render(game.engine.events, os.path.join(out, name + ".png"))
        print(name, len(game.engine.events), "events")
    game = Game(3)
    for _ in range(30):
        game.step()
    shot("1-hero", game)
    wanted = [("2-floor1", lambda g: g["game"]["state"] == "play" and g["game"]["time"] > 900),
              ("3-cards", lambda g: g["game"]["state"] == "cards" and len(g["hero"].skills) >= 2),
              ("4-banner", lambda g: g["game"]["state"] == "play" and g["banners"] and "Ph" in g["banners"][0][0]),
              ("5-boss1", lambda g: g["game"]["boss_out"] and g["mobs"] and g["mobs"][0].age > 260),
              ("6-next", lambda g: g["game"]["state"] == "next"),
              ("7-floor2", lambda g: g["game"]["floor"] == 1 and len(g["mobs"]) > 13),
              ("8-boss2", lambda g: g["game"]["floor"] == 1 and g["game"]["boss_out"] and len(g["shots"]) > 8),
              ("9-floor3", lambda g: g["game"]["floor"] == 2 and len(g["mobs"]) > 13),
              ("10-boss3", lambda g: g["game"]["floor"] == 2 and g["game"]["boss_out"] and len(g["zones"]) > 3
               and any(m.kind == "boss3" and 85 < m.age % 190 < 110 for m in g["mobs"])),
              ("11-win", lambda g: g["game"]["state"] == "win")]
    bot, gap = Bot(3), 0
    while wanted and game.state != "lose":
        g = game.g
        while wanted and wanted[0][1](g):
            shot(wanted.pop(0)[0], game)
        if game.state == "play":
            g["hero"].hp = max(g["hero"].hp, 2)     # the photo tour must reach the end
            game.step(bot.play_keys(g))
            gap = 40
        elif gap > 0:
            gap -= 1
            game.step()
        else:
            number = {"hero": 1, "cards": bot.pick(g) if game.state == "cards" else 0}.get(game.state)
            game.step({"space"} if number is None else {str(number + 1)})
            game.step()
            gap = 60
    print("not seen:", [name for name, _ in wanted])
    game = start(4)
    game.g["hero"].hp = 0
    game.step()
    shot("12-lose", game)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--seeds", type=int, default=40)
    p.add_argument("--edge", action="store_true")
    p.add_argument("--png")
    args = p.parse_args()
    if args.png:
        pictures(args.png)
    elif args.edge:
        edge_cases()
        same_run_twice()
    else:
        report(args.seeds)


if __name__ == "__main__":
    main()
