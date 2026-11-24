"""Plays main.py headless with simple bots to check the rules and the balance. Standard library only.

  python3 -B sim.py                 balance report (seeds x heroes x bots)
  python3 -B sim.py --seeds 100     more games per row
  python3 -B sim.py --fast          same, but draws one frame in ten (the drawing is checked less)
  python3 -B sim.py --cards         what each card is worth: the bot always takes it, against any card
  python3 -B sim.py --edge          edge cases (stacked level-ups, no cards left, double knock-out, taps, pictures...)
  python3 -B sim.py --fuzz          100 games x 3000 frames of random keys, clicks and mouse
  python3 -B sim.py --png DIR       render a few frames to PNG (needs Pillow)
"""
import argparse
import json
import math
import os
import random
import re
import sys
import types
from collections import Counter, defaultdict
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 60
WIDTH, HEIGHT = 1600, 900
MAX_FRAMES = 20 * 60 * FPS      # a run longer than 20 minutes counts as stuck
MAX_EVENTS = 1100
DRAW_EVERY = 10 if "--fast" in sys.argv else 1
BRANCHES = ["fire", "ice", "spark"]
MOVES = [(0, 0)] + [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]

with open(os.path.join(HERE, "main.py"), encoding="utf-8") as f:
    CODE = compile(f.read(), "main.py", "exec")


LIBRARY = os.path.join(HERE, "../../../content/assets/library")
with open(os.path.join(LIBRARY, "manifest.json"), encoding="utf-8") as f:
    ASSETS = {a["id"]: a for a in json.load(f)["assets"]}
SOUNDS = ["flap", "point", "hit", "fall", "win", "click"]
MUSIC = ["happy", "adventure", "calm"]
KEYS = ["space", "left", "right", "up", "down", "1", "2", "3"]
COLOR = re.compile(r"#([0-9a-f]{6}|[0-9a-f]{8})")
seen_pictures = set()           # (id, frame) drawn so far, for --edge


class Engine:
    """Stands in for the pyquest module. Refuses what the real one refuses, and also what the page would draw wrong:
    a colour it cannot read, a frame past the end of the strip, a number that is not finite."""

    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.keys = set()
        self.mouse = (0, 0)
        self.click = False
        self.events = []

    def numbers(self, *values):
        for v in values:
            assert isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v), ("number", v)

    def color(self, color):
        assert color in NAMED or COLOR.fullmatch(color), ("color", color)

    def emit(self, kind, args):
        self.events.append((kind, args))

    def clear(self, color="skyblue"):
        self.color(color)
        self.emit("clear", (color,))

    def draw_rect(self, x, y, w, h, color="green"):
        self.numbers(x, y, w, h)
        self.color(color)
        self.emit("draw_rect", (x, y, w, h, color))

    def draw_circle(self, x, y, r, color="orange"):
        self.numbers(x, y, r)
        assert r >= 0, ("radius", r)
        self.color(color)
        self.emit("draw_circle", (x, y, r, color))

    def draw_line(self, x1, y1, x2, y2, color="black", width=3):
        self.numbers(x1, y1, x2, y2, width)
        assert width > 0, ("width", width)
        self.color(color)
        self.emit("draw_line", (x1, y1, x2, y2, color, width))

    def draw_text(self, text, x, y, size=24, color="white"):
        self.numbers(x, y, size)
        assert size > 0, ("size", size)
        half = len(text) * size * 0.4 / 2       # VT323: every letter is 0.4 of the size wide
        # Damage numbers may leave the screen with their mob; every other text must fit.
        assert text.lstrip("-").isdigit() or (0 <= x - half and x + half <= WIDTH), ("text runs off the stage", text, x)
        self.color(color)
        self.emit("draw_text", (str(text), x, y, size, color))

    def draw_image(self, path, x, y, frame=0, flip=False, scale=1, mirror=False):
        self.numbers(x, y, scale, frame)
        assert path.startswith("images/") and path.endswith(".png"), ("path", path)
        asset = path[len("images/"):-len(".png")]
        assert asset in ASSETS, ("picture not in the library", path)
        assert isinstance(frame, int) and 0 <= frame < ASSETS[asset]["frames"], ("frame", path, frame)
        assert scale > 0 and flip in (True, False) and mirror in (True, False), (path, scale, flip, mirror)
        seen_pictures.add((asset, frame))
        self.emit("draw_image", (asset, x, y, frame, flip, scale, mirror))

    def play_sound(self, name):
        assert name in SOUNDS, ("sound", name)
        self.emit("play_sound", (name,))

    def play_music(self, name):
        assert name in MUSIC, ("music", name)
        self.emit("play_music", (name,))

    def stop_music(self):
        self.emit("stop_music", ())

    def key_pressed(self, key="space"):
        assert key in KEYS, ("key", key)
        return key in self.keys

    def module(self):
        m = types.ModuleType("pyquest")
        m.WIDTH, m.HEIGHT = WIDTH, HEIGHT
        for name in ["clear", "draw_rect", "draw_image", "draw_text", "draw_circle", "draw_line", "play_sound",
                     "play_music", "stop_music", "key_pressed"]:
            setattr(m, name, getattr(self, name))
        m.random_int = self.rng.randint
        m.mouse_x = lambda: self.mouse[0]
        m.mouse_y = lambda: self.mouse[1]
        m.clicked = lambda: self.click
        return m


class Game:
    def __init__(self, seed, draw_every=1):
        self.engine = Engine(seed)
        self.draw_every = draw_every
        self.frame = 0
        sys.modules["pyquest"] = self.engine.module()
        self.g = {"__name__": "__main__"}
        exec(CODE, self.g)
        self.max_events = 0
        self.boosted = False        # a test handed the hero more skills than there are slots
        self.max_mobs = 0
        self.sounds = Counter()

    def step(self, keys=(), click=None, mouse=None):
        e = self.engine
        e.keys = set(keys)
        e.click = click is not None
        if click is not None or mouse is not None:
            e.mouse = click or mouse
        e.events = []
        self.g["update"]()
        self.frame += 1
        if self.frame % self.draw_every == 0:       # drawing changes nothing in the game, so it may be skipped
            self.g["draw"]()
        self.max_events = max(self.max_events, len(e.events))
        self.max_mobs = max(self.max_mobs, len(self.g["mobs"]))
        for kind, args in e.events:
            if kind == "play_sound":
                self.sounds[args[0]] += 1
        self.check()

    def check(self):
        """What must hold on every frame, whatever the player does."""
        g = self.g
        hero = g["hero"]
        assert 0 <= hero.hp <= hero.max_hp, ("hp", hero.hp, hero.max_hp)
        assert len(self.engine.events) <= MAX_EVENTS, ("events", len(self.engine.events))
        for things, edge in [("mobs", 14), ("shots", 200), ("gems", 60), ("zones", 60), ("drops", 60)]:
            for t in g[things] + [hero]:
                # A comparison with NaN is False, so this also catches positions that are not finite.
                assert -edge <= t.x <= g["world"]["w"] + edge and -edge <= t.y <= g["world"]["h"] + edge, (things, t.x, t.y)
        for things, cap in [("mobs", "MAX_MOBS"), ("shots", "MAX_SHOTS"), ("gems", "MAX_GEMS"),
                            ("zones", "MAX_ZONES"), ("effects", "MAX_EFFECTS")]:
            assert len(g[things]) <= g[cap], (things, len(g[things]))
        if self.state == "cards":
            left = sum(g["can_take"](s) for s in g["SKILLS"])
            assert self.boosted or g["slots_used"]() <= g["SLOTS"], hero.skills
            assert len(set(g["cards"])) == len(g["cards"]) == min(3, left), g["cards"]
        assert all(0 < level <= g["MAX_LEVEL"] for level in hero.skills.values()), hero.skills

    @property
    def state(self):
        return self.g["game"]["state"]


class Bot:
    """Kites mobs and walks to gems. Looks again only every few frames, like a person would."""

    def __init__(self, seed, branch=None, idle=False, reaction=9, card=None):
        self.rng = random.Random(seed * 7 + 1)
        self.branch = branch
        self.idle = idle
        self.reaction = reaction
        self.card = card            # takes this card whenever it is on the table
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
        hero, world = g["hero"], g["world"]
        x = min(world["w"] - 24, max(24, hero.x + move[0] * hero.speed * 24))
        y = min(world["h"] - 24, max(24, hero.y + move[1] * hero.speed * 24))
        far = lambda t: ((t.x - x) ** 2 + (t.y - y) ** 2) ** 0.5
        total = -abs(x - world["w"] / 2) * 0.004 - abs(y - world["h"] / 2) * 0.004 + self.rng.random() * 0.5
        for mob in g["mobs"]:
            if abs(mob.x - x) > 220 or abs(mob.y - y) > 220:
                continue
            d = far(mob) - mob.size
            total -= max(0, 80 - d) * 0.14
            if mob.boss:
                total -= max(0, 120 - d) * 0.12
        for shot in g["shots"]:
            if shot.kind == "spore":
                total -= max(0, 50 - far(shot)) * 0.15
        for zone in g["zones"]:
            if zone.kind == "rock":
                total -= max(0, zone.r + 15 - far(zone)) * 0.2
        for pool in g["pools"]:
            if ((x - pool[0]) / 95) ** 2 + ((y + 12 - pool[1]) / 65) ** 2 < 1:
                total -= 6
        for prop in g["solids"]:
            total -= max(0, prop.solid + 12 - far(prop)) * 0.3
        wanted = [t for t in g["drops"] if t.kind != "heart" or hero.hp < hero.max_hp - 25] + g["gems"]
        if wanted:
            total -= min(min(far(t) for t in wanted), 500) * 0.035
        elif g["mobs"]:
            near = min(far(mob) for mob in g["mobs"])
            total -= abs(near - hero.data["range"] * 0.85) * 0.03
        return total

    def pick(self, g):
        cards = g["cards"]
        if self.card in cards:
            return cards.index(self.card)
        wanted = [i for i, c in enumerate(cards) if g["SKILLS"][c]["branch"] == self.branch]
        return self.rng.choice(wanted or list(range(len(cards))))


def play(job):
    """One whole game; returns a plain dict with what happened."""
    hero_no, seed, branch, idle, reaction, card = job
    game, bot = Game(seed, DRAW_EVERY), Bot(seed, branch, idle, reaction, card)
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
    return {"hero": hero_no, "branch": branch, "idle": idle, "slow": reaction > 9, "card": card,
            "win": game.state == "win", "stuck": frames >= MAX_FRAMES,
            "frames": frames, "floor": g["game"]["floor"], "floors": dict(floor_frames), "level": hero.level,
            "skills": dict(hero.skills), "combos": list(g["combos"]), "events": game.max_events, "mobs": game.max_mobs,
            "hp": hero.hp, "sounds": sum(game.sounds.values())}


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
          f"  mobs {max(r['mobs'] for r in games)}  stuck {sum(r['stuck'] for r in games)}"
          f"  sounds/min {sum(r['sounds'] for r in games) / max(1, sum(r['frames'] for r in games)) * 60 * FPS:.0f}")


def report(seeds):
    names = ["knight", "mage", "archer"]
    jobs = [(h, s, b, False, 9, None) for h in range(3) for b in [None] + BRANCHES for s in range(1, seeds + 1)]
    jobs += [(h, s, None, False, 24, None) for h in range(3) for s in range(1, seeds + 1)]
    jobs += [(h, s, None, True, 9, None) for h in range(3) for s in range(1, min(seeds, 20) + 1)]
    with Pool() as pool:
        results = pool.map(play, jobs, chunksize=2)
    active = [r for r in results if not r["idle"] and not r["slow"]]
    print(f"{len(results)} games")
    for h in range(3):
        row(names[h] + ", any card", [r for r in active if r["hero"] == h and r["branch"] is None])
    row("all heroes, any card", [r for r in active if r["branch"] is None])
    for b in BRANCHES:
        row("all heroes, likes " + b, [r for r in active if r["branch"] == b])
        for h in range(3):
            row(f"  {names[h]}, likes {b}", [r for r in active if r["branch"] == b and r["hero"] == h])
    for h in range(3):
        row(names[h] + ", slow hands", [r for r in results if r["slow"] and r["hero"] == h])
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


def card_values(seeds):
    """The fair way to compare cards: same seeds, the only change is that the bot always takes this one."""
    names = [None] + list(Game(1).g["SKILLS"])
    jobs = [(h, s, None, False, 9, c) for c in names for h in range(3) for s in range(1, seeds + 1)]
    with Pool() as pool:
        results = pool.map(play, jobs, chunksize=2)
    for c in names:
        games = [r for r in results if r["card"] == c]
        print(f"  always takes {c or '(any card)':13} win {pct(sum(r['win'] for r in games), len(games)):>4}"
              f"  lost on floor 1 {pct(sum(not r['win'] and r['floor'] == 0 for r in games), len(games)):>4}"
              f"  level {sum(r['level'] for r in games) / len(games):4.1f}")


def fuzz_game(seed, frames=3000):
    """Random keys, clicks and mouse. Half the games start late in the run with many skills and cannot lose early."""
    rng = random.Random(seed)
    game = Game(seed)
    g = game.g
    boosted = seed % 2 == 0
    states = Counter()
    keys, mouse = set(), (0, 0)
    for frame in range(frames):
        if rng.random() < 0.15:
            keys = {k for k in KEYS if rng.random() < 0.3}
        if rng.random() < 0.2:
            mouse = rng.choice([(rng.uniform(0, WIDTH), rng.uniform(0, HEIGHT)), (rng.randint(-50, 1000), rng.randint(-50, 600)),
                                (0, 0), (WIDTH, HEIGHT), (480, rng.randint(130, 530))])
        game.step(keys, mouse if rng.random() < 0.1 else None, mouse)
        states[game.state] += 1
        if boosted and game.state == "play":
            hero = g["hero"]
            hero.hp = max(hero.hp, 40)
            if rng.random() < 0.004:
                g["start_floor"](rng.randint(0, 2))
            if rng.random() < 0.01:
                hero.xp += rng.randint(1, 60)
            if rng.random() < 0.004:
                for mob in g["mobs"]:
                    mob.hp = min(mob.hp, rng.randint(0, 3))
            if rng.random() < 0.003:            # straight to the boss, or every mob falls at once
                g["game"]["second"] = g["FLOORS"][g["game"]["floor"]]["length"] - 1
                for mob in g["mobs"]:
                    mob.hp = 0
            if rng.random() < 0.003:            # a crowd, up to the cap
                for _ in range(rng.randint(5, 60)):
                    g["spawn_mob"](rng.choice(["slime", "bat", "mushroom", "ghost", "golem"]), rng.random() < 0.1)
            if rng.random() < 0.002:
                hero.hp = 0
    return dict(states), game.max_events, game.max_mobs, len(g["combos"])


def fuzz():
    with Pool() as pool:
        results = pool.map(fuzz_game, range(1, 101), chunksize=1)
    total = Counter()
    for states, _, _, _ in results:
        total.update(states)
    print(f"ok  {len(results)} games x 3000 frames, no exception; frames per screen {dict(total)}, "
          f"max events {max(r[1] for r in results)}, max mobs {max(r[2] for r in results)}")


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
    game.g["hero"].xp = 12
    for _ in range(120):
        game.step({"1"})
    assert game.state == "cards", "a held key picked a card"
    game.step()
    game.step({"1"})
    assert game.state == "play" and len(game.g["hero"].skills) == 1
    print("ok  held key does not pick, a fresh press does")

    # Click on the second card; clicks outside the cards do nothing.
    game = start()
    game.g["hero"].xp = 12
    for _ in range(40):
        game.step()
    second = game.g["cards"][1]
    game.step(click=(10, 10))
    assert game.state == "cards"
    game.step(click=(400, game.g["row_top"](1) + 20))
    assert second in game.g["hero"].skills and game.g["hero"].target is None
    game.step()
    game.step(click=(400, game.g["row_top"](1) + 20))       # a double tap on the card is not a walk order
    assert game.g["hero"].target is None
    print("ok  click picks the card under it, and sets no walk target")

    # Tap to walk: goes there and stops; a key cancels; the edge of the world is safe. Holding follows the pointer.
    game = start()
    g = game.g
    hero, world, camera = g["hero"], g["world"], g["camera"]
    g["solids"].clear()
    g["blocks"].clear()
    g["pools"].clear()
    for _ in range(30):
        game.step()
    for spot in [(700, 300), (1, 1), (960, 540), (200.5, 100.25), (480, 500)]:
        want = [min(world["w"] - 24, max(24, spot[0] + camera["x"])), min(world["h"] - 24, max(24, spot[1] + camera["y"]))]
        game.step(click=spot)
        assert hero.target is not None
        for _ in range(900):
            hero.hp, hero.xp = hero.max_hp, 0
            g["game"]["second"] = 1
            game.step()
            if hero.target is None:
                break
        assert hero.target is None and abs(hero.x - want[0]) < 0.01 and abs(hero.y - want[1]) < 0.01, (spot, hero.x, hero.y)
    game.step({"space"}, click=(100, 400))
    for _ in range(40):
        hero.hp = hero.max_hp
        game.step({"space"}, mouse=(800, 270))
    assert hero.target is not None and hero.target[0] > hero.x
    game.step({"right"})
    assert hero.target is None and hero.look == "right"
    game.step({"space"}, mouse=(100, 100))          # the key alone is no pointer
    assert hero.target is None
    print("ok  tap or hold to walk: arrives, stays inside, keys cancel")

    # Walking into every edge and around the props never leaves the world or gets stuck in a prop.
    for floor in range(3):
        game = start()
        g = game.g
        g["start_floor"](floor)
        for keys in [{"left"}, {"up"}, {"right"}, {"down"}, {"left", "up"}, {"right", "down"}]:
            for _ in range(700):
                g["hero"].hp, g["hero"].xp, g["game"]["second"] = g["hero"].max_hp, 0, 1
                game.step(keys)
        for prop in g["solids"]:
            assert g["distance"](prop, g["hero"]) >= prop.solid + 10, "inside a prop"
        # A walk target inside a tree: the hero must not freeze the game.
        prop = g["solids"][0]
        g["hero"].target = [prop.x, prop.y]
        for _ in range(200):
            g["hero"].hp, g["hero"].xp = g["hero"].max_hp, 0
            game.step()
    print("ok  edges and props on all floors")

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

    # Fewer than three cards left, then none; a chest with nothing left to raise heals.
    game = start()
    g = game.g
    game.boosted = True
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
    g["hero"].hp = 10
    g["drops"].append(g["Drop"]("chest", g["hero"].x, g["hero"].y))
    game.step()
    assert g["hero"].hp > 40
    for _ in range(600):
        g["hero"].hp = g["hero"].max_hp
        game.step()
    print("ok  one card left, then none; chest heals; every skill at level 3 runs")

    # Chest raises a skill the hero has; box, heart and magnet work.
    game = start()
    g = game.g
    g["hero"].skills = {"fire_hit": 1}
    g["drops"].append(g["Drop"]("chest", g["hero"].x, g["hero"].y))
    game.step()
    assert g["hero"].skills == {"fire_hit": 2}
    g["drops"].clear()
    g["gems"].append(g["Gem"](g["hero"].x + 400, g["hero"].y, 1))
    g["drops"].append(g["Drop"]("magnet", g["hero"].x, g["hero"].y))
    xp = g["hero"].xp
    for _ in range(150):
        g["hero"].hp = g["hero"].max_hp
        game.step()
    assert g["hero"].xp > xp or game.state == "cards"
    for _ in range(20):
        g["drops"].append(g["Drop"]("box", g["hero"].x, g["hero"].y))
        game.step()
        if game.state != "play":
            break
    print("ok  chest, magnet, boxes")

    # Mob exactly on the hero, two mobs exactly on each other.
    game = start(hero_no=2)
    g = game.g
    for kind in g["MOBS"]:
        for elite in (False, True):
            mob = g["Mob"](kind, g["hero"].x, g["hero"].y, 1, elite)
            mob.born = -100
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
        boss = g["Mob"](g["FLOORS"][floor]["boss"], 300, 300, 1)
        boss.born, boss.hp = -100, 0
        g["mobs"].append(boss)
        g["mobs"].append(g["Mob"]("slime", 200, 200, 1))
        g["hero"].hp = 0
        g["hero"].xp = g["xp_needed"]()         # a level-up comes first: leftovers must not hurt meanwhile
        g["zones"].append(g["Zone"]("rock", g["hero"].x, g["hero"].y, 40, 10, 2))
        g["shots"].append(g["Shot"]("spore", g["hero"].x - 24, g["hero"].y, 1, 0, 2, 9, 100))
        g["hero"].safe_end = 0
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
    assert game.state == "play" and g["hero"].skills == {} and g["hero"].hp == g["HEROES"][1]["hp"] and g["combos"] == []
    print("ok  play again starts clean")

    # Every picture a table can name is in the library, with the frames the table says.
    g = start().g
    used = [d["image"] for d in g["HEROES"] + list(g["MOBS"].values())] + [s["icon"] for s in g["SKILLS"].values()]
    used += ["fx-" + name for name in g["FX"]] + [d[0] for d in g["DROPS"].values()] + [n for pair in g["GLOWS"].items() for n in (pair[0], pair[1][0])]
    for floor in g["FLOORS"]:
        used += [p[0] for p in floor["props"] + floor["marks"] + floor["walls"]] + floor["edge"]
        used += [name for c in floor["clumps"] for name in c[0]]
        used += [floor["ground"], floor["patch"], floor["pools"][0], floor["rim"]]
        for mobs in [w[1] for w in floor["waves"]] + [{s[1]: 1} for s in floor["swarms"]] + [{e[1]: 1} for e in floor["elites"]]:
            assert all(kind in g["MOBS"] for kind in mobs), mobs
        assert floor["waves"][0][0] == 0 and floor["boss"] in g["MOBS"]
        assert ASSETS[floor["pools"][0]]["frames"] == 2 and ASSETS[floor["ground"]]["width"] * 3 == g["TILE"]
        widest = sorted(floor["world"])
        assert widest[0] >= HEIGHT * 2, "outside_point needs world beyond the screen"
    with open(os.path.join(HERE, "main.py"), encoding="utf-8") as f:
        text = f.read()
    used += re.findall(r'draw_sprite\("([a-z0-9-]+)"', text) + re.findall(r'"images/([a-z0-9-]+)\.png"', text)
    used += re.findall(r'draw_message\("([a-z0-9-]+)"', text)
    for name in used:
        assert name in ASSETS and os.path.exists(os.path.join(LIBRARY, ASSETS[name]["file"])), name
        assert ASSETS[name].get("pixel") or name.startswith(("deco-glow", "deco-dark")), name
    for name, fx in g["FX"].items():
        asset = ASSETS["fx-" + name]
        assert (fx["frames"], fx["width"]) == (asset["frames"], asset["width"]), name
        assert fx["foot"] <= asset["height"]
    for name in set(re.findall(r'add_effect\("([a-z]+)"', text)):
        assert name in g["FX"] or name in ("ring", "bolt", "number"), name
    print("ok ", len(set(used)), "pictures named, all in the manifest, frame counts agree")

    # Card texts fit between the icon and the card's edge; combo names fit their chip.
    for s in g["SKILLS"].values():
        assert len(s["text"]) == 3 and max(len(line) for line in s["text"]) * 10.4 / 2 <= 240, s["text"]
    assert all(len(c["name"]) * 7.2 <= 100 for c in g["COMBOS"].values())
    print("ok  card texts and combo names fit")

    # Every skill alone at every level, and every combo, on all heroes.
    g = start().g
    for name in g["SKILLS"]:
        for level in (1, 2, 3):
            for hero_no in range(3):
                game = start(hero_no=hero_no)
                game.g["hero"].skills = {name: level}
                game.g["combos"].extend(game.g["COMBOS"])
                for _ in range(12):
                    game.g["spawn_mob"]("slime")
                bot = Bot(1)
                for _ in range(400):
                    if game.state != "play":
                        break
                    game.step(bot.play_keys(game.g))
    short = [n for n in g["FX"] if {f for a, f in seen_pictures if a == "fx-" + n} != set(range(g["FX"][n]["frames"]))]
    print("ok  every skill x level x hero runs with every combo on; effect frames not drawn here:", short)


def same_run_twice():
    assert play((1, 5, None, False, 9, None)) == play((1, 5, None, False, 9, None)), "same seed, different game"
    print("ok  same seed gives the same game")


FONTS = os.path.join(HERE, "../../../apps/web/public/fonts")
NAMED = {"white": "#ffffff", "black": "#000000", "green": "#008000", "orange": "#ffa500", "skyblue": "#87ceeb"}


def rgba(color):
    color = NAMED.get(color, color).lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in range(0, len(color), 2))


def paste(img, asset, x, y, frame, flip, scale, mirror):
    from PIL import Image
    w, h = ASSETS[asset]["width"], ASSETS[asset]["height"]
    soft = not ASSETS[asset].get("pixel")
    with Image.open(os.path.join(LIBRARY, ASSETS[asset]["file"])) as strip:
        k = strip.height // h
        picture = strip.convert("RGBA").crop((frame * w * k, 0, (frame + 1) * w * k, h * k))
    if mirror:
        picture = picture.transpose(Image.FLIP_LEFT_RIGHT)
    if flip:
        picture = picture.transpose(Image.FLIP_TOP_BOTTOM)
    picture = picture.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.BILINEAR if soft else Image.NEAREST)
    img.paste(picture, (round(x), round(y)), picture)


def render(events, path):
    """The same picture render.ts makes, close enough to check the layout by eye."""
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (WIDTH, HEIGHT), "#bfe3f2")
    d = ImageDraw.Draw(img, "RGBA")
    for kind, a in events:
        a = list(a)
        if kind == "clear":
            d.rectangle([0, 0, WIDTH, HEIGHT], fill=rgba(a[0]))
        elif kind == "draw_rect":
            x, y, w, h, color = a
            if w > 0 and h > 0:
                d.rectangle([x, y, max(x, x + w - 1), max(y, y + h - 1)], fill=rgba(color))
        elif kind == "draw_circle":
            x, y, r, color = a
            d.ellipse([x - r, y - r, x + r, y + r], fill=rgba(color))
        elif kind == "draw_line":
            d.line(a[:4], fill=rgba(a[4]), width=round(a[5]))
        elif kind == "draw_image":
            paste(img, *a)
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
    """A tour with the same bot, a photo at fixed moments of each floor."""
    os.makedirs(out, exist_ok=True)

    def shot(name, game):
        game.step()
        render(game.engine.events, os.path.join(out, name + ".png"))
        print(name, len(game.engine.events), "events", len(game.g["mobs"]), "mobs")

    game = Game(3)
    for _ in range(30):
        game.step()
    shot("00-hero", game)
    moments = [(f, s) for f in range(3) for s in (4, 40, 92, 999)]
    game, bot, gap, n = Game(5), Bot(3), 0, 0
    cards = False
    while moments and n < MAX_FRAMES:
        n += 1
        g = game.g
        if game.state == "play":
            g["hero"].hp = max(g["hero"].hp, 60)
            floor, second = moments[0]
            boss = any(m.boss and g["game"]["time"] - m.born > 260 and g["on_screen"](m, 0) for m in g["mobs"])
            if g["game"]["floor"] == floor and (boss if second == 999 else g["game"]["second"] >= second):
                moments.pop(0)
                shot("%d-%s" % (floor + 1, "boss" if second == 999 else "%03d" % second), game)
            game.step(bot.play_keys(g))
            gap = 40
        elif gap > 0:
            gap -= 1
            game.step()
        else:
            if game.state == "cards" and len(g["hero"].skills) > 3 and not cards:
                cards = True
                shot("05-cards", game)
            number = {"hero": 1, "cards": bot.pick(g) if game.state == "cards" else 0}.get(game.state)
            if game.state in ("next", "lose", "win"):
                shot("06-" + game.state, game)
            game.step({"space"} if number is None else {str(number + 1)})
            game.step()
            gap = 60
    print("not seen:", moments)
    for hero_no in range(3):
        game = start(4, hero_no)
        g = game.g
        g["start_floor"](2)
        hero = g["hero"]
        game.boosted = True
        hero.skills = {name: 3 for name in g["SKILLS"]}
        hero.max_hp, hero.hp = 200, 120
        g["combos"].extend(g["COMBOS"])
        g["banners"].clear()
        bot = Bot(1)
        for _ in range(40):
            g["spawn_mob"]("ghost")
        for _ in range(500):
            hero.hp, hero.xp = 120, 0
            game.step(bot.play_keys(g))
        shot("%d-everything" % (16 + hero_no), game)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--seeds", type=int, default=40)
    p.add_argument("--edge", action="store_true")
    p.add_argument("--fast", action="store_true")
    p.add_argument("--fuzz", action="store_true")
    p.add_argument("--cards", action="store_true")
    p.add_argument("--png")
    args = p.parse_args()
    if args.png:
        pictures(args.png)
    elif args.fuzz:
        fuzz()
    elif args.cards:
        card_values(args.seeds)
    elif args.edge:
        edge_cases()
        same_run_twice()
    else:
        report(args.seeds)


if __name__ == "__main__":
    main()
