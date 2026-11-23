from pyquest import *

hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
mobs = []
tick = 0
crowd = 0
edge = 0


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y, "speed": 1}


def far_edge(value):
    if value < 300:
        return 580
    return 300


def spawn_mob():
    global edge
    edge = far_edge(hero["y"])
    mobs.append(make_mob(random_int(20, 580), edge))


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
    global tick, crowd
    tick += 1
    if tick % 50 == 0 and len(mobs) < 14:
        spawn_mob()
    move_hero()
    move_mobs()
    crowd = len(mobs)


def draw():
    clear("#2b2438")
    draw_thing("deco-torch", 124, 84, 3)
    draw_thing("deco-torch", 476, 84, 3)
    for mob in mobs:
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
    draw_thing(hero["image"], hero["x"], hero["y"], 3)
    draw_text(hero["name"], hero["x"], hero["y"] - 36, 18)
    draw_text("Máu: " + str(hero["hp"]), 60, 24)
    draw_text("Quái: " + str(crowd), 540, 24)


start_game()
