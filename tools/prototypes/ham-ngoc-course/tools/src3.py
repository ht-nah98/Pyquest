"""h13 to h18: cards, combos, waves and a boss, heroes, effects, release."""
from build import ex, goal, run_goal, hold

# ---------------------------------------------------------------- h13
KEYS3 = '''if key_pressed("1"):
    number = 1
if key_pressed("2"):
    number = 2
if key_pressed("3"):
    number = 3'''
ex(
    "h13-e1", "Chọn thẻ bằng phím",
    "picked_number() trả về số thẻ em chọn: 0 là chưa chọn. Viết 3 chữ if: bấm \"1\" thì number = 1, bấm \"2\" thì number = "
    "2, bấm \"3\" thì number = 3. Vào hầm được chọn 3 thẻ để thử.",
    ["Trong picked_number(), giữa number = 0 và return number: if key_pressed(\"1\"): rồi number = 1",
     "Làm y hệt cho \"2\" và \"3\". Tên phím là chữ nên có ngoặc kép, number là số nên không có.",
     "update() đã gọi picked_number(): số lớn hơn 0 thì lấy thẻ cards[number - 1].",
     "Vì sao trừ 1? Phím đếm từ 1, còn danh sách đếm từ 0.",
     "Bấm ▶ Chạy: máy bấm Space, rồi 1, 2, 3. Đủ 3 thẻ thì vào hầm."],
    ["if key_pressed(\"1\"):\n    number = 1", "Đừng xóa number = 0 ở trên: không bấm gì thì là 0.",
     "return number đứng cuối hàm, ngoài các chữ if."],
    [run_goal(),
     goal("all", "varEquals", "Phím 1, 2, 3 đều chọn được", name="screen", value="play"),
     goal("wait", "varCompare", "Không bấm thì chưa chọn", name="tick", op="<=", value=42),
     goal("icons", "drewCount", "Thẻ đã chọn hiện dưới sân", sprite="skill", min=3)],
    prep=[('''let_go = True
cards = []
clashes = 0
''', '''START_PICKS = 3
held = 0
'''), ('''        let_go = False
        screen = "cards"
''', '''        screen = "cards"
'''), ('''    draw_text("Bấm Space để bốc thẻ", 300, 156, 20)
''', '''    draw_text("Bấm 1, 2, 3 để chọn", 300, 156, 20)
'''), ('''start_game()
screen = "cards"
''', '''start_game()
screen = "title"
'''), ('''def check_cards():
    global clashes
    if len(cards) != 3:
        clashes += 1
        return
    if cards[0] == cards[1] or cards[0] == cards[2] or cards[1] == cards[2]:
        clashes += 1


''', '''def picked_number():
    number = 0
    # Em viết tiếp ở đây
    return number


def take_card(skill):
    global picks, screen
    owned.append(skill)
    picks -= 1
    deal_cards()
    if picks <= 0:
        screen = "play"


'''), ('''    global xp, level, screen, let_go
''', '''    global xp, level, screen, picks
'''), ('''        screen = "cards"


def take_gems''', '''        picks += 1
        deal_cards()
        screen = "cards"


def take_gems'''), ('''def update():
    global screen, let_go
    if screen == "play":
        update_play()
    elif screen == "cards":
        if not key_pressed("space"):
            let_go = True
        if let_go and key_pressed("space"):
            let_go = False
            deal_cards()
            check_cards()
''', '''def update():
    number = picked_number()
    if screen == "play":
        update_play()
    elif screen == "cards":
        if number > 0:
            take_card(cards[number - 1])
'''), ('''    global mobs, shots, gems, tick, safe, wait, kills, xp, level, screen
''', '''    global mobs, shots, gems, owned, picks, tick, safe, wait, kills, xp, level, screen
'''), ('''    screen = "play"
    for''', '''    owned = []
    picks = START_PICKS
    deal_cards()
    screen = "cards"
    for'''), ('''    draw_text("Cấp " + str(level), 180, 24)
''', '''    draw_text("Cấp " + str(level), 180, 24)
    for i in range(len(owned)):
        skill = owned[i]
        draw_skill(skill, 20 + i * 20, 570, 1)
'''), ('''        draw_text(skill["name"], 340, y + 50)
''', '''        draw_text(str(i + 1), 76, y + 20)
        draw_text(skill["name"], 340, y + 50)
''')],
    fills=[KEYS3],
    wrong=[("thiếu phím 3", ["\n".join(KEYS3.split("\n")[:4])], []),
           ("lúc nào cũng là 1", ["number = 1"], []),
           ("dùng chữ thay cho số phím", [KEYS3.replace('key_pressed("3")', 'key_pressed("space")')], [])],
    test={"frames": 100, "taps": [5], "keys": [hold("1", 20, 20), hold("2", 40, 40), hold("3", 60, 60)]},
    new="phím số; phím đếm từ 1, danh sách đếm từ 0",
    reorganised="Bỏ check_cards, clashes, let_go; game lại mở ở màn chờ. Vào ván là được chọn START_PICKS thẻ; lên cấp được thêm "
                "1 lượt chọn (picks). update() gọi picked_number() mọi khung. Thẻ đã lấy nằm trong owned.")

HELD = '''fresh = number
if number == held:
    fresh = 0
held = number'''
ex(
    "h13-e2", "Bấm mới tính",
    "Giữ phím 1 một chút là bay mất 3 thẻ! held nhớ số của khung trước. Viết: fresh = number; nếu number == held thì fresh "
    "= 0 (đang giữ, không tính); rồi held = number. Cuối hàm return fresh.",
    ["Dưới các chữ if: fresh = number",
     "if number == held: rồi thụt vào fresh = 0. Giống khung trước nghĩa là em đang giữ phím.",
     "held = number: nhớ lại cho khung sau.",
     "Đổi return number thành return fresh.",
     "Bấm ▶ Chạy: máy giữ phím 2 thật lâu mà chỉ được 1 thẻ."],
    ["Phải gán held = number sau khi đã so sánh.",
     "fresh = number\nif number == held:\n    fresh = 0\nheld = number",
     "Dòng cuối: return fresh"],
    [run_goal(),
     goal("picks", "varEquals", "Giữ phím chỉ được 1 thẻ, bấm lại được thêm 1", name="picks", value=1),
     goal("cards", "varEquals", "Còn thẻ thì vẫn ở màn chọn", name="screen", value="cards")],
    prep=[('''def picked_number():
    number = 0
''', '''def picked_number():
    global held
    number = 0
'''), ('''        number = 3
    return number
''', '''        number = 3
    # Em viết tiếp ở đây
    return number
''')],
    fills=[HELD],
    sol=[("    held = number\n    return number\n", "    held = number\n    return fresh\n")],
    wrong=[("quên nhớ held", ["fresh = number\nif number == held:\n    fresh = 0"], [("        fresh = 0\n    return number\n", "        fresh = 0\n    return fresh\n")]),
           ("nhớ held trước khi so", ["fresh = number\nheld = number\nif number == held:\n    fresh = 0"], [("        fresh = 0\n    return number\n", "        fresh = 0\n    return fresh\n")]),
           ("vẫn return number", [HELD], [])],
    test={"frames": 120, "taps": [5], "keys": [hold("2", 20, 50), hold("2", 80, 80)]},
    new="phím mới bấm = khung này bấm mà khung trước chưa bấm",
    reorganised="held (đặt sẵn ở Bài tập 1) giờ được dùng.")

CLICK = '''if clicked():
    for i in range(3):
        if mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120:
            fresh = i + 1'''
ex(
    "h13-e3", "Chọn thẻ bằng chuột",
    "Thẻ số i nằm từ y = 180 + i * 120 tới 280 + i * 120. Nếu clicked(): lặp i từ 0 tới 2; nếu mouse_y() lớn hơn mép trên và "
    "nhỏ hơn mép dưới của thẻ i thì fresh = i + 1.",
    ["Dưới held = number, trên return fresh: if clicked():",
     "clicked() chỉ đúng trong 1 khung nên không sợ giữ chuột.",
     "Thụt vào: for i in range(3): ba thẻ, i là 0, 1, 2.",
     "Thụt thêm: if mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120:",
     "Trong cùng: fresh = i + 1. Bấm vào khe giữa hai thẻ thì không tính.",
     "Bấm ▶ Chạy, rồi ⛶ và bấm thẻ bằng chuột hoặc ngón tay."],
    ["Giống inside ở Bài 10 Bay Qua Khe, nhưng chỉ cần xét y.",
     "Mép trên thẻ 0 là 180, thẻ 1 là 300, thẻ 2 là 420.",
     "if mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120:\n    fresh = i + 1"],
    [run_goal(),
     goal("two", "varEquals", "Bấm vào 2 thẻ thì được 2 thẻ", name="picks", value=1),
     goal("cards", "varEquals", "Bấm ra ngoài thì không tính", name="screen", value="cards"),
     goal("take", "called", "Có lấy thẻ", name="take_card", min=2)],
    prep=[('''    held = number
''', '''    held = number
    # Em viết tiếp ở đây
''')],
    fills=[CLICK],
    wrong=[("bấm đâu cũng tính", ["if clicked():\n    fresh = 1"], []),
           ("chỉ xét mép trên", [CLICK.replace(" and mouse_y() < 280 + i * 120", "")], []),
           ("chỉ bấm được thẻ đầu", ['''if clicked():
    if mouse_y() > 180 and mouse_y() < 280:
        fresh = 1'''], [])],
    test={"frames": 120, "taps": [5], "clicks": [{"frame": 20, "x": 300, "y": 230}, {"frame": 40, "x": 300, "y": 60},
                                                 {"frame": 60, "x": 300, "y": 470}, {"frame": 80, "x": 300, "y": 290}]},
    new="clicked(), mouse_y(): bấm trúng khung nào",
    reorganised="")

# ---------------------------------------------------------------- h14
USE = '''if bonus["ring"] > 0 and tick % 60 == 0:
    blast(hero, 130, bonus["ring"])
if bonus["cloud"] > 0 and tick % 60 == 30:
    strike(mobs[random_int(0, len(mobs) - 1)], bonus["cloud"])'''
ex(
    "h14-e1", "Skill có tác dụng thật",
    "bonus giữ tổng sức mạnh của các skill. (1) Trong add_skill: cộng skill[\"add\"] vào bonus[skill[\"what\"]]. (2) Trong "
    "use_skills: có \"ring\" thì cứ 60 khung blast quanh hero; có \"cloud\" thì khi tick % 60 == 30 strike một con ngẫu nhiên.",
    ["Chỗ (1), dưới owned.append(skill): bonus[skill[\"what\"]] += skill[\"add\"]",
     "skill[\"what\"] là tên ngăn. Vòng Lửa có what là \"ring\" nên ngăn bonus[\"ring\"] lớn lên.",
     "Chỗ (2): if bonus[\"ring\"] > 0 and tick % 60 == 0: rồi blast(hero, 130, bonus[\"ring\"])",
     "if bonus[\"cloud\"] > 0 and tick % 60 == 30:",
     "Thụt vào: strike(mobs[random_int(0, len(mobs) - 1)], bonus[\"cloud\"]). strike là sét đánh, vẽ luôn tia sét.",
     "Các skill khác chỉ cần đọc bonus ở đúng chỗ, code đã có sẵn: em tìm thử xem.",
     "START_SKILLS cho sẵn 5 Vòng Lửa, 3 Mây Giông; nhớt 24 máu (đồ thử). Nhìn số trên đầu: lửa trừ 10, sét trừ 9."],
    ["Một dòng chỗ (1) đủ cho mọi skill trong bảng.",
     "bonus[skill[\"what\"]] += skill[\"add\"]",
     "blast(hero, 130, bonus[\"ring\"])",
     "strike(mobs[random_int(0, len(mobs) - 1)], bonus[\"cloud\"])"],
    [run_goal(),
     goal("blast", "called", "Vòng Lửa đốt đúng nhịp", name="blast", min=4),
     goal("strike", "called", "Mây Giông đánh sét đúng nhịp", name="strike", min=5),
     goal("bolt", "drewText", "Sét trừ 9 máu: 24 còn 15", text="15 máu"),
     goal("burn", "varCompare", "Lửa đủ mạnh, đủ rộng: hạ được quái", name="kills", op=">=", value=3),
     goal("beat", "varCompare", "Không ra đòn mỗi khung, không đốt cả sân", name="kills", op="<=", value=6)],
    prep=[('''START_PICKS = 3
''', '''START_PICKS = 1
START_SKILLS = [1, 1, 1, 1, 1, 8, 8, 8]
bolt = {"x": 0, "y": 0}
'''), ('''def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y, "hp": 2, "speed": 1}
''', '''def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y, "hp": 24, "speed": 1, "slow": 0}
'''), ('''def start_game():
    global mobs, shots, gems, owned, picks,''', '''def add_skill(skill):
    owned.append(skill)
    # Em viết tiếp ở đây (1)


def start_game():
    global mobs, shots, gems, owned, bonus, picks,'''), ('''    owned = []
    picks = START_PICKS
''', '''    owned = []
    bonus = {}
    for name in ["power", "ring", "boom", "slow", "frost", "armor", "fast", "extra", "cloud", "speed"]:
        bonus[name] = 0
    for number in START_SKILLS:
        add_skill(SKILLS[number])
    picks = START_PICKS
'''), ('''    owned.append(skill)
    picks -= 1
''', '''    add_skill(skill)
    picks -= 1
'''), ('''        shots.append(make_shot(nearest()))
        wait = 30
''', '''        shots.append(make_shot(nearest()))
        for i in range(bonus["extra"]):
            shots.append(make_shot(mobs[random_int(0, len(mobs) - 1)]))
        wait = 30 - bonus["fast"]
        if wait < 8:
            wait = 8
'''), ('''def hit_mobs():
''', '''def hurt(mob, amount):
    mob["hp"] -= amount


def blast(center, size, amount):
    for mob in mobs:
        if near(mob, center, size):
            hurt(mob, amount)


def strike(mob, amount):
    global bolt
    bolt = mob
    hurt(mob, amount)


def use_skills():
    if len(mobs) == 0:
        return
    # Em viết tiếp ở đây (2)


def hit_mobs():
'''), ('''                mob["hp"] -= 1
                shot["live"] = False
''', '''                hurt(mob, 1 + bonus["power"])
                mob["slow"] += bonus["slow"]
                shot["live"] = False
'''), ('''            gems.append({"x": mob["x"], "y": mob["y"]})
''', '''            gems.append({"x": mob["x"], "y": mob["y"]})
            if bonus["boom"] > 0:
                blast(mob, 90, bonus["boom"])
'''), ('''            safe = 60
''', '''            safe = 60 + bonus["armor"]
'''), ('''        step_to(mob, hero, mob["speed"])
''', '''        speed = mob["speed"]
        if near(mob, hero, bonus["frost"]):
            mob["slow"] += 2
        if mob["slow"] > 0:
            mob["slow"] -= 1
            speed = speed / 2
        step_to(mob, hero, speed)
'''), ('''    remove_shots()
    remove_dead()
''', '''    use_skills()
    remove_shots()
    remove_dead()
'''), ('''    for mob in mobs:
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
''', '''    if bonus["ring"] > 0 and tick % 60 < 10:
        draw_circle(hero["x"], hero["y"], 110, "#ff8a3c66")
    for mob in mobs:
        if mob["slow"] > 0:
            draw_circle(mob["x"], mob["y"], 18, "#7fd8ff")
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
        draw_text(str(mob["hp"]) + " máu", mob["x"], mob["y"] - 20, 16)
    if bonus["cloud"] > 0 and tick % 60 >= 30 and tick % 60 < 40:
        draw_line(bolt["x"], 0, bolt["x"], bolt["y"], "#ffe14d", 4)
''')],
    fills=['bonus[skill["what"]] += skill["add"]', USE],
    wrong=[("quên cộng vào bonus", ["", USE], []),
           ("luôn cộng vào power", ['bonus["power"] += skill["add"]', USE], []),
           ("quên Mây Giông", ['bonus[skill["what"]] += skill["add"]', "\n".join(USE.split("\n")[:2])], []),
           ("quên Vòng Lửa", ['bonus[skill["what"]] += skill["add"]', "\n".join(USE.split("\n")[2:])], []),
           ("gán = thay vì cộng +=", ['bonus[skill["what"]] = skill["add"]', USE], []),
           ("cộng 1 thay vì cộng add", ['bonus[skill["what"]] += 1', USE], []),
           ("đốt mỗi khung", ['bonus[skill["what"]] += skill["add"]', USE.replace(" and tick % 60 == 0", "")], []),
           ("sét mỗi khung", ['bonus[skill["what"]] += skill["add"]', USE.replace(" and tick % 60 == 30", "")], []),
           ("đốt cả sân", ['bonus[skill["what"]] += skill["add"]', USE.replace("130", "1300")], []),
           ("đốt quá hẹp", ['bonus[skill["what"]] += skill["add"]', USE.replace("130", "13")], []),
           ("lửa lúc nào cũng 1", ['bonus[skill["what"]] += skill["add"]', USE.replace('130, bonus["ring"]', "130, 1")], []),
           ("sét lúc nào cũng 1", ['bonus[skill["what"]] += skill["add"]', USE.replace('1)], bonus["cloud"]', "1)], 1")], []),
           ("sét cùng nhịp với lửa", ['bonus[skill["what"]] += skill["add"]', USE.replace("== 30", "== 0")], [])],
    test={"frames": 295, "taps": [5], "keys": [hold("1", 10, 10)] + [hold("1", f, f) for f in range(150, 295, 8)]},
    new="tên ngăn lấy từ biến: bonus[skill[\"what\"]]",
    reorganised="Thêm bonus, add_skill, hurt, blast, strike (tia sét), use_skills; Vòng Lửa hiện vòng cam, sét hiện tia vàng. Chỗ nào cần skill thì đọc bonus (shoot, hit_mobs, remove_dead, "
                "check_hits, move_mobs); START_SKILLS cho sẵn skill để thử. Nhớt 24 máu, số máu hiện trên đầu (đồ thử).")

COUNT = '''total = 0
for skill in owned:
    if skill["branch"] == branch:
        total += 1
return total'''
ex(
    "h14-e2", "Đếm skill theo nhánh",
    "count_branch(branch) đếm trong owned có mấy skill thuộc nhánh đó. Tạo total = 0; đi qua từng skill, skill nào có "
    "skill[\"branch\"] == branch thì total cộng 1; cuối cùng return total.",
    ["Trong count_branch, thay dòng return 0: total = 0",
     "for skill in owned: rồi thụt vào if skill[\"branch\"] == branch:",
     "Thụt thêm: total += 1",
     "Ngoài vòng for: return total",
     "Bấm ▶ Chạy: dưới sân hiện Lửa 2, Băng 0, Sét 1 ngay lúc vào ván."],
    ["branch là tham số: gọi count_branch(\"fire\") thì branch là \"fire\".",
     "if skill[\"branch\"] == branch:\n    total += 1",
     "return total nằm ngang với chữ for."],
    [run_goal(),
     goal("fire", "drewText", "Đếm đúng nhánh Lửa", text="Lửa 2"),
     goal("ice", "drewText", "Đếm đúng nhánh Băng", text="Băng 0"),
     goal("spark", "drewText", "Đếm đúng nhánh Sét", text="Sét 1")],
    prep=[("START_SKILLS = [1, 1, 1, 1, 1, 8, 8, 8]\n", "START_SKILLS = [0, 1, 6]\n"), ("\"hp\": 24,", "\"hp\": 8,"), ('''

def draw_thing''', '''BRANCHES = []
BRANCHES.append({"branch": "fire", "name": "Lửa"})
BRANCHES.append({"branch": "ice", "name": "Băng"})
BRANCHES.append({"branch": "spark", "name": "Sét"})


def draw_thing'''), ('''def start_game():
''', '''def count_branch(branch):
    # Em viết tiếp ở đây
    return 0


def start_game():
'''), ('''    for i in range(len(owned)):
''', '''    for i in range(len(BRANCHES)):
        row = BRANCHES[i]
        text = row["name"] + " " + str(count_branch(row["branch"]))
        draw_text(text, 400 + i * 80, 570, 20)
    for i in range(len(owned)):
''')],
    fills=[COUNT],
    sol=[("    return total\n    return 0\n", "    return total\n")],
    wrong=[("đếm hết mọi skill", ["return len(owned)"], []),
           ("return trong vòng lặp", ['''total = 0
for skill in owned:
    if skill["branch"] == branch:
        total += 1
    return total'''], []),
           ("so với chữ branch", ['''total = 0
for skill in owned:
    if skill["branch"] == "branch":
        total += 1
return total'''], [])],
    test={"frames": 60, "taps": [5], "keys": [hold("1", 40, 40)]},
    new="đếm có điều kiện trong danh sách dict",
    reorganised="Nhớt 8 máu. Thêm bảng BRANCHES và dòng đếm ba nhánh dưới sân.")

CB = ["return count_branch(branch) >= 2", 'if has_combo("ice") and mob["slow"] > 0:\n    amount += 3',
      'if has_combo("spark") and tick % 90 == 0:\n    storm()', 'if has_combo("fire"):\n    splash(shot)']
ex(
    "h14-e3", "Phối hợp",
    "Từ 2 skill cùng nhánh là có phối hợp. (1) has_combo trả về count_branch(branch) >= 2. (2) Băng: quái đang chậm thì đau "
    "thêm 3. (3) Sét: cứ 90 khung gọi storm(). (4) Lửa: đạn trúng thì gọi splash(shot).",
    ["Chỗ (1): return count_branch(branch) >= 2 (trả về True hoặc False).",
     "Chỗ (2), đầu hurt(): if has_combo(\"ice\") and mob[\"slow\"] > 0: rồi amount += 3",
     "Chỗ (3): if has_combo(\"spark\") and tick % 90 == 0: rồi storm(). storm nổ xa 1200: góc sân nào cũng tới.",
     "Chỗ (4), khi đạn trúng: if has_combo(\"fire\"): rồi splash(shot). Cả storm và splash đều viết sẵn bằng blast.",
     "Đồ thử: lúc đầu mỗi nhánh 1 skill, tới tick 100 có thêm LATE_SKILLS. Bấm ▶ Chạy xem tên 3 phối hợp hiện ra dưới sân.",
     "Chơi thử: đi theo 1 nhánh hay trộn 3 nhánh thì mạnh hơn?"],
    ["return count_branch(branch) >= 2",
     "if has_combo(\"ice\") and mob[\"slow\"] > 0:\n    amount += 3",
     "if has_combo(\"spark\") and tick % 90 == 0:\n    storm()",
     "if has_combo(\"fire\"):\n    splash(shot)"],
    [run_goal(),
     goal("one", "drewText", "Mới 1 skill Băng thì chưa có phối hợp", text="Băng 1"),
     goal("fire", "drewText", "Đủ 2 thì mở được Lò Than", text="Lò Than"),
     goal("ice", "drewText", "Đủ 2 thì mở được Thấu Xương", text="Thấu Xương"),
     goal("spark", "drewText", "Đủ 2 thì mở được Bão Sét", text="Bão Sét"),
     goal("early", "varEquals", "Chưa có phối hợp thì không nổ, không bão", name="early", value=0),
     goal("soft", "varEquals", "Chưa có phối hợp thì đạn chỉ trừ 1", name="early_hit", value=1),
     goal("storm", "called", "Bão Sét nổ đúng nhịp", name="storm", min=1),
     goal("splash", "called", "Lò Than nổ lan khi đạn trúng", name="splash", min=2),
     goal("chill", "drewText", "Thấu Xương: quái chậm đau thêm 3", text="Trúng: 4"),
     goal("slow", "varEquals", "Quái chưa chậm thì không đau thêm", name="hit", value=1)],
    prep=[("START_SKILLS = [0, 1, 6]\n", "START_SKILLS = [3, 6]\nLATE_SKILLS = [1, 5, 7]\ncombos = 0\nhit = 0\nearly = 0\nearly_hit = 0\n"),
          ('''    global tick, screen
    tick += 1
''', '''    global tick, screen, early, early_hit
    tick += 1
    if tick == 100:
        early = combos
        early_hit = hit
        for number in LATE_SKILLS:
            add_skill(SKILLS[number])
'''), ('''def hit_mobs():
    for''', '''def hit_mobs():
    global hit
    for'''), ('''                hurt(mob, 1 + bonus["power"])
''', '''                before = mob["hp"]
                hurt(mob, 1 + bonus["power"])
                hit = before - mob["hp"]
'''), ('''    draw_text("Cấp " + str(level), 180, 24)
''', '''    draw_text("Cấp " + str(level), 180, 24)
    draw_text("Trúng: " + str(hit), 420, 24)
'''), ('''"branch": "fire", "name": "Lửa"})
''', '''"branch": "fire", "name": "Lửa", "combo": "Lò Than"})
'''), ('''"branch": "ice", "name": "Băng"})
''', '''"branch": "ice", "name": "Băng", "combo": "Thấu Xương"})
'''), ('''"branch": "spark", "name": "Sét"})
''', '''"branch": "spark", "name": "Sét", "combo": "Bão Sét"})
'''), ('''def start_game():
''', '''def has_combo(branch):
    # Em viết tiếp ở đây (1)
    return False


def start_game():
'''), ('''def hurt(mob, amount):
''', '''def hurt(mob, amount):
    # Em viết tiếp ở đây (2)
'''), ('''def strike(''', '''def storm():
    global combos
    combos += 1
    blast(hero, 1200, 2)


def splash(shot):
    global combos
    combos += 1
    blast(shot, 90, 2)


def strike('''), ('''

def hit_mobs():
''', '''    # Em viết tiếp ở đây (3)


def hit_mobs():
'''), ('''                shot["live"] = False
''', '''                shot["live"] = False
                # Em viết tiếp ở đây (4)
'''), ('''        draw_text(text, 400 + i * 80, 570, 20)
''', '''        if has_combo(row["branch"]):
            text = row["combo"]
        draw_text(text, 400 + i * 80, 570, 20)
''')],
    fills=CB,
    sol=[("    return count_branch(branch) >= 2\n    return False\n", "    return count_branch(branch) >= 2\n")],
    wrong=[("quên Băng", ["return count_branch(branch) >= 2", "", CB[2], CB[3]], [("    return count_branch(branch) >= 2\n    return False\n", "    return count_branch(branch) >= 2\n")]),
           ("quên Sét", ["return count_branch(branch) >= 2", CB[1], "", CB[3]], [("    return count_branch(branch) >= 2\n    return False\n", "    return count_branch(branch) >= 2\n")]),
           ("quên Lửa", ["return count_branch(branch) >= 2", CB[1], CB[2], ""], [("    return count_branch(branch) >= 2\n    return False\n", "    return count_branch(branch) >= 2\n")]),
           ("chỉ hiện tên, không có tác dụng", ["return count_branch(branch) >= 2", "", "", ""], [("    return count_branch(branch) >= 2\n    return False\n", "    return count_branch(branch) >= 2\n")]),
           ("lúc nào cũng có phối hợp mà quên tác dụng", ["return True", "", "", ""], []),
           ("cần tới 3 skill", ["return count_branch(branch) >= 3", 'if has_combo("ice") and mob["slow"] > 0:\n    amount += 3',
           CB[2], CB[3]], []),
           ("1 skill đã có phối hợp", [CB[0].replace(">= 2", ">= 1")] + CB[1:], []),
           ("lúc nào cũng có phối hợp", ["return True"] + CB[1:], []),
           ("nổ lan mà không hỏi has_combo", CB[:3] + ["splash(shot)"], []),
           ("bão mà không hỏi has_combo", [CB[0], CB[1], "if tick % 90 == 0:\n    storm()", CB[3]], []),
           ("bão mỗi khung", [CB[0], CB[1], 'if has_combo("spark"):\n    storm()', CB[3]], []),
           ("Thấu Xương mà không hỏi has_combo", [CB[0], 'if mob["slow"] > 0:\n    amount += 3', CB[2], CB[3]], []),
           ("Thấu Xương mà không hỏi slow", [CB[0], 'if has_combo("ice"):\n    amount += 3', CB[2], CB[3]], []),
           ("đau thêm 1 thôi", [CB[0], CB[1].replace("3", "1"), CB[2], CB[3]], []),
           ("gán amount = 3", [CB[0], CB[1].replace("+= 3", "= 3"), CB[2], CB[3]], [])],
    test={"frames": 260, "taps": [5], "keys": [hold("1", 10, 10)] + [hold("1", f, f) for f in range(120, 260, 8)]},
    new="hàm trả về True/False mở thêm luật; bảng BRANCHES giữ tên",
    reorganised="Thêm storm(), splash(shot); đồ thử: LATE_SKILLS thêm skill ở tick 100, hit và chữ Trúng là phát vừa rồi trừ mấy máu, combos đếm số lần nổ và bão, early / early_hit nhớ hai số đó trước khi có phối hợp. Bảng BRANCHES thêm ngăn combo; đủ 2 skill thì dưới sân hiện tên phối hợp.")

# ---------------------------------------------------------------- h15
TWO = '''MOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}
MOBS["golem"] = {"image": "mob-golem", "hp": 8, "speed": 1, "size": 3, "xp": 3}'''
COPY = '''mob["hp"] = row["hp"]
mob["speed"] = row["speed"]
mob["size"] = row["size"]
mob["xp"] = row["xp"]'''
ex(
    "h15-e1", "Bảng quái",
    "Quái cũng thành bảng: MOBS[\"slime\"] là một hộp. (1) Thêm MOBS[\"bat\"]: hình mob-bat, hp 2, speed 2, size 2, xp 1 và "
    "MOBS[\"golem\"]: hình mob-golem, hp 8, speed 1, size 3, xp 3. (2) Trong make_mob, chép hp, speed, size, xp từ row sang mob.",
    ["Chỗ (1): MOBS[\"bat\"] = {\"image\": \"mob-bat\", \"hp\": 2, \"speed\": 2, \"size\": 2, \"xp\": 1}",
     "Golem: hp 8, speed 1, size 3, xp 3. Lì đòn hơn nhưng cho nhiều ngọc hơn.",
     "Chỗ (2): row là dòng của con đó trong bảng. Viết mob[\"hp\"] = row[\"hp\"]",
     "Làm y hệt cho \"speed\", \"size\" và \"xp\".",
     "Vì sao phải chép? Mỗi con cần hp riêng, nếu dùng chung hộp thì một con đau là cả bầy đau.",
     "Nhớt giờ có 3 máu. Chữ trên đầu là máu và cỡ, số trên ngọc là xp: đồ thử để em thấy bảng có tác dụng, Bài tập 3 bỏ đi.",
     "Bấm ▶ Chạy, rồi ⛶: dơi nhanh, golem (người đá) to và lì đòn."],
    ["Bảng này dùng tên làm chìa: MOBS[name] lấy đúng dòng.",
     "mob[\"hp\"] = row[\"hp\"]\nmob[\"speed\"] = row[\"speed\"]",
     "size là cỡ vẽ, cũng là cỡ va chạm."],
    [run_goal(),
     goal("bat", "drewCount", "Có dơi", sprite="mob-bat", min=1),
     goal("golem", "drewCount", "Có golem", sprite="mob-golem", min=1),
     goal("slime", "drewCount", "Vẫn có nhớt", sprite="mob-slime", min=2),
     goal("fastx", "staysWithin", "Dơi bay nhanh: đã vào sâu trong sân", sprite="mob-bat", axis="x", min=50, max=518, frames=[40, 41]),
     goal("fasty", "staysWithin", "Dơi bay nhanh theo cả chiều dọc", sprite="mob-bat", axis="y", min=50, max=518, frames=[40, 41]),
     goal("tough", "drewText", "Golem có 8 máu, cỡ 3", text="8 máu, cỡ 3"),
     goal("light", "drewText", "Dơi có 2 máu, cỡ 2", text="2 máu, cỡ 2"),
     goal("gem", "drewText", "Golem rơi ngọc +3", text="+3")],
    prep=[("START_SKILLS = [3, 6]\nLATE_SKILLS = [1, 5, 7]\ncombos = 0\nhit = 0\nearly = 0\nearly_hit = 0\n", "START_SKILLS = [0, 0, 0]\n"),
          ('''    global tick, screen, early, early_hit
    tick += 1
    if tick == 100:
        early = combos
        early_hit = hit
        for number in LATE_SKILLS:
            add_skill(SKILLS[number])
''', '''    global tick, screen
    tick += 1
'''), ('''def hit_mobs():
    global hit
''', '''def hit_mobs():
'''), ('''                before = mob["hp"]
                hurt(mob, 1 + bonus["power"])
                hit = before - mob["hp"]
''', '''                hurt(mob, 1 + bonus["power"])
'''), ('''    draw_text("Trúng: " + str(hit), 420, 24)
''', ''), ('''    global combos
    combos += 1
    blast(hero,''', '''    blast(hero,'''), ('''    global combos
    combos += 1
    blast(shot,''', '''    blast(shot,'''), ('''

def draw_thing''', '''MOBS = {}
MOBS["slime"] = {"image": "mob-slime", "hp": 3, "speed": 1, "size": 2, "xp": 1}
# Em viết tiếp ở đây (1)


def draw_thing'''), ('''def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y, "hp": 8, "speed": 1, "slow": 0}
''', '''def make_mob(name, x, y):
    row = MOBS[name]
    mob = {"image": row["image"], "x": x, "y": y, "hp": 3, "speed": 1, "size": 2, "xp": 1, "slow": 0}
    # Em viết tiếp ở đây (2)
    return mob
'''), ('''def spawn_mob():
    mobs.append(make_mob(random_int(20, 580), far_edge(hero["y"])))
''', '''def spawn_mob(name):
    x = random_int(20, 580)
    y = far_edge(hero["y"])
    if random_int(1, 2) == 1:
        x = far_edge(hero["x"])
        y = random_int(20, 580)
    mobs.append(make_mob(name, x, y))
'''), ('''    for i in range(6):
        mobs.append(make_mob(random_int(40, 560), 40))
''', '''    for name in MOBS:
        spawn_mob(name)
        spawn_mob(name)
'''), ('''        spawn_mob()
''', '''        spawn_mob("slime")
'''), ('''        if near(mob, hero, 36):
            hero["hp"]''', '''        if near(mob, hero, 16 + 10 * mob["size"]):
            hero["hp"]'''), ('''near(shot, mob, 30)''', '''near(shot, mob, 10 + 10 * mob["size"])'''), ('''{"x": mob["x"], "y": mob["y"]}''', '''{"x": mob["x"], "y": mob["y"], "xp": mob["xp"]}'''), ('''            xp += 1
''', '''            xp += gem["xp"]
'''), ('''            draw_circle(mob["x"], mob["y"], 18, "#7fd8ff")
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
        draw_text(str(mob["hp"]) + " máu", mob["x"], mob["y"] - 20, 16)
''', '''            draw_circle(mob["x"], mob["y"], 9 * mob["size"], "#7fd8ff")
        draw_thing(mob["image"], mob["x"], mob["y"], mob["size"])
        text = str(mob["hp"]) + " máu, cỡ " + str(mob["size"])
        draw_text(text, mob["x"], mob["y"] - 10 * mob["size"], 16)
'''), ('''        draw_thing("item-xp", gem["x"], gem["y"], 1)
''', '''        draw_thing("item-xp", gem["x"], gem["y"], 1)
        draw_text("+" + str(gem["xp"]), gem["x"], gem["y"] - 14, 18)
'''), ('''    if hero["x"] < 24:
        hero["x"] = 24
    if hero["x"] > 576:
        hero["x"] = 576
''', ''), ('''    if hero["y"] < 24:
        hero["y"] = 24
    if hero["y"] > 576:
        hero["y"] = 576
''', '''    for axis in ["x", "y"]:
        if hero[axis] < 24:
            hero[axis] = 24
        if hero[axis] > 576:
            hero[axis] = 576
'''), ('''    if thing["x"] < target["x"]:
        thing["x"] += speed
    if thing["x"] > target["x"]:
        thing["x"] -= speed
    if thing["y"] < target["y"]:
        thing["y"] += speed
    if thing["y"] > target["y"]:
        thing["y"] -= speed
''', '''    for axis in ["x", "y"]:
        if thing[axis] < target[axis] - speed / 2:
            thing[axis] += speed
        if thing[axis] > target[axis] + speed / 2:
            thing[axis] -= speed
''')],
    fills=['''MOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}
MOBS["golem"] = {"image": "mob-golem", "hp": 8, "speed": 1, "size": 3, "xp": 3}''', '''mob["hp"] = row["hp"]
mob["speed"] = row["speed"]
mob["size"] = row["size"]
mob["xp"] = row["xp"]'''],
    wrong=[("quên golem", ['MOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}', '''mob["hp"] = row["hp"]
mob["speed"] = row["speed"]
mob["size"] = row["size"]
mob["xp"] = row["xp"]'''], []),
           ("quên chép xp", [TWO, COPY.replace('\nmob["xp"] = row["xp"]', "")], []),
           ("quên chép hp", [TWO, COPY.replace('mob["hp"] = row["hp"]\n', "")], []),
           ("quên chép speed", [TWO, COPY.replace('mob["speed"] = row["speed"]\n', "")], []),
           ("quên chép size", [TWO, COPY.replace('mob["size"] = row["size"]\n', "")], []),
           ("golem cỡ 2", [TWO.replace('"size": 3', '"size": 2'), COPY], []),
           ("dơi nhầm máu", [TWO.replace('"mob-bat", "hp": 2', '"mob-bat", "hp": 20'), COPY], [])],
    test={"frames": 600, "taps": [5], "keys": [hold("1", f, f) for f in range(10, 600, 25)]},
    new="bảng tra theo tên: MOBS[name]; chép số từ bảng sang từng con",
    reorganised="Nhớt từ 8 về 3 máu. Số máu và số xp tạm hiện trên quái và ngọc. Sắp xếp lại lần 3: make_mob và spawn_mob nhận tên quái, quái ra cả bốn mép; va chạm theo size; ngọc mang "
                "xp của con quái; step_to và move_hero gom hai trục bằng for axis in [\"x\", \"y\"]; gần hơn nửa bước "
                "thì step_to thôi không bước, để con nhanh không nhảy qua lại quanh em.")

ex(
    "h15-e2", "Từng đợt quái",
    "WAVES là bảng các đợt. Viết run_wave(): row = WAVES[wave]. Nếu left > 0: cứ row[\"gap\"] khung thì spawn_next(row) và "
    "left bớt 1. Không thì, nếu hết quái (len(mobs) == 0): gọi next_wave().",
    ["Dòng đầu: row = WAVES[wave]: dòng của đợt này trong bảng.",
     "if left > 0: còn quái chưa ra.",
     "Thụt vào: if tick % row[\"gap\"] == 0: rồi thụt thêm spawn_next(row) và left -= 1",
     "elif len(mobs) == 0: ra hết rồi và hạ hết rồi. Thụt vào next_wave()",
     "Dùng elif: còn quái chưa ra thì chưa được sang đợt mới.",
     "Bấm ▶ Chạy: máy chơi hết đợt 1. Rồi ⛶: em tới được đợt mấy?"],
    ["left là số quái của đợt còn chờ ra.",
     "if tick % row[\"gap\"] == 0:\n    spawn_next(row)\n    left -= 1",
     "elif len(mobs) == 0:\n    next_wave()"],
    [run_goal(),
     goal("two", "drewText", "Qua đợt 1, tới đợt 2", text="Đợt 2/3"),
     goal("kills", "varCompare", "Phải hạ hết quái đợt 1", name="kills", op=">=", value=3),
     goal("bat", "drewCount", "Có dơi dẫn đầu", sprite="mob-bat", min=1),
     goal("wave", "varEquals", "Đang ở đợt 2, chưa nhảy tới đợt 3", name="wave", value=1),
     goal("left", "varCompare", "Quái ra từ từ từng con", name="left", op=">=", value=1)],
    prep=[("START_SKILLS = [0, 0, 0]\n", "START_SKILLS = [5]\n"), ('''

def draw_thing''', '''WAVES = []
WAVES.append({"mob": "slime", "lead": "bat", "every": 3, "count": 3, "gap": 40})
WAVES.append({"mob": "slime", "lead": "bat", "every": 2, "count": 12, "gap": 20})
WAVES.append({"mob": "bat", "lead": "golem", "every": 3, "count": 15, "gap": 40})


def draw_thing'''), ('''START_PICKS = 1
''', '''START_PICKS = 1
START_WAVE = 0
'''), ('''def far_edge(''', '''def spawn_next(row):
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
    # Em viết tiếp ở đây
    pass


def far_edge('''), ('''    for name in MOBS:
        spawn_mob(name)
        spawn_mob(name)
''', '''    wave = START_WAVE - 1
    next_wave()
'''), ('''bonus, picks, tick,''', '''bonus, picks, wave, tick,'''), ('''    tick += 1
    if tick % 50 == 0 and len(mobs) < 14:
        spawn_mob("slime")
''', '''    tick += 1
    run_wave()
'''), ('''    draw_text("Quái: " + str(len(mobs)), 540, 24)
''', '''    draw_text("Đợt " + str(wave + 1) + "/" + str(len(WAVES)), 530, 24)
'''), ('''    check_level()
    check_hits()
    if hero["hp"] <= 0:
''', '''    check_hits()
    if screen == "play":
        check_level()
    if hero["hp"] <= 0:
'''), ('''    if screen == "over":
        draw_text("Thua''', '''    if screen == "win":
        draw_text("Em thắng rồi!", 300, 250, 48)
    if screen == "over":
        draw_text("Thua''')],
    fills=['''row = WAVES[wave]
if left > 0:
    if tick % row["gap"] == 0:
        spawn_next(row)
        left -= 1
elif len(mobs) == 0:
    next_wave()'''],
    wrong=[("sang đợt khi còn quái", ['''row = WAVES[wave]
if left > 0:
    if tick % row["gap"] == 0:
        spawn_next(row)
        left -= 1
else:
    next_wave()'''], []),
           ("quên trừ left", ['''row = WAVES[wave]
if left > 0:
    if tick % row["gap"] == 0:
        spawn_next(row)
elif len(mobs) == 0:
    next_wave()'''], []),
           ("khung nào cũng ra quái", ['''row = WAVES[wave]
if left > 0:
    spawn_next(row)
    left -= 1
elif len(mobs) == 0:
    next_wave()'''], [])],
    test={"frames": 400, "taps": [5], "keys": [hold("1", f, f) for f in range(10, 400, 25)]},
    new="bảng WAVES điều khiển nhịp game; đếm số còn lại",
    reorganised="Thêm WAVES, START_WAVE, wave, left, spawn_next, next_wave (qua đợt được +1 máu), màn win. Bỏ cách ra quái cũ.")

BOSS = 'MOBS["boss"] = {"image": "boss-1", "hp": 12, "speed": 1, "size": 6, "xp": 9}'
BOSS_WAVE = 'WAVES.append({"mob": "bat", "lead": "boss", "every": 3, "count": 3, "gap": 60})'
ex(
    "h15-e3", "Trùm cuối",
    "(1) Thêm MOBS[\"boss\"]: hình boss-1, hp 12, speed 1, size 6, xp 9. (2) Thêm vào WAVES một dòng: mob \"bat\", lead "
    "\"boss\", every 3, count 3, gap 60. Trùm ra đầu tiên, dơi ra theo. (3) Đổi START_WAVE thành 3 để thử ngay trận trùm.",
    ["Chỗ (1): MOBS[\"boss\"] = {\"image\": \"boss-1\", \"hp\": 12, \"speed\": 1, \"size\": 6, \"xp\": 9}",
     "Chỗ (2): WAVES.append({\"mob\": \"bat\", \"lead\": \"boss\", \"every\": 3, \"count\": 3, \"gap\": 60})",
     "left là 3, 2, 1. Chỉ 3 chia hết cho 3, nên trùm ra đúng một lần và ra trước.",
     "Chỗ (3), gần đầu file: START_WAVE = 3 (đợt thứ tư, vì đếm từ 0).",
     "mob[\"max\"] nhớ máu lúc đầu: thanh đỏ dài 100 * hp / max, chữ ghi 12/12. Máu 12 là để thử, Bài 16 có trùm thật.",
     "Bấm ▶ Chạy: hạ trùm và dơi xong thì hiện Em thắng rồi!"],
    ["Trùm chỉ là một dòng trong bảng: to hơn, lì đòn hơn.",
     "MOBS[\"boss\"] = {\"image\": \"boss-1\", \"hp\": 12, \"speed\": 1, \"size\": 6, \"xp\": 9}",
     "START_WAVE = 3"],
    [run_goal(),
     goal("boss", "drewCount", "Trùm ra sân", sprite="boss", min=1),
     goal("big", "drewText", "Trùm to, đủ 12 máu", text="12/12"),
     goal("first", "staysWithin", "Trùm ra trước, sau 60 khung, đi từ từ", sprite="boss", axis="x", min=-60, max=10, frames=[75, 90]),
     goal("bat", "drewCount", "Dơi ra theo trùm", sprite="mob-bat", min=1),
     goal("win", "varEquals", "Hạ trùm thì thắng", name="screen", value="win"),
     goal("text", "drewText", "Có chữ thắng", text="Em thắng rồi!"),
     goal("kills", "varCompare", "Hạ cả trùm lẫn dơi", name="kills", op=">=", value=3)],
    prep=[('''"size": 3, "xp": 3}
''', '''"size": 3, "xp": 3}
# Em viết tiếp ở đây (1)
'''), ('''"every": 3, "count": 15, "gap": 40})
''', '''"every": 3, "count": 15, "gap": 40})
# Em viết tiếp ở đây (2)
'''), ('''        draw_thing(mob["image"], mob["x"], mob["y"], mob["size"])
        text = str(mob["hp"]) + " máu, cỡ " + str(mob["size"])
        draw_text(text, mob["x"], mob["y"] - 10 * mob["size"], 16)
''', '''        draw_thing(mob["image"], mob["x"], mob["y"], mob["size"])
        if mob["size"] > 4:
            draw_rect(mob["x"] - 50, mob["y"] - 60, 100 * mob["hp"] / mob["max"], 8, "#ff6b6b")
            draw_text(str(mob["hp"]) + "/" + str(mob["max"]), mob["x"], mob["y"] - 74, 16)
'''), ('''        draw_text("+" + str(gem["xp"]), gem["x"], gem["y"] - 14, 18)
''', ''), ('''    mob["hp"] = row["hp"]
''', '''    mob["hp"] = row["hp"]
    mob["max"] = row["hp"]
'''), ("START_SKILLS = [5]\n", "START_SKILLS = [0, 0, 6, 6]\n")],
    fills=[BOSS, BOSS_WAVE],
    sol=[("START_WAVE = 0\n", "START_WAVE = 3\n")],
    wrong=[("quên dòng trong WAVES", ['MOBS["boss"] = {"image": "boss-1", "hp": 12, "speed": 1, "size": 6, "xp": 9}', ""], []),
           ("đợt cuối không có trùm", ['MOBS["boss"] = {"image": "boss-1", "hp": 12, "speed": 1, "size": 6, "xp": 9}',
            'WAVES.append({"mob": "bat", "lead": "golem", "every": 3, "count": 3, "gap": 60})'], [("START_WAVE = 0\n", "START_WAVE = 3\n")])] + [
           (what, [BOSS.replace(a, b), BOSS_WAVE.replace(a, b)], [("START_WAVE = 0\n", "START_WAVE = 3\n")]) for what, a, b in [
               ("đổi chỗ mob và lead", '"mob": "bat", "lead": "boss"', '"mob": "boss", "lead": "bat"'), ("con nào cũng là trùm", '"every": 3', '"every": 1'),
               ("trùm ra giữa đợt", '"every": 3', '"every": 2'), ("quên dơi", '"mob": "bat"', '"mob": "golem"'),
               ("trùm bé xíu", '"size": 6', '"size": 2'), ("trùm 1 máu", '"hp": 12', '"hp": 1'),
               ("trùm chạy quá nhanh", '"speed": 1', '"speed": 3'), ("ra dồn một lúc", '"gap": 60', '"gap": 1')]],
    test={"frames": 600, "taps": [5], "keys": [hold("1", 10, 10), hold("1", 200, 200), hold("1", 300, 300), hold("1", 400, 400), hold("1", 450, 450), hold("1", 500, 500)]},
    new="trùm = một dòng trong bảng; biến START_WAVE để thử nhanh",
    reorganised="Bỏ chữ máu, số xp tạm. Thêm thanh máu, số máu cho con to (size > 4) và ngăn max.")

# ---------------------------------------------------------------- h16
HERO2 = '''HEROES.append({"name": "Pháp sư", "image": "hero-mage", "hp": 5, "speed": 3, "reach": 320, "power": 3})
HEROES.append({"name": "Cung thủ", "image": "hero-archer", "hp": 6, "speed": 4, "reach": 500, "power": 2})'''
ex(
    "h16-e1", "Bảng nhân vật",
    "(1) Thêm vào HEROES 2 dòng: Pháp sư (hero-mage, hp 5, speed 3, reach 320, power 3) và Cung thủ (hero-archer, hp 6, "
    "speed 4, reach 500, power 2). (2) Trong start_game, chép mọi ngăn của row sang hero. (3) START_HERO = 2.",
    ["Chỗ (1): HEROES.append({\"name\": \"Pháp sư\", \"image\": \"hero-mage\", \"hp\": 5, \"speed\": 3, \"reach\": 320, \"power\": 3})",
     "Làm tiếp dòng Cung thủ.",
     "Chỗ (2): for key in row: đi qua từng tên ngăn: \"name\", \"image\", \"hp\"…",
     "Thụt vào: hero[key] = row[key]. Hai dòng chép được mọi ngăn.",
     "Chỗ (3), đầu file: START_HERO = 2 để thử cung thủ.",
     "Từ bài này quái lì đòn hơn: nhớt 4 máu, dơi 3, golem 18, trùm 400 và đụng một cái mất 3 máu.",
     "Bấm ▶ Chạy: màn chờ ghi từng dòng của bảng (máu, tốc độ, tầm, sức), rồi cung thủ vào hầm, chạy nhanh hơn."],
    ["for trên một dict cho em tên từng ngăn.",
     "for key in row:\n    hero[key] = row[key]",
     "Đếm từ 0: Kiếm sĩ 0, Pháp sư 1, Cung thủ 2."],
    [run_goal(),
     goal("archer", "drew", "Cung thủ vào hầm", sprite="hero-archer"),
     goal("name", "drewText", "Có tên Cung thủ", text="Cung thủ"),
     goal("hp", "drewText", "Máu của cung thủ là 6", text="Máu: 6"),
     goal("rest", "drewText", "Chép cả sức 2 và tầm 500", text="Sức 2, tầm 500"),
     goal("mage", "drewText", "Dòng Pháp sư đủ 4 số", text="Pháp sư 5 3 320 3"),
     goal("bow", "drewText", "Dòng Cung thủ đủ 4 số", text="Cung thủ 6 4 500 2"),
     goal("fast", "distinctCount", "Cung thủ đi được", sprite="hero-archer", axis="x", min=10),
     goal("far", "drew", "Chạy nhanh 4 bước mỗi khung", sprite="hero-archer", at=[356, 276], tolerance=1)],
    prep=[('''            safe = 60 + bonus["armor"]
''', '''            safe = 60 + bonus["armor"]
            if mob["size"] > 4:
                hero["hp"] -= 2
'''), ('''        screen = "over"
''', '''        hero["hp"] = 0
        screen = "over"
'''), ('''START_HP = 5
hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
''', '''hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
hero["power"] = 1
START_HERO = 0
HEROES = []
HEROES.append({"name": "Kiếm sĩ", "image": "hero-knight", "hp": 8, "speed": 3, "reach": 200, "power": 3})
# Em viết tiếp ở đây (1)
'''), ("START_SKILLS = [0, 0, 6, 6]\n", "START_SKILLS = []\n"), ("START_WAVE = 3\n", "START_WAVE = 0\n"),
          ('''    hero["hp"] = START_HP
''', '''    row = HEROES[START_HERO]
    # Em viết tiếp ở đây (2)
'''), ('''hurt(mob, 1 + bonus["power"])''', '''hurt(mob, hero["power"] + bonus["power"])'''),
          ('''    if wait <= 0 and len(mobs) > 0:
''', '''    if wait <= 0 and len(mobs) > 0 and distance(nearest(), hero) < hero["reach"]:
'''), ('''"mob-slime", "hp": 3,''', '''"mob-slime", "hp": 4,'''), ('''"mob-bat", "hp": 2,''', '''"mob-bat", "hp": 3,'''),
          ('''"mob-golem", "hp": 8,''', '''"mob-golem", "hp": 18,'''), ('''"boss-1", "hp": 12, "speed": 1,''', '''"boss-1", "hp": 400, "speed": 1.5,'''),
          ('''"lead": "bat", "every": 3, "count": 3, "gap": 40''', '''"lead": "bat", "every": 4, "count": 14, "gap": 36'''),
          ('''"every": 2, "count": 12, "gap": 20''', '''"every": 2, "count": 26, "gap": 24'''),
          ('''"every": 3, "count": 15, "gap": 40''', '''"every": 3, "count": 30, "gap": 24'''),
          ('''"every": 3, "count": 3, "gap": 60''', '''"every": 20, "count": 20, "gap": 45'''),
          ('''    draw_thing(hero["image"], 300, 320, 5)
''', '''    draw_thing("hero-knight", 300, 320, 5)
'''), ('''    draw_text("Bấm Space để vào hầm", 300, 430)
''', '''    draw_text("Bấm Space để vào hầm", 300, 430)
    for i in range(len(HEROES)):
        row = HEROES[i]
        text = row["name"]
        for key in ["hp", "speed", "reach", "power"]:
            text += " " + str(row[key])
        draw_text(text, 300, 480 + i * 30)
'''), ('''    draw_text("Máu: " + str(hero["hp"]), 60, 24)
''', '''    draw_text("Máu: " + str(hero["hp"]), 60, 24)
    draw_text("Sức " + str(hero["power"]) + ", tầm " + str(hero["reach"]), 90, 52, 18)
''')],
    fills=[HERO2,
           "for key in row:\n    hero[key] = row[key]"],
    sol=[("START_HERO = 0\n", "START_HERO = 2\n")],
    wrong=[("quên chép ngăn", [HERO2, ""], [("START_HERO = 0\n", "START_HERO = 2\n")]),
           ("chọn nhầm người", [HERO2, "for key in row:\n    hero[key] = row[key]"], [("START_HERO = 0\n", "START_HERO = 1\n")]),
           ("chỉ chép hình", [HERO2, 'hero["image"] = row["image"]'], [("START_HERO = 0\n", "START_HERO = 2\n")]),
           ("quên chép tầm và sức", [HERO2, 'for key in ["name", "image", "hp", "speed"]:\n    hero[key] = row[key]'], [("START_HERO = 0\n", "START_HERO = 2\n")]),
           ("nhầm số của pháp sư", [HERO2.replace("320", "32"), "for key in row:\n    hero[key] = row[key]"], [("START_HERO = 0\n", "START_HERO = 2\n")]),
           ("nhầm sức của cung thủ", [HERO2.replace('"power": 2', '"power": 20'), "for key in row:\n    hero[key] = row[key]"], [("START_HERO = 0\n", "START_HERO = 2\n")])],
    test={"frames": 60, "taps": [5], "keys": [hold("1", 10, 10), hold("right", 20, 45)]},
    new="for key in row: chép cả dict",
    reorganised="Bỏ START_HP; màn chờ tạm ghi bảng HEROES; thêm chữ Sức, tầm; mọi số của hero lấy từ HEROES; đạn mạnh theo hero[\"power\"]; chỉ bắn khi "
                "quái trong tầm. Đồ thử về 0, trùm thật 400 máu và đụng một cái mất 3 máu; các đợt đông hơn, quái lì đòn hơn để game vừa sức.")

PICK = '''row = HEROES[i]
draw_thing(row["image"], 110, y + 50, 4)
draw_text(row["name"], 340, y + 36, 32)
draw_text("Máu " + str(row["hp"]) + ", tầm " + str(row["reach"]), 340, y + 72)'''
PICK_NUMBER = "if number > 0:\n    start_game(HEROES[number - 1])"
ex(
    "h16-e2", "Màn chọn nhân vật",
    "(1) Trong update(), ở màn \"title\": nếu number > 0 thì start_game(HEROES[number - 1]). (2) Trong draw_title(): với mỗi i, "
    "lấy row = HEROES[i], vẽ ảnh ở (110, y + 50) to gấp 4, tên ở (340, y + 36) cỡ 32, và dòng \"Máu 8, tầm 200\" ở (340, y + 72).",
    ["Chỗ (1): if number > 0: rồi thụt vào start_game(HEROES[number - 1])",
     "picked_number() viết cho thẻ skill mà dùng lại được y nguyên, vì 3 hàng nằm cùng chỗ.",
     "Chỗ (2): row = HEROES[i]",
     "draw_thing(row[\"image\"], 110, y + 50, 4) rồi draw_text(row[\"name\"], 340, y + 36, 32)",
     "draw_text(\"Máu \" + str(row[\"hp\"]) + \", tầm \" + str(row[\"reach\"]), 340, y + 72)",
     "Bấm ▶ Chạy: máy bấm phím 3 chọn Cung thủ. Rồi ⛶ và tự chọn."],
    ["Phím 1 là HEROES[0], nên phải trừ 1.",
     "Số phải đổi thành chữ bằng str trước khi nối.",
     "start_game(HEROES[number - 1])"],
    [run_goal(),
     goal("three", "drewCount", "Thấy đủ 3 nhân vật", sprite="hero", min=3),
     goal("rows", "distinctCount", "Mỗi nhân vật một hàng", sprite="hero", axis="y", min=3),
     goal("name", "drewText", "Có tên pháp sư", text="Pháp sư"),
     goal("archer", "drew", "Phím 3 là Cung thủ vào hầm", sprite="hero-archer", at=[276, 276], tolerance=1),
     goal("play", "varEquals", "Vào được hầm", name="screen", value="play")],
    prep=[('''hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
hero["power"] = 1
START_HERO = 2
''', '''hero = {}
'''), ('''def start_game():
''', '''def start_game(row):
'''), ('''    row = HEROES[START_HERO]
''', ''), ('''def make_mob(name, x, y):
    row = MOBS[name]
    mob = {"image": row["image"], "x": x, "y": y, "hp": 3, "speed": 1, "size": 2, "xp": 1, "slow": 0}
    mob["hp"] = row["hp"]
    mob["max"] = row["hp"]
    mob["speed"] = row["speed"]
    mob["size"] = row["size"]
    mob["xp"] = row["xp"]
    return mob
''', '''def make_mob(name, x, y):
    row = MOBS[name]
    mob = {"x": x, "y": y, "slow": 0, "max": row["hp"]}
    for key in row:
        mob[key] = row[key]
    return mob
'''), ('''def update():
    number = picked_number()
''', '''def update():
    global screen
    number = picked_number()
'''), ('''    elif key_pressed("space"):
        start_game()
''', '''    elif screen == "title":
        # Em viết tiếp ở đây (1)
        pass
    elif key_pressed("space"):
        screen = "title"
'''), ('''    draw_text("HẦM NGỌC", 300, 220, 64)
    draw_thing("hero-knight", 300, 320, 5)
    draw_text("Bấm Space để vào hầm", 300, 430)
    for i in range(len(HEROES)):
        row = HEROES[i]
        text = row["name"]
        for key in ["hp", "speed", "reach", "power"]:
            text += " " + str(row[key])
        draw_text(text, 300, 480 + i * 30)
''', '''    draw_text("HẦM NGỌC", 300, 70, 64)
    draw_text("Chọn nhân vật: bấm 1, 2, 3", 300, 140)
    for i in range(3):
        y = 180 + i * 120
        draw_rect(60, y, 480, 100, "#33334a")
        # Em viết tiếp ở đây (2)
'''), ('''start_game()
screen = "title"''', '''start_game(HEROES[0])
screen = "title"'''), ('''    if screen == "win":
        draw_text("Em thắng rồi!", 300, 250, 48)
    if screen == "over":
        draw_text("Thua rồi!", 300, 250, 48)
        draw_text("Bấm Space để chơi lại", 300, 320)
''', '''    if screen == "win" or screen == "over":
        draw_rect(60, 190, 480, 250, "#101018")
        draw_text("Bấm Space để chơi lại", 300, 320)
    if screen == "win":
        draw_text("Em thắng rồi!", 300, 250, 48)
    if screen == "over":
        draw_text("Thua rồi!", 300, 250, 48)
''')],
    fills=[PICK_NUMBER, PICK],
    wrong=[("quên trừ 1", ["if number > 0 and number < 3:\n    start_game(HEROES[number])", PICK], []),
           ("ai cũng là kiếm sĩ", [PICK_NUMBER.replace("number - 1", "0"), PICK], []),
           ("vẽ ba lần một người", [PICK_NUMBER, PICK.replace("HEROES[i]", "HEROES[0]")], []),
           ("phím nào cũng ra pháp sư", [PICK_NUMBER.replace("number - 1", "1"), PICK], []),
           ("đếm ngược", [PICK_NUMBER.replace("number - 1", "3 - number"), PICK], []),
           ("vẽ chồng lên một hàng", [PICK_NUMBER, PICK.replace("y + 50", "230")], [])],
    test={"frames": 60, "keys": [hold("3", 10, 10), hold("1", 30, 30)]},
    new="dùng lại picked_number() cho màn khác; hàm nhận cả một dòng của bảng",
    reorganised="Bỏ START_HERO; start_game(row); make_mob cũng chép bằng for key in row; thua hay thắng thì Space về màn chọn.")

# ---------------------------------------------------------------- h17
LIVING = '''kept = []
for thing in things:
    if thing["hp"] > 0:
        kept.append(thing)
return kept'''
FLIP = '''for effect in effects:
    effect["frame"] += 0.5
    effect["hp"] -= 1
effects = living(effects)'''
ex(
    "h17-e1", "Hiệu ứng",
    "Mỗi hiệu ứng là một hộp có frame và hp. (1) living(things) trả về danh sách mới chỉ giữ những thứ có hp > 0. (2) Trong "
    "move_effects(): mỗi hiệu ứng frame cộng 0.5, hp bớt 1; rồi effects = living(effects).",
    ["Chỗ (1): kept = [] rồi for thing in things:",
     "Thụt vào: if thing[\"hp\"] > 0: rồi kept.append(thing). Ngoài vòng for: return kept",
     "Khuôn này em viết 3 lần rồi. Giờ gói thành hàm, danh sách nào cũng dùng được.",
     "Chỗ (2): for effect in effects: rồi effect[\"frame\"] += 0.5 và effect[\"hp\"] -= 1",
     "Ngoài vòng for: effects = living(effects)",
     "Bấm ▶ Chạy, rồi ⛶: trúng đạn thì tóe sáng, quái thua thì bụp khói."],
    ["frame là số hình của sách lật: 0, 1, 2… tới 8, tất cả 9 hình.",
     "hp 18 nghĩa là sống 18 khung: 9 hình, mỗi hình giữ 2 khung.",
     "effect[\"frame\"] += 0.5\neffect[\"hp\"] -= 1",
     "effects = living(effects)"],
    [run_goal(),
     goal("hit", "drewCount", "Trúng đạn thì tóe sáng", sprite="fx-hit", min=1),
     goal("poof", "drewCount", "Quái thua thì bụp khói", sprite="fx-poof", min=1),
     goal("flip", "varCompare", "Chiếu đủ tới hình cuối, hình số 8", name="page", op=">=", value=8),
     goal("slow", "varCompare", "Mỗi hình giữ 2 khung, không chiếu lại", name="page", op="<=", value=8.5),
     goal("gone", "varCompare", "Hiệu ứng xong thì mất", name="busy", op="<=", value=3),
     goal("more", "varCompare", "Có lúc có hiệu ứng", name="busy", op=">=", value=1, when="ever"),
     goal("keep", "called", "Có dùng living", name="living", min=10)],
    prep=[('''def move_hero():
''', '''def living(things):
    # Em viết tiếp ở đây (1)
    return things


def add_effect(image, half, thing):
    if len(effects) < 20:
        x = thing["x"] - half
        y = thing["y"] - half
        effects.append({"image": image, "x": x, "y": y, "frame": 0, "hp": 18})


def move_effects():
    global effects, busy
    # Em viết tiếp ở đây (2)
    busy = len(effects)


def move_hero():
'''), ('''    global mobs, shots, gems, owned, bonus, picks, wave, tick,''', '''    global mobs, shots, gems, effects, owned, bonus
    global picks, wave, tick,'''), ('''    gems = []
    tick = 0
''', '''    gems = []
    effects = []
    tick = 0
'''), ('''                shot["live"] = False
''', '''                shot["live"] = False
                add_effect("fx-hit", 24, mob)
'''), ('''    blast(hero, 1200, 2)
''', '''    blast(hero, 1200, 2)
    for mob in mobs:
        add_effect("fx-spark", 24, mob)
'''), ('''    blast(shot, 90, 2)
''', '''    blast(shot, 90, 2)
    add_effect("fx-fire", 24, shot)
'''), ('''            kills += 1
''', '''            kills += 1
            add_effect("fx-poof", 28, mob)
'''), ('''        blast(hero, 130, bonus["ring"])
''', '''        blast(hero, 130, bonus["ring"])
        add_effect("fx-fire", 24, hero)
'''), ('''    global bolt
    bolt = mob
    hurt(mob, amount)
''', '''    hurt(mob, amount)
    add_effect("fx-spark", 24, mob)
'''), ('''bolt = {"x": 0, "y": 0}
''', "page = 0\n"), ('''    if bonus["cloud"] > 0 and tick % 60 >= 30 and tick % 60 < 40:
        draw_line(bolt["x"], 0, bolt["x"], bolt["y"], "#ffe14d", 4)
''', ''), ('''        level += 1
''', '''        level += 1
        add_effect("fx-pickup", 24, hero)
'''), ('''    run_wave()
    move_hero()
''', '''    run_wave()
    move_effects()
    move_hero()
'''), ('''    draw_text(hero["name"], hero["x"]''', '''    for effect in effects:
        path = "images/" + effect["image"] + ".png"
        draw_image(path, effect["x"], effect["y"], effect["frame"])
        if effect["frame"] > page:
            page = effect["frame"]
    draw_text(hero["name"], hero["x"]'''), ('''def draw_play():
''', '''def draw_play():
    global page
'''), ('''def far_edge(value)''', '''def far_edge(value)''')],
    fills=[LIVING, FLIP],
    sol=[("    return kept\n    return things\n", "    return kept\n")],
    wrong=[("giữ thứ hết hp", [LIVING.replace("> 0", "<= 0"), '''for effect in effects:
    effect["frame"] += 0.5
    effect["hp"] -= 1
effects = living(effects)'''], [("    return kept\n    return things\n", "    return kept\n")]),
           ("quên trừ hp", [LIVING, '''for effect in effects:
    effect["frame"] += 0.5
effects = living(effects)'''], [("    return kept\n    return things\n", "    return kept\n")]),
           ("quên effects = living(effects)", [LIVING, '''for effect in effects:
    effect["frame"] += 0.5
    effect["hp"] -= 1
living(effects)'''], [("    return kept\n    return things\n", "    return kept\n")])] + [
           (what, [LIVING.replace(a, b), FLIP.replace(a, b)], [("    return kept\n    return things\n", "    return kept\n")]) for what, a, b in [
               ("quên cộng frame", 'effect["frame"] += 0.5', 'effect["frame"] += 0'), ("frame cộng 1", "+= 0.5", "+= 1"),
               ("gán frame = 0.5", "+= 0.5", "= 0.5"), ("bớt hp quá nhanh", 'effect["hp"] -= 1', 'effect["hp"] -= 5'),
               ("giữ cả thứ hp bằng 0", '> 0', '>= 0')]],
    test={"frames": 420, "taps": [], "keys": [hold("1", 10, 10), hold("1", 20, 20), hold("1", 300, 300), hold("2", 350, 350), hold("2", 400, 400)]},
    new="gói khuôn giữ lại thành hàm living(things); frame chạy dần = hoạt hình",
    reorganised="Thêm effects, busy, page (hình lớn nhất đã chiếu, máy chấm đọc), add_effect(image, half, thing) (half là nửa ảnh: 24 hay 28) và các lời gọi add_effect; tia vàng của "
                "sét đổi thành hiệu ứng fx-spark; move_effects() chạy mỗi khung.")

ex(
    "h17-e2", "Tiếng động",
    "Thêm 5 tiếng: (1) chọn thẻ: play_sound(\"click\"). (2) Lên cấp: play_sound(\"win\"). (3) Nhặt ngọc: play_sound(\"point\"). "
    "(4) Bị chạm: play_sound(\"hit\"). (5) Vào hầm: play_music(\"adventure\"). Đừng đặt tiếng ở chỗ chạy mỗi khung nhé.",
    ["Chỗ (1), trong take_card: play_sound(\"click\")",
     "Chỗ (2), trong check_level, dưới level += 1: play_sound(\"win\")",
     "Chỗ (3), trong take_gems, dưới gem[\"hp\"] = 0: play_sound(\"point\")",
     "Chỗ (4), trong check_hits, dưới hero[\"hp\"] -= 1: play_sound(\"hit\")",
     "Chỗ (5), trong update, ngay dưới start_game(HEROES[number - 1]): play_music(\"adventure\"). Thử cả \"happy\" và \"calm\".",
     "Hết ván thì stop_music() tắt nhạc, có sẵn cho em. Màn chọn nhân vật luôn im.",
     "Bấm 🔊 nếu không nghe thấy gì. Rồi ⛶ và chơi thử với loa."],
    ["Thụt lề ngang với dòng ngay trên nó.",
     "Tên tiếng trong ngoặc kép, chữ thường.",
     "play_sound(\"point\")"],
    [run_goal(),
     goal("music", "played", "Có nhạc nền", music="*"),
     goal("point", "played", "Nhặt ngọc có tiếng", sound="point", min=2),
     goal("hit", "played", "Bị chạm có tiếng", sound="hit"),
     goal("click", "played", "Chọn thẻ có tiếng", sound="click"),
     goal("win", "played", "Lên cấp có tiếng", sound="win")],
    prep=[('''"vy": vy, "live": True}''', '''"vy": vy, "hp": 1}'''), ('''def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]
''', '''def move_shots():
    global shots
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]
        if not near(shot, hero, hero["reach"]):
            shot["hp"] = 0
    shots = living(shots)
'''), ('''and shot["live"]:
                hurt''', '''and shot["hp"] > 0:
                hurt'''), ('''                shot["live"] = False
''', '''                shot["hp"] = 0
'''), ('''def remove_shots():
    global shots
    kept = []
    for shot in shots:
        if shot["live"] and near(shot, hero, hero["reach"]):
            kept.append(shot)
    shots = kept


''', ''), ('''    remove_shots()
''', ''), ('''    kept = []
    for gem in gems:
        if near(gem, hero, 150):
            step_to(gem, hero, 6)
        if near(gem, hero, 40):
            xp += gem["xp"]
        else:
            kept.append(gem)
    gems = kept
''', '''    for gem in gems:
        if near(gem, hero, 150):
            step_to(gem, hero, 6)
        if near(gem, hero, 40):
            xp += gem["xp"]
            gem["hp"] = 0
            # Em viết tiếp ở đây (3)
    gems = living(gems)
'''), ('''"xp": mob["xp"]})''', '''"xp": mob["xp"], "hp": 1})'''), ('''    global effects, busy
''', '''    global effects
'''), ("page = 0\n", ""), ('''def draw_play():
    global page
''', '''def draw_play():
'''), ('''        if effect["frame"] > page:
            page = effect["frame"]
''', ''), ('''    effects = living(effects)
    busy = len(effects)
''', '''    effects = living(effects)
'''), ('''        start_game(HEROES[number - 1])
''', '''        start_game(HEROES[number - 1])
            # Em viết tiếp ở đây (5)
'''), ('''        screen = "over"
''', '''        screen = "over"
        play_sound("fall")
        stop_music()
'''), ('''            hero["hp"] -= 1
''', '''            hero["hp"] -= 1
            # Em viết tiếp ở đây (4)
'''), ('''    picks -= 1
''', '''    picks -= 1
    # Em viết tiếp ở đây (1)
'''), ('''        level += 1
''', '''        level += 1
        # Em viết tiếp ở đây (2)
'''), ('''        screen = "win"
''', '''        screen = "win"
        play_sound("win")
        stop_music()
'''), ("START_WAVE = 0\n", "START_WAVE = 2\n")],
    fills=['play_sound("click")', 'play_sound("win")', 'play_sound("point")', 'play_sound("hit")', 'play_music("adventure")'],
    wrong=[("quên tiếng bị chạm", ['play_sound("click")', 'play_sound("win")', 'play_sound("point")', "", 'play_music("adventure")'], []),
           ("nhầm tiếng lên cấp", ['play_sound("click")', 'play_sound("point")', 'play_sound("point")', 'play_sound("hit")', 'play_music("adventure")'], [])],
    test={"frames": 600, "taps": [], "keys": [hold("2", 5, 5), hold("1", 15, 15)] + [hold("1", f, f) for f in range(100, 600, 50)]},
    new="tiếng đặt ở đúng lúc việc xảy ra, không đặt ở chỗ chạy mỗi khung",
    reorganised="Thua hay thắng thì tắt nhạc, thua có tiếng fall. Sắp xếp lại lần 4: đạn và ngọc cũng có hp và dùng living(); bỏ remove_shots, live, busy, page. START_WAVE = 2 "
                "để thử đợt đông quái (Bài 18 trả về 0).")

# ---------------------------------------------------------------- h18
NEW_SKILL = 'SKILLS.append({"name": "Giày Gió: chạy nhanh", "branch": "common", "icon": 2, "what": "speed", "add": 2})'
NEW_MOB = 'MOBS["ghost"] = {"image": "mob-ghost", "hp": 10, "speed": 2, "size": 2, "xp": 2}'
NEW_WAVE = 'WAVES.append({"mob": "ghost", "lead": "golem", "every": 4, "count": 32, "gap": 22})'
ex(
    "h18-e1", "Quái mới, skill mới của em",
    "Thêm 3 dòng bảng, rồi đổi START_SKILLS = [] thành [9] để thử. (1) Skill \"Giày Gió: chạy nhanh\", branch common (chung), icon 2, what speed, add 2. (2) MOBS[\"ghost\"]: "
    "hình mob-ghost, hp 10, speed 2, size 2, xp 2. (3) Đợt trước trùm: mob ghost, lead golem, every 4, count 32, gap 22.",
    ["Chỗ (1): SKILLS.append({\"name\": \"Giày Gió: chạy nhanh\", \"branch\": \"common\", \"icon\": 2, \"what\": \"speed\", \"add\": 2})",
     "Chỗ (2): MOBS[\"ghost\"] = {\"image\": \"mob-ghost\", \"hp\": 10, \"speed\": 2, \"size\": 2, \"xp\": 2}",
     "Chỗ (3): WAVES.append({\"mob\": \"ghost\", \"lead\": \"golem\", \"every\": 4, \"count\": 32, \"gap\": 22})",
     "Gần đầu file, đổi START_SKILLS = [] thành [9]: vào ván có sẵn Giày Gió (dòng thứ mười, đếm từ 0). START_WAVE = 3 có sẵn.",
     "Bấm ▶ Chạy. Dòng của riêng em để tới Bài tập 3 hãy thêm: bài tập sau bắt đầu từ code mẫu."],
    ["Ngoài 3 dòng bảng và START_SKILLS = [9], em không sửa gì khác.",
     "what phải là một ngăn có trong bonus.",
     "SKILLS.append({\"name\": \"Giày Gió: chạy nhanh\", \"branch\": \"common\", \"icon\": 2, …"],
    [run_goal(),
     goal("ghost", "drewCount", "Đợt ma đông: có lúc 6 con", sprite="mob-ghost", min=6),
     goal("golem", "drewCount", "Golem dẫn đầu, cứ 4 con một golem", sprite="mob-golem", min=2),
     goal("wave", "drewText", "Game có 5 đợt", text="Đợt 4/5"),
     goal("icon", "drewCount", "Có hình Giày Gió", sprite="skill-common-2", min=1),
     goal("fast", "drew", "Giày Gió làm em chạy nhanh hơn", sprite="hero", at=[476, 276], tolerance=1)],
    prep=[('''"size": 3, "xp": 3}
''', '''"size": 3, "xp": 3}
# Em viết tiếp ở đây (2)
'''), ('''"every": 3, "count": 30, "gap": 24})
''', '''"every": 3, "count": 30, "gap": 24})
# Em viết tiếp ở đây (3)
'''), ('''"what": "cloud", "add": 3})
''', '''"what": "cloud", "add": 3})
# Em viết tiếp ở đây (1)
'''), ('''def move_hero():
    if key_pressed("right"):
        hero["x"] += hero["speed"]
    if key_pressed("left"):
        hero["x"] -= hero["speed"]
    if key_pressed("up"):
        hero["y"] -= hero["speed"]
    if key_pressed("down"):
        hero["y"] += hero["speed"]
''', '''def move_hero():
    speed = hero["speed"] + bonus["speed"]
    if key_pressed("right"):
        hero["x"] += speed
    if key_pressed("left"):
        hero["x"] -= speed
    if key_pressed("up"):
        hero["y"] -= speed
    if key_pressed("down"):
        hero["y"] += speed
'''), ("START_WAVE = 2\n", "START_WAVE = 3\n")],
    fills=[NEW_SKILL, NEW_MOB, NEW_WAVE],
    sol=[("START_SKILLS = []\n", "START_SKILLS = [9]\n")],
    wrong=[("quên đợt ma", [NEW_SKILL, NEW_MOB, ""], [("START_SKILLS = []\n", "START_SKILLS = [9]\n")]),
           ("what nhầm ngăn", [NEW_SKILL.replace("speed", "power"), NEW_MOB, NEW_WAVE],
            [("START_SKILLS = []\n", "START_SKILLS = [9]\n")])] + [
           (what, [x.replace(a, b) for x in (NEW_SKILL, NEW_MOB, NEW_WAVE)], [("START_SKILLS = []\n", "START_SKILLS = [9]\n")]) for what, a, b in [
               ("đổi chỗ mob và lead", '"mob": "ghost", "lead": "golem"', '"mob": "golem", "lead": "ghost"'),
               ("dẫn đầu là nhớt", '"lead": "golem"', '"lead": "slime"'), ("đợt chỉ 3 con", '"count": 32', '"count": 3'),
               ("ma ra quá thưa", '"gap": 22', '"gap": 60'), ("con nào cũng là golem", '"every": 4', '"every": 1'),
               ("ma chỉ 1 máu", '"hp": 10', '"hp": 1'), ("nhầm nhánh", '"common"', '"fire"'), ("cộng 1", '"add": 2', '"add": 1')]],
    test={"frames": 260, "taps": [], "keys": [hold("1", 5, 5), hold("1", 15, 15), hold("right", 20, 59)]},
    new="thêm nội dung chỉ bằng dữ liệu",
    reorganised="move_hero() cộng bonus[\"speed\"]; START_WAVE, START_SKILLS để thử.")

RECORD = '''draw_text("Hạ " + str(kills) + " quái, cấp " + str(level), 300, 370)
draw_text("Kỷ lục: " + str(record), 300, 410)'''
ex(
    "h18-e2", "Kỷ lục",
    "(1) Trong finish(result): nếu kills > record thì record = kills. (2) Ở màn hết ván: viết \"Hạ 12 quái, cấp 4\" (số thật của em) "
    "ở (300, 370) và \"Kỷ lục: 12\" ở (300, 410). record không bị đặt lại khi chơi ván mới.",
    ["Chỗ (1): if kills > record: rồi thụt vào record = kills",
     "Vì sao record không nằm trong start_game? Vì kỷ lục phải nhớ qua nhiều ván.",
     "Chỗ (2): draw_text(\"Hạ \" + str(kills) + \" quái, cấp \" + str(level), 300, 370)",
     "draw_text(\"Kỷ lục: \" + str(record), 300, 410)",
     "Đồ thử: record = 2 là kỷ lục cũ, START_WAVE = 4 là gặp trùm ngay để thua nhanh.",
     "Bấm ▶ Chạy: máy thua hai ván, hạ 3 quái rồi 1 quái. Kỷ lục phải là 3."],
    ["Kỷ lục cũng là tìm lớn nhất.", "if kills > record:\n    record = kills", "Nhớ str() khi nối số với chữ."],
    [run_goal(),
     goal("first", "drewText", "Ván một: hiện số quái và cấp", text="Hạ 3 quái, cấp 1"),
     goal("record", "drewText", "Hiện kỷ lục", text="Kỷ lục: 3"),
     goal("second", "drewText", "Chơi tiếp ván hai: hạ ít hơn", text="Hạ 1 quái, cấp 1"),
     goal("keep", "varEquals", "Ván hai ít hơn thì vẫn giữ kỷ lục 3", name="record", value=3)],
    prep=[("START_WAVE = 3\n", "START_WAVE = 4\n"), ('''hero = {}
''', '''hero = {}
record = 2
'''), ('''def next_wave():
    global wave, left, screen
    if wave + 1 == len(WAVES):
        screen = "win"
        play_sound("win")
        stop_music()
        return
    wave += 1
''', '''def finish(result):
    global screen, record
    screen = result
    # Em viết tiếp ở đây (1)
    stop_music()


def next_wave():
    global wave, left
    if wave + 1 == len(WAVES):
        finish("win")
        play_sound("win")
        return
    wave += 1
'''), ('''        hero["hp"] = 0
        screen = "over"
        play_sound("fall")
        stop_music()
''', '''        hero["hp"] = 0
        finish("over")
        play_sound("fall")
'''), ('''    global tick, screen
    tick += 1
''', '''    global tick
    tick += 1
'''), ('''        draw_text("Bấm Space để chơi lại", 300, 320)
''', '''        draw_text("Bấm Space để chơi lại", 300, 320)
        # Em viết tiếp ở đây (2)
''')],
    fills=["if kills > record:\n    record = kills", RECORD],
    wrong=[("quên gán", ["", '''draw_text("Hạ " + str(kills) + " quái, cấp " + str(level), 300, 370)
draw_text("Kỷ lục: " + str(record), 300, 410)'''], []),
           ("quên hiện kỷ lục", ["if kills > record:\n    record = kills", ""], [])] + [
           (what, [code, RECORD], []) for what, code in [
               ("thay luôn không cần hơn", "record = kills"), ("cộng dồn", "if kills > record:\n    record += kills"),
               ("cộng dồn mọi ván", "record += kills"), ("so ngược dấu", "if kills < record:\n    record = kills")]] + [
           ("quên dòng Hạ", ["if kills > record:\n    record = kills", RECORD.split("\n")[1]], []),
           ("kỷ lục đặt lại mỗi ván", ["record = 0\nif kills > record:\n    record = kills", RECORD], [])],
    test={"frames": 560, "taps": [], "keys": [hold("2", 5, 5), hold("1", 15, 15), hold("right", 41, 60), hold("right", 61, 90),
                                    hold("up", 131, 170), hold("left", 171, 230), hold("down", 231, 270), hold("space", 332, 332),
                                    hold("2", 342, 342), hold("1", 352, 352), hold("right", 353, 372), hold("up", 403, 462),
                                    hold("left", 463, 502), hold("left", 503, 522), hold("right", 523, 542)]},
    new="nhớ lớn nhất qua nhiều ván",
    reorganised="Thêm record, finish(result); hết ván thì tắt nhạc. START_WAVE = 4 để thua nhanh, record = 2 là kỷ lục cũ để thử.")

SIGN = '''draw_thing("item-heart", 150, 575, 2)
draw_text("Em làm game này!", 300, 575, 20)'''
ex(
    "h18-e3", "Tháo đồ thử và ra mắt",
    "Trước khi ra mắt phải tháo đồ thử! (1) START_WAVE = 0 và START_SKILLS = []. (2) Ở màn chọn nhân vật, ký tên: vẽ "
    "item-heart to gấp 2 ở (150, 575) và viết chữ ký của em (biệt danh thôi) cỡ 20 ở (300, 575). Rồi đổi máy cho bạn chơi.",
    ["Gần đầu file: đổi START_WAVE = 4 thành START_WAVE = 0",
     "Đổi START_SKILLS = [9] thành START_SKILLS = []",
     "Trong draw_title(), chỗ đánh dấu: draw_thing(\"item-heart\", 150, 575, 2)",
     "Dưới đó: draw_text(\"Em làm game này!\", 300, 575, 20). Đổi câu tùy em, đừng ghi tên thật.",
     "Bấm ▶ Chạy: ván mới bắt đầu ở Đợt 1/5 với 1 thẻ.",
     "Đổi máy với bạn, chơi game của bạn 10 phút. Ghi 1 điều hay và 1 điều muốn sửa.",
     "Bấm ▶ Chạy cho đạt hết mục tiêu đã, rồi mới thêm quái, skill, đợt của em và sửa theo góp ý. Đây là bản của em, cứ đổi."],
    ["Danh sách rỗng là []: không cho sẵn skill nào.", "START_WAVE = 0",
     "draw_text(\"Em làm game này!\", 300, 575, 20)"],
    [run_goal(),
     goal("wave", "drewText", "Bắt đầu từ đợt 1", text="Đợt 1/5"),
     goal("sign", "drew", "Có trái tim cạnh chữ ký", sprite="item-heart", at=[134, 559], tolerance=40),
     goal("plain", "staysWithin", "Không còn giày thử, chạy 3 bước mỗi khung", sprite="hero", axis="x", min=390, max=399,
          frames=[62, 79])],
    prep=[("record = 2\n", "record = 0\n"), ('''    for i in range(3):
        y = 180 + i * 120
        draw_rect(60, y, 480, 100, "#33334a")
        row''', '''    # Em viết tiếp ở đây
    for i in range(3):
        y = 180 + i * 120
        draw_rect(60, y, 480, 100, "#33334a")
        row''')],
    fills=[SIGN],
    sol=[("START_WAVE = 4\n", "START_WAVE = 0\n"), ("START_SKILLS = [9]\n", "START_SKILLS = []\n")],
    wrong=[("quên tháo skill thử", [SIGN], [("START_WAVE = 4\n", "START_WAVE = 0\n")]),
           ("quên tháo START_WAVE", [SIGN], [("START_SKILLS = [9]\n", "START_SKILLS = []\n")]),
           ("quên ký tên", [""], [("START_WAVE = 4\n", "START_WAVE = 0\n"), ("START_SKILLS = [9]\n", "START_SKILLS = []\n")])],
    test={"frames": 80, "taps": [], "keys": [hold("1", 5, 5), hold("1", 15, 15), hold("right", 20, 59)]},
    new="tháo đồ thử, ký tên, chơi chéo và nhận xét",
    reorganised="record bắt đầu từ 0.")
