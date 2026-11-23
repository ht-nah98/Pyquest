from pyquest import *

START_HP = 5
hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
START_PICKS = 1
START_WAVE = 0
START_SKILLS = [0, 0, 6, 6]
held = 0

SKILLS = []
SKILLS.append({"name": "Đốm Lửa: đạn mạnh hơn", "branch": "fire", "icon": 1, "what": "power", "add": 1})
SKILLS.append({"name": "Vòng Lửa: đốt quái gần", "branch": "fire", "icon": 2, "what": "ring", "add": 2})
SKILLS.append({"name": "Nổ Tung: quái thua nổ", "branch": "fire", "icon": 4, "what": "boom", "add": 2})
SKILLS.append({"name": "Đòn Buốt: đạn làm chậm", "branch": "ice", "icon": 1, "what": "slow", "add": 60})
SKILLS.append({"name": "Vòng Sương: tỏa lạnh", "branch": "ice", "icon": 4, "what": "frost", "add": 80})
SKILLS.append({"name": "Áo Băng: bất tử lâu", "branch": "ice", "icon": 3, "what": "armor", "add": 40})
SKILLS.append({"name": "Tay Chớp: bắn nhanh", "branch": "spark", "icon": 1, "what": "fast", "add": 5})
SKILLS.append({"name": "Tia Đôi: thêm 1 viên", "branch": "spark", "icon": 2, "what": "extra", "add": 1})
SKILLS.append({"name": "Mây Giông: sét đánh", "branch": "spark", "icon": 3, "what": "cloud", "add": 3})
BRANCHES = []
BRANCHES.append({"branch": "fire", "name": "Lửa", "combo": "Lò Than"})
BRANCHES.append({"branch": "ice", "name": "Băng", "combo": "Thấu Xương"})
BRANCHES.append({"branch": "spark", "name": "Sét", "combo": "Bão Sét"})
MOBS = {}
MOBS["slime"] = {"image": "mob-slime", "hp": 3, "speed": 1, "size": 2, "xp": 1}
MOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}
MOBS["golem"] = {"image": "mob-golem", "hp": 8, "speed": 1, "size": 3, "xp": 3}
MOBS["boss"] = {"image": "boss-1", "hp": 12, "speed": 1, "size": 6, "xp": 9}
WAVES = []
WAVES.append({"mob": "slime", "lead": "bat", "every": 3, "count": 3, "gap": 40})
WAVES.append({"mob": "slime", "lead": "bat", "every": 2, "count": 12, "gap": 40})
WAVES.append({"mob": "bat", "lead": "golem", "every": 3, "count": 15, "gap": 40})


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


def make_mob(name, x, y):
    row = MOBS[name]
    mob = {"image": row["image"], "x": x, "y": y, "hp": 3, "speed": 1, "size": 2, "xp": 1, "slow": 0}
    mob["hp"] = row["hp"]
    mob["max"] = row["hp"]
    mob["speed"] = row["speed"]
    mob["size"] = row["size"]
    mob["xp"] = row["xp"]
    return mob


def spawn_next(row):
    name = row["mob"]
    if left % row["every"] == 0:
        name = row["lead"]
    spawn_mob(name)


def next_wave():
    global wave, left, screen
    if wave + 1 == len(WAVES):
        screen = "win"
        return
    wave += 1
    row = WAVES[wave]
    left = row["count"]
    if wave > START_WAVE:
        hero["hp"] += 1


def run_wave():
    global left
    row = WAVES[wave]
    if left > 0:
        if tick % row["gap"] == 0:
            spawn_next(row)
            left -= 1
    elif len(mobs) == 0:
        next_wave()


def far_edge(value):
    if value < 300:
        return 580
    return 20


def spawn_mob(name):
    x = random_int(20, 580)
    y = far_edge(hero["y"])
    if random_int(1, 2) == 1:
        x = far_edge(hero["x"])
        y = random_int(20, 580)
    mobs.append(make_mob(name, x, y))


def add_skill(skill):
    owned.append(skill)
    bonus[skill["what"]] += skill["add"]


def count_branch(branch):
    total = 0
    for skill in owned:
        if skill["branch"] == branch:
            total += 1
    return total


def has_combo(branch):
    return count_branch(branch) >= 2


def start_game():
    global mobs, shots, gems, owned, bonus, picks, wave, tick, safe, wait, kills, xp, level, screen
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
    bonus = {"power": 0, "ring": 0, "boom": 0, "slow": 0, "frost": 0, "armor": 0}
    bonus["fast"] = 0
    bonus["extra"] = 0
    bonus["cloud"] = 0
    bonus["speed"] = 0
    for number in START_SKILLS:
        add_skill(SKILLS[number])
    picks = START_PICKS
    deal_cards()
    screen = "cards"
    wave = START_WAVE - 1
    next_wave()


def move_hero():
    if key_pressed("right"):
        hero["x"] += hero["speed"]
    if key_pressed("left"):
        hero["x"] -= hero["speed"]
    if key_pressed("up"):
        hero["y"] -= hero["speed"]
    if key_pressed("down"):
        hero["y"] += hero["speed"]
    for axis in ["x", "y"]:
        if hero[axis] < 24:
            hero[axis] = 24
        if hero[axis] > 576:
            hero[axis] = 576


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
    return {"x": hero["x"], "y": hero["y"], "vx": vx, "vy": vy, "live": True}


def shoot():
    global wait
    wait -= 1
    if wait <= 0 and len(mobs) > 0:
        shots.append(make_shot(nearest()))
        for i in range(bonus["extra"]):
            shots.append(make_shot(mobs[random_int(0, len(mobs) - 1)]))
        wait = 30 - bonus["fast"]
        if wait < 8:
            wait = 8


def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]


def hurt(mob, amount):
    if has_combo("ice") and mob["slow"] > 0:
        amount += 3
    mob["hp"] -= amount


def blast(center, size, amount):
    for mob in mobs:
        if near(mob, center, size):
            hurt(mob, amount)


def use_skills():
    if len(mobs) == 0:
        return
    if bonus["ring"] > 0 and tick % 60 == 0:
        blast(hero, 130, bonus["ring"])
    if bonus["cloud"] > 0 and tick % 60 == 30:
        hurt(mobs[random_int(0, len(mobs) - 1)], bonus["cloud"])
    if has_combo("spark") and tick % 90 == 0:
        blast(hero, 900, 2)


def hit_mobs():
    for shot in shots:
        for mob in mobs:
            if near(shot, mob, 10 + 10 * mob["size"]) and shot["live"]:
                hurt(mob, 1 + bonus["power"])
                mob["slow"] += bonus["slow"]
                shot["live"] = False
                if has_combo("fire"):
                    blast(shot, 90, 1)


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
            gems.append({"x": mob["x"], "y": mob["y"], "xp": mob["xp"]})
            if bonus["boom"] > 0:
                blast(mob, 90, bonus["boom"])
    mobs = alive


def need():
    return 2 + level * 2


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
            if mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120:
                fresh = i + 1
    return fresh


def take_card(skill):
    global picks, screen
    add_skill(skill)
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
            xp += gem["xp"]
        else:
            kept.append(gem)
    gems = kept


def check_hits():
    global safe
    if safe > 0:
        safe -= 1
        return
    for mob in mobs:
        if near(mob, hero, 16 + 10 * mob["size"]):
            hero["hp"] -= 1
            safe = 60 + bonus["armor"]
            return


def step_to(thing, target, speed):
    for axis in ["x", "y"]:
        if thing[axis] < target[axis]:
            thing[axis] += speed
        if thing[axis] > target[axis]:
            thing[axis] -= speed


def move_mobs():
    for mob in mobs:
        speed = mob["speed"]
        if near(mob, hero, bonus["frost"]):
            mob["slow"] += 2
        if mob["slow"] > 0:
            mob["slow"] -= 1
            speed = speed / 2
        step_to(mob, hero, speed)
        mob["x"] += random_int(-1, 1)
        mob["y"] += random_int(-1, 1)


def update_play():
    global tick, screen
    tick += 1
    run_wave()
    move_hero()
    move_mobs()
    shoot()
    move_shots()
    hit_mobs()
    use_skills()
    remove_shots()
    remove_dead()
    take_gems()
    check_hits()
    if screen == "play":
        check_level()
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
        if mob["slow"] > 0:
            draw_circle(mob["x"], mob["y"], 9 * mob["size"], "#7fd8ff")
        draw_thing(mob["image"], mob["x"], mob["y"], mob["size"])
        if mob["size"] > 4:
            draw_rect(mob["x"] - 50, mob["y"] - 60, 100 * mob["hp"] / mob["max"], 8, "#ff6b6b")
    if safe % 10 < 5:
        draw_thing(hero["image"], hero["x"], hero["y"], 3)
    draw_text(hero["name"], hero["x"], hero["y"] - 36, 18)
    draw_text("Máu: " + str(hero["hp"]), 60, 24)
    draw_text("Đợt " + str(wave + 1) + "/" + str(len(WAVES)), 530, 24)
    draw_text("Hạ: " + str(kills), 300, 24)
    draw_rect(0, 588, 600, 12, "#33334a")
    draw_rect(0, 590, 600 * xp / need(), 10, "#2fc9a8")
    draw_text("Cấp " + str(level), 180, 24)
    for i in range(len(BRANCHES)):
        row = BRANCHES[i]
        text = row["name"] + " " + str(count_branch(row["branch"]))
        if has_combo(row["branch"]):
            text = row["combo"]
        draw_text(text, 400 + i * 80, 570, 20)
    for i in range(len(owned)):
        skill = owned[i]
        draw_skill(skill, 20 + i * 20, 570, 1)


def draw_skill(skill, x, y, size):
    draw_thing("skill-" + skill["branch"] + "-" + str(skill["icon"]), x, y, size)


def draw_cards():
    draw_rect(40, 80, 520, 460, "#101018")
    draw_text("Chọn một thẻ", 300, 120, 40)
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
    if screen == "win":
        draw_text("Em thắng rồi!", 300, 250, 48)
    if screen == "over":
        draw_text("Thua rồi!", 300, 250, 48)
        draw_text("Bấm Space để chơi lại", 300, 320)


start_game()
screen = "title"
