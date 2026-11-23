from pyquest import *

START_HP = 5
hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
START_PICKS = 3
held = 0

SKILLS = []
SKILLS.append({"name": "Đốm Lửa: đạn mạnh hơn", "branch": "fire", "icon": 1, "what": "power", "add": 1})
SKILLS.append({"name": "Vòng Lửa: đốt quái gần", "branch": "fire", "icon": 2, "what": "ring", "add": 2})
SKILLS.append({"name": "Nổ Tung: quái thua là nổ", "branch": "fire", "icon": 4, "what": "boom", "add": 2})
SKILLS.append({"name": "Đòn Buốt: đạn làm chậm", "branch": "ice", "icon": 1, "what": "slow", "add": 60})
SKILLS.append({"name": "Vòng Sương: tỏa lạnh", "branch": "ice", "icon": 4, "what": "frost", "add": 80})
SKILLS.append({"name": "Áo Băng: bất tử lâu hơn", "branch": "ice", "icon": 3, "what": "armor", "add": 40})
SKILLS.append({"name": "Tay Chớp: bắn nhanh", "branch": "spark", "icon": 1, "what": "fast", "add": 5})
SKILLS.append({"name": "Tia Đôi: thêm 1 viên", "branch": "spark", "icon": 2, "what": "extra", "add": 1})
SKILLS.append({"name": "Mây Giông: sét đánh", "branch": "spark", "icon": 3, "what": "cloud", "add": 3})


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
    global mobs, shots, gems, owned, picks, tick, safe, wait, kills, xp, level, screen
    hero["x"] = 300
    hero["y"] = 300
    hero["hp"] = START_HP
    mobs = []
    shots = []
    gems = []
    tick = 0
    safe = 0
    wait = 0
    kills = 0
    xp = 0
    level = 1
    owned = []
    picks = START_PICKS
    deal_cards()
    screen = "cards"
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
            gems.append({"x": mob["x"], "y": mob["y"]})
    mobs = alive


def need():
    return 2 + level * 2


def draw_bar(width):
    draw_rect(0, 590, width, 10, "#2fc9a8")


def deal_cards():
    global cards
    cards = []
    pool = []
    for skill in SKILLS:
        pool.append(skill)
    for i in range(3):
        pick = pool[random_int(0, len(pool) - 1)]
        cards.append(pick)
        pool.remove(pick)


def picked_number():
    global held
    number = 0
    if key_pressed("1"):
        number = 1
    if key_pressed("2"):
        number = 2
    if key_pressed("3"):
        number = 3
    fresh = number
    if number == held:
        fresh = 0
    held = number
    if clicked():
        for i in range(3):
            if mouse_y() >= 180 + i * 120 and mouse_y() <= 280 + i * 120:
                fresh = i + 1
    return fresh


def take_card(skill):
    global picks, screen
    owned.append(skill)
    picks -= 1
    deal_cards()
    if picks <= 0:
        screen = "play"


def check_level():
    global xp, level, screen, picks
    if xp >= need():
        xp -= need()
        level += 1
        picks += 1
        deal_cards()
        screen = "cards"


def take_gems():
    global gems, xp
    kept = []
    for gem in gems:
        if near(gem, hero, 150):
            step_to(gem, hero, 6)
        if near(gem, hero, 40):
            xp += 1
        else:
            kept.append(gem)
    gems = kept


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


def update_play():
    global tick, screen
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
    check_level()
    check_hits()
    if hero["hp"] <= 0:
        screen = "over"


def update():
    number = picked_number()
    if screen == "play":
        update_play()
    elif screen == "cards":
        if number > 0:
            take_card(cards[number - 1])
    elif key_pressed("space"):
        start_game()


def draw_title():
    clear("#2b2438")
    draw_text("HẦM NGỌC", 300, 220, 64)
    draw_thing(hero["image"], 300, 320, 5)
    draw_text("Bấm Space để vào hầm", 300, 430)


def draw_play():
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
    draw_text("Quái: " + str(len(mobs)), 540, 24)
    draw_text("Hạ: " + str(kills), 300, 24)
    draw_rect(0, 588, 600, 12, "#33334a")
    draw_bar(600 * xp / need())
    draw_text("Cấp " + str(level), 180, 24)
    for i in range(len(owned)):
        skill = owned[i]
        draw_skill(skill, 20 + i * 20, 570, 1)


def draw_skill(skill, x, y, size):
    draw_thing("skill-" + skill["branch"] + "-" + str(skill["icon"]), x, y, size)


def draw_cards():
    draw_rect(40, 80, 520, 460, "#101018")
    draw_text("Chọn một thẻ", 300, 115, 40)
    draw_text("Bấm 1, 2, 3 để chọn", 300, 156, 20)
    for i in range(len(cards)):
        skill = cards[i]
        y = 180 + i * 120
        draw_rect(60, y, 480, 100, "#33334a")
        draw_skill(skill, 110, y + 50, 4)
        draw_text(str(i + 1), 76, y + 20)
        draw_text(skill["name"], 340, y + 50)


def draw():
    if screen == "title":
        draw_title()
    else:
        draw_play()
    if screen == "cards":
        draw_cards()
    if screen == "over":
        draw_text("Thua rồi!", 300, 250, 48)
        draw_text("Bấm Space để chơi lại", 300, 320)


start_game()
screen = "title"
