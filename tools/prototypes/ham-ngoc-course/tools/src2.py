"""h07 to h12: aim and shoot, gems, screens, the skill table."""
from build import ex, goal, run_goal, hold

# ---------------------------------------------------------------- h07
NEAREST = '''best = mobs[0]
for mob in mobs:
    if distance(mob, hero) < distance(best, hero):
        best = mob
return best'''
ex(
    "h07-e1", "Con nào gần nhất?",
    "nearest() phải trả về con quái gần em nhất. Cách làm: coi mobs[0] là gần nhất, đi qua từng con, con nào gần hơn best "
    "thì best = con đó. Cuối cùng return best. Vạch trắng sẽ nối em với con gần nhất.",
    ["Tìm def nearest(): giờ nó luôn trả về mobs[0]. Xóa dòng return đó.",
     "best = mobs[0]: tạm coi con đầu tiên là gần nhất.",
     "for mob in mobs: rồi thụt vào if distance(mob, hero) < distance(best, hero):",
     "Thụt thêm: best = mob (tìm được con gần hơn thì nhớ con mới).",
     "Hết vòng for, thụt lề ngang chữ for: return best",
     "Bấm ▶ Chạy, rồi ⛶: em đi đâu, vạch trắng cũng chỉ con gần nhất."],
    ["Giống tìm bạn thấp nhất lớp: so từng bạn với bạn đang giữ kỷ lục.",
     "Dấu < nghĩa là gần hơn.",
     "return best nằm ngoài vòng for, đừng thụt vào trong.",
     "if distance(mob, hero) < distance(best, hero):\n    best = mob"],
    [run_goal(),
     goal("near", "varCompare", "Vạch chỉ đúng con gần nhất", name="target_far", op="<=", value=120),
     goal("called", "called", "Có gọi distance để so sánh", name="distance", min=20)],
    prep=[('''safe = 0
''', '''safe = 0
target_far = 0
'''), ('''def check_hits():
''', '''def nearest():
    # Em viết tiếp ở đây
    return mobs[0]


def check_hits():
'''), ('''    global tick, crowd, game_over
''', '''    global tick, crowd, game_over, target_far
'''), ('''    crowd = len(mobs)
''', '''    crowd = len(mobs)
    target_far = distance(nearest(), hero)
'''), ('''    for mob in mobs:
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
''', '''    target = nearest()
    draw_line(hero["x"], hero["y"], target["x"], target["y"], "#ffffff", 2)
    for mob in mobs:
        draw_thing(mob["image"], mob["x"], mob["y"], 2)
''')],
    fills=[NEAREST],
    sol=[("    return best\n    return mobs[0]\n", "    return best\n")],
    wrong=[("nhầm con xa nhất", [NEAREST.replace(") < ", ") > ")], [("    return best\n    return mobs[0]\n", "    return best\n")]),
           ("return trong vòng for", ['''best = mobs[0]
for mob in mobs:
    if distance(mob, hero) < distance(best, hero):
        best = mob
    return best'''], []),
           ("luôn trả về con cuối", ['''best = mobs[0]
for mob in mobs:
    best = mob
return best'''], [("    return best\n    return mobs[0]\n", "    return best\n")])],
    test={"frames": 150, "keys": [hold("right", 0, 80)]},
    new="tìm nhỏ nhất trong danh sách: giữ kỷ lục, gặp con tốt hơn thì thay",
    reorganised="Thêm target_far (đường tới con gần nhất) và vạch trắng trong draw().")

# ---------------------------------------------------------------- h08
ex(
    "h08-e1", "Cứ một lúc lại bắn",
    "wait đếm ngược tới lượt bắn. Trong shoot(): wait bớt 1; nếu wait <= 0 thì thêm vào shots một viên "
    "make_shot(nearest()), cộng 1 vào fired, rồi đặt wait = 30. Đạn tạm thời bay thẳng lên.",
    ["Trong shoot(), xóa pass. Dòng đầu: wait -= 1",
     "if wait <= 0: là đã tới lượt bắn.",
     "Thụt vào: shots.append(make_shot(nearest()))",
     "Thụt vào tiếp: fired += 1 rồi wait = 30 (30 khung nữa mới bắn tiếp).",
     "Bấm ▶ Chạy: máy đếm số viên đạn. Bấm ⛶ xem đạn bay lên đều đặn."],
    ["Ba việc khi bắn: thêm đạn, đếm, đặt lại đồng hồ.",
     "Quên wait = 30 thì khung nào cũng bắn.",
     "wait -= 1\nif wait <= 0:\n    shots.append(make_shot(nearest()))\n    fired += 1\n    wait = 30"],
    [run_goal(),
     goal("many", "varCompare", "Bắn được nhiều lần", name="fired", op=">=", value=5),
     goal("rest", "varCompare", "Có nghỉ giữa hai lần bắn", name="fired", op="<=", value=8),
     goal("shots", "drewCount", "Có đạn bay trên sân", sprite="shot", min=2)],
    prep=[('''target_far = 0
''', '''shots = []
wait = 0
fired = 0
'''), ('''def check_hits():
''', '''def make_shot(target):
    vx = 0
    vy = -7
    return {"x": hero["x"], "y": hero["y"], "vx": vx, "vy": vy}


def shoot():
    global wait, fired
    # Em viết tiếp ở đây
    pass


def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]


def check_hits():
'''), ('''    global tick, crowd, game_over, target_far
''', '''    global tick, crowd, game_over
'''), ('''    target_far = distance(nearest(), hero)
''', '''    shoot()
    move_shots()
'''), ('''    target = nearest()
    draw_line(hero["x"], hero["y"], target["x"], target["y"], "#ffffff", 2)
''', '''    for shot in shots:
        draw_thing("shot-spark", shot["x"], shot["y"], 1)
'''), ('''str(crowd), 540, 24)
''', '''str(crowd), 540, 24)
    draw_text("Đã bắn: " + str(fired), 300, 24)
''')],
    fills=['''wait -= 1
if wait <= 0:
    shots.append(make_shot(nearest()))
    fired += 1
    wait = 30'''],
    wrong=[("quên đặt lại wait", ['''wait -= 1
if wait <= 0:
    shots.append(make_shot(nearest()))
    fired += 1'''], []),
           ("quên thêm đạn vào danh sách", ['''wait -= 1
if wait <= 0:
    fired += 1
    wait = 30'''], []),
           ("quên trừ wait", ['''if wait <= 0:
    shots.append(make_shot(nearest()))
    fired += 1
    wait = 30'''], [])],
    test={"frames": 200},
    new="đếm ngược rồi làm, làm xong đặt lại; danh sách đạn",
    reorganised="Bỏ target_far và vạch trắng (nearest() giờ dùng để bắn); thêm shots, wait, fired, make_shot, move_shots.")

AIM = '''far = distance(target, hero) + 1
vx = (target["x"] - hero["x"]) / far * 8
vy = (target["y"] - hero["y"]) / far * 8'''
ex(
    "h08-e2", "Bắn về phía quái",
    "Giờ cho đạn bay tới target. Trong make_shot: far = distance(target, hero) + 1. vx là (x của target - x của hero) / far "
    "* 8. vy cũng vậy với y. Phần đếm hits đã có sẵn.",
    ["Trong make_shot, thay vx = 0 và vy = -7.",
     "far = distance(target, hero) + 1. Cộng 1 để không bao giờ chia cho 0.",
     "vx = (target[\"x\"] - hero[\"x\"]) / far * 8. Nhớ dấu ngoặc tròn.",
     "vy = (target[\"y\"] - hero[\"y\"]) / far * 8",
     "Chia cho far để đạn bay đều. Quái ở đúng ngay chỗ em thì vx, vy đều là 0: hai dòng if có sẵn cho đạn bay thẳng lên.",
     "Bấm ▶ Chạy, rồi ⛶: đạn tự tìm con gần nhất."],
    ["target trừ hero, đừng viết ngược.",
     "Không chia cho far thì đạn bay vèo một phát hết sân.",
     "vx = (target[\"x\"] - hero[\"x\"]) / far * 8\nvy = (target[\"y\"] - hero[\"y\"]) / far * 8"],
    [run_goal(),
     goal("side", "distinctCount", "Đạn bay cả sang ngang", sprite="shot", axis="x", min=20),
     goal("up", "distinctCount", "Đạn bay cả lên xuống", sprite="shot", axis="y", min=20),
     goal("down", "drew", "Quái ở dưới thì đạn bay xuống", sprite="shot-spark", at=[300, 1000], tolerance=580),
     goal("smooth", "staysWithin", "Đạn bay đều, không nhảy vọt", sprite="shot", axis="y", min=-4300, max=4500),
     goal("hit", "varCompare", "Ngắm đúng cả ngang lẫn dọc nên trúng nhiều", name="hits", op=">=", value=180),
     goal("fast", "varCompare", "Đạn bay nhanh, không nằm lì trên quái", name="hits", op="<=", value=310)],
    prep=[('''    vx = 0
    vy = -7
''', '''    # Em viết tiếp ở đây
    vx = 0
    vy = -7
    if vx == 0 and vy == 0:
        vy = -8
'''), ('''str(fired), 300''', '''str(hits), 300'''), ('''"Đã bắn: "''', '''"Đạn chạm: "'''), ('''fired = 0
''', '''hits = 0
'''), ('''    global wait, fired
''', '''    global wait
'''), ('''        fired += 1
''', ''), ('''def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]
''', '''def move_shots():
    for shot in shots:
        shot["x"] += shot["vx"]
        shot["y"] += shot["vy"]


def hit_mobs():
    global hits
    for shot in shots:
        for mob in mobs:
            if near(shot, mob, 30):
                hits += 1
'''), ('''    move_shots()
    check_hits()
''', '''    move_shots()
    hit_mobs()
    check_hits()
''')],
    fills=['''far = distance(target, hero) + 1
vx = (target["x"] - hero["x"]) / far * 8
vy = (target["y"] - hero["y"]) / far * 8'''],
    sol=[('''/ far * 8
    vx = 0
    vy = -7
''', '''/ far * 8
''')],
    wrong=[("bay ngược", ['''far = distance(target, hero) + 1
vx = (hero["x"] - target["x"]) / far * 8
vy = (hero["y"] - target["y"]) / far * 8'''], [('''/ far * 8
    vx = 0
    vy = -7
''', '''/ far * 8
''')]),
           ("quên chia cho far", ['''vx = target["x"] - hero["x"]
vy = target["y"] - hero["y"]'''], [('''hero["y"]
    vx = 0
    vy = -7
''', '''hero["y"]
''')]),
           ("quên vy", ['''far = distance(target, hero) + 1
vx = (target["x"] - hero["x"]) / far * 8
vy = 0'''], [('''vy = 0
    vx = 0
    vy = -7
''', '''vy = 0
''')])] + [(what, [AIM.replace(old, new)], [("    vx = 0\n    vy = -7\n", "")]) for what, old, new in [
        ("ngược mỗi vx", '(target["x"] - hero["x"])', '(hero["x"] - target["x"])'),
        ("ngược mỗi vy", '(target["y"] - hero["y"])', '(hero["y"] - target["y"])'),
        ("quên cộng 1", " + 1", ""), ("nhân 1 thay cho 8", "* 8", "* 1"),
        ("quên ngoặc tròn", '(target["x"] - hero["x"])', 'target["x"] - hero["x"]')]],
    test={"frames": 443, "keys": [hold("right", 0, 100), hold("left", 313, 383), hold("up", 313, 353)]},
    new="hướng = (đích - mình) / khoảng cách × tốc độ",
    reorganised="make_shot có sẵn luật: vx và vy đều 0 (quái ở đúng chỗ em) thì bắn thẳng lên. Thay fired bằng hits; thêm hit_mobs() đếm lần đạn chạm quái.")

# ---------------------------------------------------------------- h09
DEAD = '''alive = []
for mob in mobs:
    if mob["hp"] > 0:
        alive.append(mob)
    else:
        kills += 1
mobs = alive'''
ex(
    "h09-e1", "Hết máu thì biến mất",
    "Đạn chạm là quái mất máu. Em viết remove_dead(): tạo danh sách mới alive; con nào còn máu thì append vào alive, con "
    "nào hết máu thì cộng 1 vào kills. Cuối cùng mobs = alive.",
    ["Trong remove_dead(), xóa pass. Dòng đầu: alive = []",
     "for mob in mobs: rồi thụt vào if mob[\"hp\"] > 0:",
     "Thụt thêm: alive.append(mob): con này còn máu nên được giữ lại.",
     "else: rồi thụt vào kills += 1",
     "Hết vòng for, thụt lề ngang chữ for: mobs = alive",
     "Bấm ▶ Chạy, rồi ⛶: chữ Hạ tăng lên, quái biến mất."],
    ["Không xóa khi đang đi qua danh sách: mình chép những con muốn giữ sang danh sách mới.",
     "if mob[\"hp\"] > 0:\n    alive.append(mob)\nelse:\n    kills += 1",
     "mobs = alive nằm ngoài vòng for."],
    [run_goal(),
     goal("kill", "varCompare", "Hết máu là bị hạ ngay: hạ được 10 con", name="kills", op=">=", value=10),
     goal("once", "varCompare", "Còn máu thì chưa bị hạ, mỗi con đếm một lần", name="kills", op="<=", value=10),
     goal("gone", "varCompare", "Quái hạ rồi thì biến mất", name="crowd", op="<=", value=6),
     goal("keep", "varCompare", "Quái còn máu thì vẫn ở lại", name="crowd", op=">=", value=2)],
    prep=[('''"y": y, "speed": 1}''', '''"y": y, "hp": 2, "speed": 1}'''), ('''hits = 0
''', '''kills = 0
'''), ('''def hit_mobs():
    global hits
    for shot in shots:
        for mob in mobs:
            if near(shot, mob, 30):
                hits += 1
''', '''def hit_mobs():
    for shot in shots:
        for mob in mobs:
            if near(shot, mob, 30):
                mob["hp"] -= 1


def remove_dead():
    global mobs, kills
    # Em viết tiếp ở đây
    pass
'''), ('''    wait -= 1
    if wait <= 0:
''', '''    wait -= 1
    if wait <= 0 and len(mobs) > 0:
'''), ('''    crowd = len(mobs)
    shoot()
''', '''    shoot()
'''), ('''    hit_mobs()
''', '''    hit_mobs()
    remove_dead()
    crowd = len(mobs)
'''), ('''"Đạn chạm: " + str(hits)''', '''"Hạ: " + str(kills)''')],
    fills=[DEAD],
    wrong=[("quên mobs = alive", [DEAD.replace("\nmobs = alive", "")], []),
           ("giữ con hết máu", [DEAD.replace("> 0", "<= 0")], []),
           ("xóa khi hết máu mà không đếm", [DEAD.replace("kills += 1", "kills += 0")], []),
           ("giữ cả con còn 0 máu", [DEAD.replace("> 0", ">= 0")], []),
           ("bỏ luôn con còn 1 máu", [DEAD.replace("> 0", "> 1")], []),
           ("gặp con hết máu là thôi xem tiếp", [DEAD.replace("kills += 1", "kills += 1\n        break")], [])],
    test={"frames": 305},
    new="giữ lại bằng danh sách mới: duyệt, append con muốn giữ, rồi thay danh sách cũ",
    reorganised="Hộp quái thêm ngăn hp (bài đầu tiên cần tới). hit_mobs() giờ trừ máu quái thay vì đếm hits; shoot() chỉ bắn khi còn quái (danh sách có thể rỗng).")

ex(
    "h09-e2", "Đạn trúng là mất",
    "Giờ một viên đạn xuyên qua cả bầy. (1) Khi trúng: thêm dòng shot[\"live\"] = False. (2) Viết remove_shots(): giữ lại "
    "những viên còn live và near hero dưới hero[\"reach\"] (tầm bắn) bằng danh sách mới kept.",
    ["Chỗ (1), ngay dưới mob[\"hp\"] -= 1: shot[\"live\"] = False",
     "Viên đã trúng thì không được trúng nữa: chữ if đã có sẵn and shot[\"live\"].",
     "Chỗ (2): kept = [] rồi for shot in shots:",
     "Thụt vào: if shot[\"live\"] and near(shot, hero, hero[\"reach\"]): rồi thụt thêm kept.append(shot)",
     "Cuối cùng, ngang chữ for: shots = kept",
     "Bấm ▶ Chạy: giờ phải trúng 2 viên mới hạ được một con."],
    ["Giống remove_dead ở bài tập 1, chỉ khác điều kiện giữ lại.",
     "if shot[\"live\"] and near(shot, hero, hero[\"reach\"]):\n    kept.append(shot)",
     "shots = kept nằm ngoài vòng for."],
    [run_goal(),
     goal("kill", "varCompare", "Vẫn hạ được quái", name="kills", op=">=", value=4),
     goal("one", "varCompare", "Một viên chỉ trúng một lần", name="kills", op="<=", value=9),
     goal("few", "varCompare", "Đạn trúng rồi hay bay quá tầm thì mất", name="flying", op="<=", value=1),
     goal("some", "varCompare", "Đạn chưa trúng thì vẫn bay", name="flying", op=">=", value=1, when="ever")],
    prep=[('''"hp": 5, "speed": 3}
''', '''"hp": 5, "speed": 3}
hero["reach"] = 400
'''), ('''kills = 0
''', '''kills = 0
flying = 0
'''), ('''return {"x": hero["x"], "y": hero["y"], "vx": vx, "vy": vy}''', '''return {"x": hero["x"], "y": hero["y"], "vx": vx, "vy": vy, "live": True}'''),
          ('''            if near(shot, mob, 30):
                mob["hp"] -= 1
''', '''            if near(shot, mob, 30) and shot["live"]:
                mob["hp"] -= 1
                # Em viết tiếp ở đây (1)
'''), ('''def remove_dead():
''', '''def remove_shots():
    global shots, flying
    # Em viết tiếp ở đây (2)
    flying = len(shots)


def remove_dead():
'''), ('''    remove_dead()
''', '''    remove_shots()
    remove_dead()
''')],
    fills=['shot["live"] = False', '''kept = []
for shot in shots:
    if shot["live"] and near(shot, hero, hero["reach"]):
        kept.append(shot)
shots = kept'''],
    wrong=[("quên shot live = False", ["", '''kept = []
for shot in shots:
    if shot["live"] and near(shot, hero, hero["reach"]):
        kept.append(shot)
shots = kept'''], []),
           ("giữ hết đạn", ['shot["live"] = False', '''kept = []
for shot in shots:
    kept.append(shot)
shots = kept'''], []),
           ("xóa hết đạn", ['shot["live"] = False', "shots = []"], [])] + [
           (what, ['shot["live"] = False', "kept = []\nfor shot in shots:\n    if " + cond + ":\n        kept.append(shot)\nshots = kept"], [])
           for what, cond in [("quên xét tầm bắn", 'shot["live"]'), ("quên xét live", 'near(shot, hero, hero["reach"])'),
                              ("or thay and", 'shot["live"] or near(shot, hero, hero["reach"])'),
                              ("giữ viên ngoài tầm", 'shot["live"] and not near(shot, hero, hero["reach"])')]],
    test={"frames": 407, "keys": [hold("right", 77, 177), hold("down", 129, 229)]},
    new="cờ True/False trong dict (live) để đánh dấu, dọn sau",
    reorganised="make_shot thêm ngăn live; thêm biến flying (số đạn đang bay).")

# ---------------------------------------------------------------- h10
GEMS = '''kept = []
for gem in gems:
    if near(gem, hero, 40):
        xp += 1
    else:
        kept.append(gem)
gems = kept'''
ex(
    "h10-e1", "Rơi ngọc, nhặt ngọc",
    "(1) Trong remove_dead(), quái hết máu thì thêm vào gems một hộp có x, y của con quái. (2) Viết take_gems(): viên nào "
    "near hero dưới 40 thì xp cộng 1, viên còn lại giữ trong kept.",
    ["Chỗ (1), ngay dưới kills += 1: gems.append({\"x\": mob[\"x\"], \"y\": mob[\"y\"]})",
     "Chỗ (2): kept = [] rồi for gem in gems:",
     "Thụt vào: if near(gem, hero, 40): rồi xp += 1",
     "else: rồi kept.append(gem): viên chưa nhặt thì giữ lại.",
     "Cuối cùng, ngang chữ for: gems = kept",
     "Bấm ▶ Chạy: máy tự đi nhặt. Rồi ⛶ để em nhặt."],
    ["Nhặt ngọc cũng là giữ lại bằng danh sách mới, giống Bài 9.",
     "gems.append({\"x\": mob[\"x\"], \"y\": mob[\"y\"]})",
     "if near(gem, hero, 40):\n    xp += 1\nelse:\n    kept.append(gem)"],
    [run_goal(),
     goal("drop", "drewCount", "Quái rơi ngọc", sprite="item-xp", min=1),
     goal("take", "varCompare", "Nhặt được ngọc", name="xp", op=">=", value=2),
     goal("once", "varCompare", "Mỗi viên chỉ tính một lần", name="xp", op="<=", value=12)],
    prep=[('''flying = 0
''', '''gems = []
xp = 0
'''), ('''    global shots, flying
''', '''    global shots
'''), ('''    shots = kept
    flying = len(shots)
''', '''    shots = kept
'''), ('''            kills += 1
    mobs = alive
''', '''            kills += 1
            # Em viết tiếp ở đây (1)
    mobs = alive


def take_gems():
    global gems, xp
    # Em viết tiếp ở đây (2)
    pass
'''), ('''    remove_dead()
''', '''    remove_dead()
    take_gems()
'''), ('''    for shot in shots:
        draw_thing("shot''', '''    for gem in gems:
        draw_thing("item-xp", gem["x"], gem["y"], 1)
    for shot in shots:
        draw_thing("shot'''), ('''str(kills), 300, 24)
''', '''str(kills), 300, 24)
    draw_text("Ngọc: " + str(xp), 180, 24)
''')],
    fills=['gems.append({"x": mob["x"], "y": mob["y"]})', GEMS],
    wrong=[("nhặt rồi mà viên vẫn còn", ['gems.append({"x": mob["x"], "y": mob["y"]})', '''for gem in gems:
    if near(gem, hero, 40):
        xp += 1'''], []),
           ("quên rơi ngọc", ["", GEMS], []),
           ("ngọc rơi ngay chỗ nhân vật", ['gems.append({"x": hero["x"], "y": hero["y"]})', GEMS.replace("xp += 1", "kept.append(gem)")], [])],
    test={"frames": 420, "keys": [hold("up", 330, 360), hold("left", 340, 380)]},
    new="dùng lại khuôn giữ lại; danh sách thứ ba của game",
    reorganised="Thêm gems, xp, take_gems(); bỏ flying.")

ex(
    "h10-e2", "Nam châm và thanh kinh nghiệm",
    "(1) Đầu vòng for trong take_gems(): nếu near(gem, hero, 150) thì gem bước về phía hero, mỗi bước 6. Dùng lại step_to "
    "nhé. (2) Trong draw(): gọi draw_bar(600 * xp / need()). draw_bar(width) có sẵn: vẽ thanh xanh rộng width.",
    ["Chỗ (1), trong vòng for gem: if near(gem, hero, 150): rồi thụt vào step_to(gem, hero, 6)",
     "step_to viết cho quái mà ngọc cũng dùng được, vì ngọc cũng có x, y.",
     "Chỗ (2): draw_bar(600 * xp / need()). Trong ngoặc là bề rộng của thanh.",
     "need() trả về số ngọc cần để lên cấp. Nhặt một nửa thì thanh dài một nửa.",
     "Bấm ▶ Chạy, rồi ⛶: ngọc tự bay về em."],
    ["Chỗ (1) chỉ 2 dòng.", "step_to(gem, hero, 6)", "draw_bar(600 * xp / need())"],
    [run_goal(),
     goal("fly", "varCompare", "Ngọc gần em tự bay nhanh về em", name="xp", op=">=", value=2),
     goal("wait", "varCompare", "Ngọc ở xa thì chưa bay", name="xp", op="<=", value=3),
     goal("stay", "staysWithin", "Ngọc bay tới em, em đứng yên", sprite="hero", axis="x", min=276, max=276),
     goal("stay2", "staysWithin", "Em cũng không bị kéo lên xuống", sprite="hero", axis="y", min=276, max=276),
     goal("bar", "drewRects", "Có thanh kinh nghiệm", min=2, at=[0, 590]),
     goal("grow", "called", "Nhặt thêm ngọc thì thanh đổi bề rộng", name="draw_bar", min=3, distinct=True)],
    prep=[('''    for gem in gems:
        if near(gem, hero, 40):
''', '''    for gem in gems:
        # Em viết tiếp ở đây (1)
        if near(gem, hero, 40):
'''), ('''def take_gems():
''', '''def need():
    return 10


def draw_bar(width):
    draw_rect(0, 590, width, 10, "#2fc9a8")


def take_gems():
'''), ('''    draw_text("Ngọc: ''', '''    draw_rect(0, 588, 600, 12, "#33334a")
    # Em viết tiếp ở đây (2)
    draw_text("Ngọc: ''')],
    fills=["if near(gem, hero, 150):\n    step_to(gem, hero, 6)", "draw_bar(600 * xp / need())"],
    wrong=[("ngọc không bay", ["", "draw_bar(600 * xp / need())"], []),
           ("quên vẽ thanh", ["if near(gem, hero, 150):\n    step_to(gem, hero, 6)", ""], []),
           ("em bị kéo về phía ngọc", ["if near(gem, hero, 150):\n    step_to(hero, gem, 1)", "draw_bar(600 * xp / need())"], []),
           ("em bị kéo về phía ngọc, 6 bước", ["if near(gem, hero, 150):\n    step_to(hero, gem, 6)", "draw_bar(600 * xp / need())"], []),
           ("ngọc ở đâu cũng bay về", ["step_to(gem, hero, 6)", "draw_bar(600 * xp / need())"], []),
           ("ngọc bước quá chậm", ["if near(gem, hero, 150):\n    step_to(gem, hero, 1)", "draw_bar(600 * xp / need())"], []),
           ("thanh lúc nào cũng dài 600", ["if near(gem, hero, 150):\n    step_to(gem, hero, 6)", "draw_bar(600)"], [])],
    test={"frames": 215},
    new="dùng lại hàm cho thứ khác; thanh = bề rộng × phần đã có",
    reorganised="Thêm need(), draw_bar(width) (vẽ thanh xanh) và nền tối của thanh.")

ex(
    "h10-e3", "Lên cấp",
    "Viết check_level(): nếu xp >= need() thì xp bớt need() và level cộng 1. Nhớ đổi need() thành return 2 + level * 2: cấp "
    "càng cao càng cần nhiều ngọc.",
    ["Trong check_level(), xóa pass: if xp >= need():",
     "Thụt vào: xp -= need() trước, rồi level += 1",
     "Phải trừ trước: cộng level trước thì need() đổi mất rồi.",
     "Trong need(): đổi return 10 thành return 2 + level * 2",
     "Bấm ▶ Chạy: có sẵn 10 viên (đồ thử). Cấp 1 cần 4, còn dư 6. Cấp 2 cần 6, vừa đủ. Vậy lên tới Cấp 3."],
    ["Dư ngọc thì giữ lại, đừng đặt xp = 0.",
     "if xp >= need():\n    xp -= need()\n    level += 1",
     "return 2 + level * 2"],
    [run_goal(),
     goal("level", "varCompare", "10 viên: dùng 4, dư 6, vừa đủ lên cấp 3", name="level", op=">=", value=3),
     goal("slow", "varCompare", "Hết ngọc thì dừng ở cấp 3", name="level", op="<=", value=3),
     goal("plus", "varCompare", "Số ngọc không bị âm", name="xp", op=">=", value=0),
     goal("spend", "varCompare", "Lên cấp thì trừ ngọc đã dùng", name="xp", op="<=", value=0),
     goal("text", "drewText", "Cấp 3 hiện trên màn hình", text="Cấp 3")],
    prep=[('''xp = 0
''', '''xp = 10
level = 1
'''), ('''def take_gems():
''', '''def check_level():
    global xp, level
    # Em viết tiếp ở đây
    pass


def take_gems():
'''), ('''    take_gems()
''', '''    take_gems()
    check_level()
'''), ('''    draw_text("Ngọc: " + str(xp), 180, 24)
''', '''    draw_text("Cấp " + str(level), 180, 24)
''')],
    fills=["if xp >= need():\n    xp -= need()\n    level += 1"],
    sol=[("    return 10\n", "    return 2 + level * 2\n")],
    wrong=[("quên trừ xp", ["if xp >= need():\n    level += 1"], [("    return 10\n", "    return 2\n")]),
           ("quên cộng level", ["if xp >= need():\n    xp -= need()"], [("    return 10\n", "    return 2 + level * 2\n")]),
           ("cấp nào cũng cần 1 viên", ["if xp >= need():\n    xp -= need()\n    level += 1"], [("    return 10\n", "    return 1\n")]),
           ("cộng level trước khi trừ", ["if xp >= need():\n    level += 1\n    xp -= need()"], [("    return 10\n", "    return 2 + level * 2\n")]),
           ("đặt xp = 0", ["if xp >= need():\n    xp = 0\n    level += 1"], [("    return 10\n", "    return 2 + level * 2\n")]),
           ("cấp nào cũng cần 4 viên", ["if xp >= need():\n    xp -= need()\n    level += 1"], [("    return 10\n", "    return 4\n")]),
           ("quên đổi need()", ["if xp >= need():\n    xp -= need()\n    level += 1"], []),
           ("level = 2 thay cho += 1", ["if xp >= need():\n    xp -= need()\n    level = 2"], [("    return 10\n", "    return 2 + level * 2\n")]),
           ("so >, vừa đủ mà không lên cấp", ["if xp > need():\n    xp -= need()\n    level += 1"], [("    return 10\n", "    return 2 + level * 2\n")])],
    test={"frames": 60},
    new="ngưỡng tăng dần; trừ phần đã dùng, giữ phần dư",
    reorganised="Thêm level, check_level(); chữ Ngọc đổi thành Cấp. Bắt đầu với 10 viên (đồ thử, Bài 11 về 0).")

# ---------------------------------------------------------------- h11
ex(
    "h11-e1", "Chờ, chơi, thua, chơi lại",
    "screen là màn đang mở: \"title\", \"play\" hay \"over\". Viết update(): nếu đang \"play\" thì gọi update_play(). Không thì "
    "(màn chờ hoặc thua), bấm Space mới gọi start_game().",
    ["Trong update(), thay dòng update_play() bằng if screen == \"play\":",
     "Thụt vào: update_play()",
     "elif key_pressed(\"space\"): rồi thụt vào start_game()",
     "start_game() đặt lại máu, quái, đạn, ngọc, cấp… rồi đổi screen = \"play\".",
     "START_HP = 1 để thua nhanh cho dễ thử. Bài tập 2 có sẵn 5 máu.",
     "Bấm ▶ Chạy: máy bấm Space, chơi, thua, bấm Space chơi lại."],
    ["Mỗi lúc game ở đúng một màn.",
     "Đang chơi mà bấm Space thì không được bắt đầu lại, nên dùng elif.",
     "if screen == \"play\":\n    update_play()\nelif key_pressed(\"space\"):\n    start_game()"],
    [run_goal(),
     goal("wait", "varCompare", "Chưa bấm thì game chưa chạy", name="tick", op="<=", value=300),
     goal("again", "varEquals", "Thua rồi chơi lại được", name="games", value=2),
     goal("play", "varEquals", "Đang chơi ván hai", name="screen", value="play")],
    prep=[('''hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
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
xp = 10
level = 1
''', '''START_HP = 1
hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}
hero["reach"] = 400
games = 0
'''), ('''def start_game():
    for i in range(6):
''', '''def start_game():
    global mobs, shots, gems, tick, safe, wait, kills, xp, level, games, screen
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
    games += 1
    screen = "play"
    for i in range(6):
'''), ('''def update():
    global tick, crowd, game_over
    if game_over:
        return
    tick += 1
''', '''def update_play():
    global tick, screen
    tick += 1
'''), ('''    crowd = len(mobs)
''', ''), ('''        game_over = True
''', '''        screen = "over"


def update():
    # Em viết tiếp ở đây
    update_play()
'''), ('''def draw():
    clear("#2b2438")
''', '''def draw_title():
    clear("#2b2438")
    draw_text("HẦM NGỌC", 300, 220, 64)
    draw_thing(hero["image"], 300, 320, 5)
    draw_text("Bấm Space để vào hầm", 300, 430)


def draw_play():
    clear("#2b2438")
'''), ('''str(crowd), 540''', '''str(len(mobs)), 540'''), ('''    if game_over:
        draw_text("Thua rồi!", 300, 250, 48)


start_game()
''', '''

def draw():
    if screen == "title":
        draw_title()
    else:
        draw_play()
    if screen == "over":
        draw_text("Thua rồi!", 300, 250, 48)
        draw_text("Bấm Space để chơi lại", 300, 320)


start_game()
screen = "title"
games = 0
''')],
    fills=['''if screen == "play":
    update_play()
elif key_pressed("space"):
    start_game()'''],
    sol=[('''        start_game()
    update_play()
''', '''        start_game()
''')],
    wrong=[("lúc nào bấm Space cũng chơi lại", ['''if key_pressed("space"):
    start_game()
if screen == "play":'''], [('''if screen == "play":
    update_play()
''', '''if screen == "play":
        update_play()
''')]),
           ("thua rồi không chơi lại được", ['''if screen == "title":
    if key_pressed("space"):
        start_game()
if screen == "play":'''], [('''if screen == "play":
    update_play()
''', '''if screen == "play":
        update_play()
''')])],
    test={"frames": 400, "taps": [30, 90, 320]},
    new="biến screen: mỗi lúc game ở đúng một màn",
    reorganised="Sắp xếp lại lần 2 (ngọc lại bắt đầu từ 0): game_over thay bằng screen; start_game() đặt giá trị đầu cho mọi biến (không còn viết hai lần ở đầu file), cuối file gọi "
                "start_game() rồi đặt screen = \"title\"; bỏ crowd; update "
                "cũ thành update_play(), draw cũ thành draw_play(); thêm draw_title(), games, START_HP.")

ex(
    "h11-e2", "Lên cấp thì dừng game",
    "(1) Trong check_level(), khi lên cấp thì đổi screen = \"cards\" để game đứng lại. (2) Trong update(), ở màn \"cards\": nếu "
    "let_go đúng và đang bấm Space thì screen = \"play\". let_go là: em đã thả Space ra kể từ lúc lên cấp.",
    ["Chỗ (1), ngay dưới level += 1: screen = \"cards\"",
     "Vì sao quái đứng lại? Vì update() chỉ gọi update_play() khi screen là \"play\".",
     "let_go nghĩa là đã thả. Có sẵn: lên cấp thì let_go = False, thả Space ra thì thành True. Nhờ vậy giữ Space không lướt mất bảng.",
     "Chỗ (2), dưới dòng let_go = True, thẳng hàng với if ở trên nó: if let_go and key_pressed(\"space\"):",
     "Thụt thêm: screen = \"play\"",
     "Nhánh cuối là elif key_pressed(\"space\"): dành cho màn chờ và màn thua.",
     "Bấm ▶ Chạy, rồi ⛶: lên cấp thì mọi thứ đứng im chờ em."],
    ["Dừng game không cần lệnh đặc biệt: chỉ cần đổi màn.",
     "screen = \"cards\"",
     "if let_go and key_pressed(\"space\"):\n    screen = \"play\""],
    [run_goal(),
     goal("cards", "drewText", "Lên cấp thì hiện bảng", text="Lên cấp 2!"),
     goal("pause", "varCompare", "Game đứng lại lúc hiện bảng", name="tick", op="<=", value=530),
     goal("play", "varEquals", "Bấm Space thì chơi tiếp", name="screen", value="play"),
     goal("same", "varEquals", "Chơi tiếp, không phải ván mới", name="games", value=1)],
    prep=[("START_HP = 1\n", "START_HP = 5\n"), ('''games = 0

''', '''games = 0
let_go = True

'''), ('''    global xp, level
''', '''    global xp, level, screen, let_go
'''), ('''        xp -= need()
        level += 1
''', '''        xp -= need()
        level += 1
        let_go = False
        # Em viết tiếp ở đây (1)
'''), ('''def update():
    if screen == "play":
        update_play()
''', '''def update():
    global screen, let_go
    if screen == "play":
        update_play()
    elif screen == "cards":
        if not key_pressed("space"):
            let_go = True
        # Em viết tiếp ở đây (2)
        pass
'''), ('''    if screen == "over":
        draw_text("Thua''', '''    if screen == "cards":
        draw_rect(60, 80, 480, 460, "#101018")
        draw_text("Lên cấp " + str(level) + "!", 300, 120, 40)
        draw_text("Bấm Space để chơi tiếp", 300, 500)
    if screen == "over":
        draw_text("Thua''')],
    fills=['screen = "cards"', 'if let_go and key_pressed("space"):\n    screen = "play"'],
    wrong=[("không dừng", ["", 'if let_go and key_pressed("space"):\n    screen = "play"'], []),
           ("giữ Space là lướt qua bảng", ['screen = "cards"', 'if key_pressed("space"):\n    screen = "play"'], []),
           ("không chơi tiếp được", ['screen = "cards"', ""], []),
           ("chơi tiếp thành ván mới", ['screen = "cards"', 'if let_go and key_pressed("space"):\n    start_game()'], [])],
    test={"frames": 600, "taps": [5, 560], "keys": [hold("up", 305, 335), hold("space", 300, 480)]},
    new="dừng game = đổi màn",
    reorganised="START_HP về 5; let_go (phải thả Space rồi bấm lại); thêm nhánh cards trong update() và bảng tối trong draw().")

# ---------------------------------------------------------------- h12
ROWS = '''SKILLS.append({"name": "Tay Chớp: bắn nhanh", "branch": "spark", "icon": 1, "what": "fast", "add": 5})
SKILLS.append({"name": "Tia Đôi: thêm 1 viên", "branch": "spark", "icon": 2, "what": "extra", "add": 1})
SKILLS.append({"name": "Mây Giông: sét đánh", "branch": "spark", "icon": 3, "what": "cloud", "add": 3})'''
ex(
    "h12-e1", "Bảng skill",
    "Mỗi skill là một dòng trong bảng SKILLS. Em viết 3 dòng nhánh \"spark\": \"Tay Chớp: bắn nhanh\" (số 1, fast, 5), "
    "\"Tia Đôi: thêm 1 viên\" (số 2, extra, 1), \"Mây Giông: sét đánh\" (số 3, cloud, 3). Không sửa phần vẽ.",
    ["Nhìn dòng SKILLS.append(...) của Áo Băng: em viết 3 dòng giống vậy, ngay dưới nó.",
     "name là tên, branch là nhánh, icon là số của hình, what là tên ngăn trong sổ sức mạnh, add là cộng bao nhiêu.",
     "Dòng 1: {\"name\": \"Tay Chớp: bắn nhanh\", \"branch\": \"spark\", \"icon\": 1, \"what\": \"fast\", \"add\": 5}",
     "Làm tiếp Tia Đôi và Mây Giông.",
     "Bấm ▶ Chạy: sổ skill tự dài ra 9 dòng dù em không sửa code vẽ."],
    ["Chép một dòng rồi đổi từng giá trị là nhanh nhất.",
     "Cả 3 dòng đều có \"branch\": \"spark\".",
     "Tia Đôi: \"icon\": 2, \"what\": \"extra\", \"add\": 1"],
    [run_goal(),
     goal("fast", "drewText", "Tay Chớp cộng 5 vào fast", text="fast +5"),
     goal("extra", "drewText", "Tia Đôi cộng 1 vào extra", text="extra +1"),
     goal("cloud", "drewText", "Mây Giông cộng 3 vào cloud", text="cloud +3"),
     goal("icon1", "drew", "Có hình sét số 1", sprite="skill-spark-1"),
     goal("icon2", "drew", "Có hình sét số 2", sprite="skill-spark-2"),
     goal("icon3", "drew", "Có hình sét số 3", sprite="skill-spark-3")],
    prep=[('''games = 0
let_go = True


def draw_thing(''', '''let_go = True

SKILLS = []
SKILLS.append({"name": "Đốm Lửa: đạn mạnh hơn", "branch": "fire", "icon": 1, "what": "power", "add": 1})
SKILLS.append({"name": "Vòng Lửa: đốt quái gần", "branch": "fire", "icon": 2, "what": "ring", "add": 2})
SKILLS.append({"name": "Nổ Tung: quái thua là nổ", "branch": "fire", "icon": 4, "what": "boom", "add": 2})
SKILLS.append({"name": "Đòn Buốt: đạn làm chậm", "branch": "ice", "icon": 1, "what": "slow", "add": 60})
SKILLS.append({"name": "Vòng Sương: tỏa lạnh", "branch": "ice", "icon": 4, "what": "frost", "add": 80})
SKILLS.append({"name": "Áo Băng: bất tử lâu hơn", "branch": "ice", "icon": 3, "what": "armor", "add": 40})
# Em viết tiếp ở đây


def draw_thing('''), ('''kills, xp, level, games, screen
''', '''kills, xp, level, screen
'''), ('''    games += 1
''', ''), ('''screen = "title"
games = 0
''', '''screen = "title"
'''), ('''let_go = True

''', '''let_go = True

''') if False else ('''def draw():
''', '''def draw_skill(skill, x, y, size):
    draw_thing("skill-" + skill["branch"] + "-" + str(skill["icon"]), x, y, size)


def draw_book():
    clear("#2b2438")
    draw_text("Sổ skill", 300, 40, 40)
    for i in range(len(SKILLS)):
        skill = SKILLS[i]
        draw_skill(skill, 50, 100 + i * 54, 2)
        draw_text(skill["name"], 270, 100 + i * 54)
        draw_text(skill["what"] + " +" + str(skill["add"]), 520, 100 + i * 54)


def draw():
'''), ('''        draw_title()
    else:''', '''        draw_book()
    else:''')],
    fills=[ROWS],
    wrong=[("nhầm what của Tia Đôi", [ROWS.replace('"extra"', '"fast"')], []),
           ("cộng nhầm số", [ROWS.replace('"add": 5', '"add": 50')], []),
           ("thiếu dòng Mây Giông", ["\n".join(ROWS.split("\n")[:2])], []),
           ("nhầm hình", [ROWS.replace('"icon": 3', '"icon": 2')], [])],
    test={"frames": 5},
    new="dữ liệu tách khỏi code: thêm một dòng trong bảng là game có thêm một skill",
    reorganised="Thêm bảng SKILLS ở đầu file và draw_skill(); bỏ games. Màn chờ tạm thời vẽ sổ skill để xem bảng.")

DEAL = '''pool = []
for skill in SKILLS:
    pool.append(skill)
for i in range(3):
    pick = pool[random_int(0, len(pool) - 1)]
    cards.append(pick)
    pool.remove(pick)'''
ex(
    "h12-e2", "Bốc 3 thẻ khác nhau",
    "Viết deal_cards(): chép mọi skill của SKILLS sang pool. Rồi lặp 3 lần: bốc một thẻ ngẫu nhiên trong pool, append vào "
    "cards và xóa khỏi pool để không bốc lại. Máy sẽ bốc 25 lần để thử.",
    ["pool = [] rồi for skill in SKILLS: và thụt vào pool.append(skill)",
     "for i in range(3): ba lần bốc.",
     "Thụt vào: pick = pool[random_int(0, len(pool) - 1)]. Ngăn cuối là len(pool) - 1.",
     "cards.append(pick): thẻ này được chọn.",
     "pool.remove(pick): bỏ ra khỏi hộp, lần sau không bốc trúng nữa.",
     "Bấm ▶ Chạy. Bấm ⛶ rồi bấm Space nhiều lần để bốc lại."],
    ["Giống bốc thăm: bốc xong không bỏ lại vào hộp.",
     "Đừng xóa khỏi SKILLS, kẻo mất skill thật. Mình xóa ở bản chép pool.",
     "pick = pool[random_int(0, len(pool) - 1)]",
     "cards.append(pick)\npool.remove(pick)"],
    [run_goal(),
     goal("three", "drewCount", "Có 3 thẻ", sprite="skill", min=3),
     goal("clash", "varEquals", "Lần nào cũng 3 thẻ khác nhau", name="clashes", value=0),
     goal("random", "drew", "Bốc được cả thẻ cuối bảng", sprite="skill-spark-3"),
     goal("random2", "drew", "Bốc được cả thẻ giữa bảng", sprite="skill-ice-1")],
    prep=[('''
SKILLS = []
''', '''cards = []
clashes = 0

SKILLS = []
'''), ('''def check_level():
''', '''def deal_cards():
    global cards
    cards = []
    # Em viết tiếp ở đây


def check_cards():
    global clashes
    if len(cards) != 3:
        clashes += 1
        return
    if cards[0] == cards[1] or cards[0] == cards[2] or cards[1] == cards[2]:
        clashes += 1


def check_level():
'''), ('''        if let_go and key_pressed("space"):
            screen = "play"
''', '''        if let_go and key_pressed("space"):
            let_go = False
            deal_cards()
            check_cards()
'''), ('''def draw_book():
    clear("#2b2438")
    draw_text("Sổ skill", 300, 40, 40)
    for i in range(len(SKILLS)):
        skill = SKILLS[i]
        draw_skill(skill, 50, 100 + i * 54, 2)
        draw_text(skill["name"], 270, 100 + i * 54)
        draw_text(skill["what"] + " +" + str(skill["add"]), 520, 100 + i * 54)
''', '''def draw_cards():
    draw_rect(40, 80, 520, 460, "#101018")
    draw_text("Chọn một thẻ", 300, 115, 40)
    draw_text("Bấm Space để bốc thẻ", 300, 156, 20)
    for i in range(len(cards)):
        skill = cards[i]
        y = 180 + i * 120
        draw_rect(60, y, 480, 100, "#33334a")
        draw_skill(skill, 110, y + 50, 4)
        draw_text(skill["name"], 340, y + 50)
'''), ('''        draw_book()
''', '''        draw_title()
'''), ('''        draw_rect(60, 80, 480, 460, "#101018")
        draw_text("Lên cấp " + str(level) + "!", 300, 120, 40)
        draw_text("Bấm Space để chơi tiếp", 300, 500)
''', '''        draw_cards()
'''), ('''    if screen == "play":
        update_play()
    elif screen == "cards":
''', '''    if screen == "play":
        update_play()
    elif screen == "cards":
'''), ('''start_game()
screen = "title"
''', '''start_game()
screen = "cards"
''')],
    fills=[DEAL],
    wrong=[("bốc xong không xóa", [DEAL.replace("\n    pool.remove(pick)", "")], []),
           ("luôn lấy 3 thẻ đầu", ['''for i in range(3):
    cards.append(SKILLS[i])'''], []),
           ("lấy hết cả bảng", ['''for skill in SKILLS:
    cards.append(skill)'''], [])],
    test={"frames": 120, "taps": list(range(4, 104, 4))},
    new="bốc không lặp lại: chép ra pool rồi remove",
    reorganised="Sổ skill đổi thành draw_cards(). Để thử nhanh: game mở ngay ở màn cards, Space là bốc lại; check_cards() đếm "
                "số lần có thẻ trùng (Bài 13 bỏ đi).")
