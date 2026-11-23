from pyquest import *

hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
mobs = []
tick = 0
crowd = 0
game_over = False
safe = 0
shots = []
wait = 0
kills = 0
gems = []
xp = 0


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y, "hp": 2, "speed": 1}


def far_edge(value):
    if value < 300:
        return 580
    return 20


def spawn_mob():
    mobs.append(make_mob(random_int(20, 580), far_edge(hero["y"])))


def start_game():
    for i in range(6):
        mobs.append(make_mob(random_int(40, 560), 40))


def move_hero():
    if key_pressed("right"):
        hero["x"] += hero["speed"]
    if key_pressed("left"):
        hero["x"] -= hero["speed"]
    if hero["x"] < 24:
        hero["x"] = 24
    if hero["x"] > 576:
        hero["x"] = 576
    if key_pressed("up"):
        hero["y"] -= hero["speed"]
    if key_pressed("down"):
        hero["y"] += hero["speed"]
    if hero["y"] < 24:
        hero["y"] = 24
    if hero["y"] > 576:
        hero["y"] = 576


def distance(a, b):
    dx = abs(a["x"] - b["x"])
    dy = abs(a["y"] - b["y"])
    return dx + dy


def near(a, b, size):
    return distance(a, b) < size


def nearest():
    best = mobs[0]
    for mob in mobs:
        if distance(mob, hero) < distance(best, hero):
            best = mob
    return best


def make_shot(target):
    far = distance(target, hero) + 1
    vx = (target["x"] - hero["x"]) / far * 8
    vy = (target["y"] - hero["y"]) / far * 8
    if vx == 0 and vy == 0:
        vy = -8
    return {"x": hero["x"], "y": hero["y"], "vx": vx, "vy": vy, "live": True}


def shoot():
    global wait
    wait -= 1
    if wait <= 0 and len(mobs) > 0:
        shots.append(make_shot(nearest()))
        wait = 30


def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]


def hit_mobs():
    for shot in shots:
        for mob in mobs:
            if near(shot, mob, 30) and shot["live"]:
                mob["hp"] -= 1
                shot["live"] = False


def remove_shots():
    global shots
    kept = []
    for shot in shots:
        if shot["live"] and near(shot, hero, hero["reach"]):
            kept.append(shot)
    shots = kept


def remove_dead():
    global mobs, kills
    alive = []
    for mob in mobs:
        if mob["hp"] > 0:
            alive.append(mob)
        else:
            kills += 1
            # Em viết tiếp ở đây (1)
            pass
    mobs = alive


def take_gems():
    global gems, xp
    # Em viết tiếp ở đây (2)
    pass


def check_hits():
    global safe
    if safe > 0:
        safe -= 1
        return
    for mob in mobs:
        if near(mob, hero, 36):
            hero["hp"] -= 1
            safe = 60
            return


def step_to(thing, target, speed):
    if thing["x"] < target["x"]:
        thing["x"] += speed
    if thing["x"] > target["x"]:
        thing["x"] -= speed
    if thing["y"] < target["y"]:
        thing["y"] += speed
    if thing["y"] > target["y"]:
        thing["y"] -= speed


def move_mobs():
    for mob in mobs:
        step_to(mob, hero, mob["speed"])
        mob["x"] += random_int(-1, 1)
        mob["y"] += random_int(-1, 1)


def update():
    global tick, crowd, game_over
    if game_over:
        return
    tick += 1
    if tick % 50 == 0 and len(mobs) < 14:
        spawn_mob()
    move_hero()
    move_mobs()
    shoot()
    move_shots()
    hit_mobs()
    remove_shots()
    remove_dead()
    take_gems()
    crowd = len(mobs)
    check_hits()
    if hero["hp"] <= 0:
        game_over = True


def draw():
    clear("#2b2438")
    draw_thing("deco-torch", 124, 84, 3)
    draw_thing("deco-torch", 476, 84, 3)
    for gem in gems:
        draw_thing("item-xp", gem["x"], gem["y"], 1)
    for shot in shots:
        draw_thing("shot-spark", shot["x"], shot["y"], 1)
    for mob in mobs:
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
    if safe % 10 < 5:
        draw_thing(hero["image"], hero["x"], hero["y"], 3)
    draw_text(hero["name"], hero["x"], hero["y"] - 36, 18)
    draw_text("Máu: " + str(hero["hp"]), 60, 24)
    draw_text("Quái: " + str(crowd), 540, 24)
    draw_text("Hạ: " + str(kills), 300, 24)
    draw_text("Ngọc: " + str(xp), 180, 24)
    if game_over:
        draw_text("Thua rồi!", 300, 250, 48)


start_game()
