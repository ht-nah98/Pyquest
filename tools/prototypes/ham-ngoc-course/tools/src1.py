"""h01 to h06: a hero that walks, a crowd of monsters, hearts."""
from build import ex, goal, run_goal, hold

BG = '"#2b2438"'

# ---------------------------------------------------------------- h01
ex(
    "h01-e1", "Nhân vật to gấp ba",
    "Ảnh nhân vật chỉ 16 × 16 nên nhỏ xíu. Em thêm scale=3 và đổi chỗ vẽ thành 276, 276: nhân vật to gấp 3 và đứng "
    "giữa sân. Rồi vẽ 2 ngọn đuốc deco-torch cũng to gấp 3, ở (100, 60) và (452, 60).",
    ["Sửa dòng hero-knight: đổi 292, 292 thành 276, 276, rồi thêm , scale=3 trước dấu ngoặc cuối.",
     "Vì sao 276? Ảnh 16 × 3 = 48 điểm, nửa ảnh là 24. Giữa sân là 300, nên góc ảnh ở 300 - 24 = 276.",
     "Xóa dòng # Em viết tiếp ở đây, vẽ đuốc trái: draw_image(\"images/deco-torch.png\", 100, 60, scale=3)",
     "Chép dòng đó xuống dưới, đổi 100 thành 452 để có đuốc phải.",
     "Bấm ▶ Chạy, rồi bấm 👀 để so với hình mẫu."],
    ["scale=3 đứng cuối, sau số y, ngăn bằng dấu phẩy.",
     "draw_image(\"images/hero-knight.png\", 276, 276, scale=3)",
     "draw_image(\"images/deco-torch.png\", 452, 60, scale=3)"],
    [run_goal(), goal("same", "matches", "Giống hình mẫu")],
    base='''
from pyquest import *

clear("#2b2438")
draw_image("images/hero-knight.png", 292, 292)
# Em viết tiếp ở đây
''',
    fills=['''draw_image("images/deco-torch.png", 100, 60, scale=3)
draw_image("images/deco-torch.png", 452, 60, scale=3)'''],
    sol=[('292, 292)', '276, 276, scale=3)')],
    wrong=[("quên scale ở nhân vật", ['''draw_image("images/deco-torch.png", 100, 60, scale=3)
draw_image("images/deco-torch.png", 452, 60, scale=3)'''], [('292, 292)', '276, 276)')]),
           ("chỉ vẽ một đuốc", ['draw_image("images/deco-torch.png", 100, 60, scale=3)'],
            [('292, 292)', '276, 276, scale=3)')])],
    mode="script", input="blocks", new="scale=3 trong draw_image; sân 600 × 600, giữa sân là (300, 300)")

ex(
    "h01-e2", "Nhân vật đứng ở x, y",
    "Từ giờ x, y là giữa nhân vật. Trong draw(), vẽ hero-knight to gấp 3 với góc ảnh ở x - 24, y - 24. Rồi viết tên "
    "\"Kiếm sĩ\" cỡ 18 ở ngay trên đầu: x, y - 36.",
    ["Trong draw(), xóa dòng # Em viết tiếp ở đây, vẫn thụt vào 4 dấu cách.",
     "Vẽ nhân vật: draw_image(\"images/hero-knight.png\", x - 24, y - 24, scale=3)",
     "Viết tên: draw_text(\"Kiếm sĩ\", x, y - 36, 18)",
     "Bấm ▶ Chạy. Thử đổi x = 300 thành x = 200 xem cả ảnh lẫn tên có đi cùng nhau không, rồi đổi lại 300."],
    ["Góc ảnh nằm bên trái và phía trên điểm giữa 24 bước.",
     "draw_text có số thứ tư là cỡ chữ.",
     "draw_image(\"images/hero-knight.png\", x - 24, y - 24, scale=3)"],
    [run_goal(),
     goal("hero", "drew", "Nhân vật đứng giữa sân", sprite="hero-knight", at=[276, 276]),
     goal("name", "drewText", "Có tên trên đầu", text="Kiếm sĩ")],
    base='''
from pyquest import *

x = 300
y = 300


def update():
    pass


def draw():
    clear("#2b2438")
    draw_image("images/deco-torch.png", 100, 60, scale=3)
    draw_image("images/deco-torch.png", 452, 60, scale=3)
    # Em viết tiếp ở đây
''',
    fills=['''draw_image("images/hero-knight.png", x - 24, y - 24, scale=3)
draw_text("Kiếm sĩ", x, y - 36, 18)'''],
    wrong=[("vẽ góc ảnh ở x, y", ['''draw_image("images/hero-knight.png", x, y, scale=3)
draw_text("Kiếm sĩ", x, y - 36, 18)'''], []),
           ("quên tên", ['draw_image("images/hero-knight.png", x - 24, y - 24, scale=3)'], [])],
    test={"frames": 5}, input="blocks", new="x, y là điểm giữa; góc ảnh = điểm giữa - 24")

# ---------------------------------------------------------------- h02
FOUR = '''if key_pressed("left"):
    x -= speed
if key_pressed("up"):
    y -= speed
if key_pressed("down"):
    y += speed'''
ex(
    "h02-e1", "Đi bốn hướng",
    "Phím → đã chạy. Em viết tiếp trong update() cho 3 phím còn lại: \"left\" thì x bớt speed, \"up\" thì y bớt speed, "
    "\"down\" thì y thêm speed. Nhớ: y tăng là đi xuống.",
    ["Trong update(), nhìn 2 dòng if của phím \"right\": em làm giống vậy cho 3 phím kia.",
     "if key_pressed(\"left\"): rồi thụt vào x -= speed",
     "if key_pressed(\"up\"): rồi thụt vào y -= speed",
     "if key_pressed(\"down\"): rồi thụt vào y += speed",
     "Dùng 4 chữ if riêng (không dùng elif) để giữ hai phím là đi chéo được.",
     "Bấm ▶ Chạy: máy tự giữ phím. Rồi bấm ⛶ và đi bằng phím mũi tên."],
    ["Đi lên là y nhỏ đi.", "if key_pressed(\"left\"):\n    x -= speed", "Cả bốn chữ if thẳng hàng nhau."],
    [run_goal(),
     goal("right", "varCompare", "Đi sang phải được", name="x", op=">=", value=330, when="ever"),
     goal("down", "varCompare", "Đi xuống được", name="y", op=">=", value=330, when="ever"),
     goal("left", "varCompare", "Đi sang trái được", name="x", op="<=", value=290),
     goal("up", "varCompare", "Đi lên được", name="y", op="<=", value=290)],
    prep=[("y = 300\n", "y = 300\nspeed = 3\n"),
          ("def update():\n    pass\n", '''def update():
    global x, y
    if key_pressed("right"):
        x += speed
    # Em viết tiếp ở đây
''')],
    fills=[FOUR],
    wrong=[("lên xuống bị ngược", [FOUR.replace("y -=", "y @=").replace("y +=", "y -=").replace("y @=", "y +=")], []),
           ("quên phím lên", ['''if key_pressed("left"):
    x -= speed
if key_pressed("down"):
    y += speed'''], []),
           ("mới viết một phím", ['''    if key_pressed("left"):
        x -= speed'''.replace("    if", "if").replace("        x", "    x")], [])],
    test={"frames": 160, "keys": [hold("right", 0, 29), hold("down", 30, 49), hold("left", 50, 99), hold("up", 100, 159)]},
    input="blocks", new="key_pressed(\"left\"), \"up\", \"down\": giữ phím nào thì làm việc đó",
    reorganised="Thêm speed = 3 và global x, y.")

EDGES = '''if x < 24:
    x = 24
if x > 576:
    x = 576
if y < 24:
    y = 24
if y > 576:
    y = 576'''
ex(
    "h02-e2", "Không đi ra ngoài sân",
    "Đi mãi thì nhân vật ra khỏi sân mất. Thêm 4 chữ if ở cuối update(): x nhỏ hơn 24 thì x = 24, x lớn hơn 576 thì "
    "x = 576. Với y cũng vậy.",
    ["Cuối update(), thẳng hàng với các chữ if: if x < 24: rồi thụt vào x = 24",
     "Vì sao 24? Nửa nhân vật rộng 24, nên giữa nhân vật không được gần mép hơn 24.",
     "if x > 576: rồi thụt vào x = 576 (600 - 24 = 576).",
     "Làm y hệt cho y: mép trên 24, mép dưới 576.",
     "Bấm ▶ Chạy: máy đẩy nhân vật vào hai góc. Bấm ⛶ thử cả bốn mép."],
    ["Mỗi mép là một chữ if.", "if x > 576:\n    x = 576", "Mép trên: y < 24. Mép dưới: y > 576."],
    [run_goal(),
     goal("x", "staysWithin", "Không ra khỏi mép trái, phải", sprite="hero", axis="x", min=0, max=552),
     goal("y", "staysWithin", "Không ra khỏi mép trên, dưới", sprite="hero", axis="y", min=0, max=552),
     goal("far", "varCompare", "Vẫn đi được tới sát mép", name="x", op=">=", value=570, when="ever"),
     goal("near", "varCompare", "Đi được về mép trên", name="y", op="<=", value=30, when="ever")],
    prep=[('''    if key_pressed("down"):
        y += speed
''', '''    if key_pressed("down"):
        y += speed
    # Em viết tiếp ở đây
''')],
    fills=[EDGES],
    wrong=[("chỉ chặn mép phải và dưới", ["if x > 576:\n    x = 576\nif y > 576:\n    y = 576"], []),
           ("chặn ở 600", [EDGES.replace("576", "600").replace("24", "0")], []),
           ("đứng yên luôn", [EDGES + "\nx = 300\ny = 300"], [])],
    test={"frames": 400, "keys": [hold("right", 0, 120), hold("down", 0, 120), hold("left", 121, 399), hold("up", 121, 399)]},
    input="blocks", new="chặn mép: x vượt ranh giới thì đặt lại đúng ranh giới")

# ---------------------------------------------------------------- h03
ex(
    "h03-e1", "Mỗi người một hộp",
    "knight là một hộp dict: mỗi ngăn có tên. Em làm hộp mage giống vậy: name \"Pháp sư\", image "
    "\"hero-mage\", x 420, y 300, hp 3. Pháp sư uống thuốc: cộng 2 vào mage[\"hp\"]. Rồi gọi draw_person(mage).",
    ["Nhìn dòng knight = {...}: mỗi ngăn có tên trong ngoặc kép, dấu hai chấm, rồi giá trị.",
     "Viết mage = {\"name\": \"Pháp sư\", \"image\": \"hero-mage\", \"x\": 420, \"y\": 300, \"hp\": 3}",
     "Uống thuốc: mage[\"hp\"] += 2",
     "Vẽ: draw_person(mage)",
     "Bấm ▶ Chạy: hai người đứng cạnh nhau, pháp sư có máu 5."],
    ["Dùng ngoặc nhọn { }, các ngăn cách nhau bằng dấu phẩy.",
     "mage[\"hp\"] là ngăn hp của hộp mage.",
     "mage[\"hp\"] += 2 phải nằm trên draw_person(mage)."],
    [run_goal(),
     goal("two", "called", "draw_person chạy cho hai người", name="draw_person", min=2, distinct=True),
     goal("same", "matches", "Giống hình mẫu")],
    base='''
from pyquest import *


def draw_person(person):
    draw_image("images/" + person["image"] + ".png", person["x"] - 24, person["y"] - 24, scale=3)
    draw_text(person["name"], person["x"], person["y"] - 40)
    draw_text("Máu: " + str(person["hp"]), person["x"], person["y"] + 44)


clear("#2b2438")
knight = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 180, "y": 300, "hp": 5}
draw_person(knight)
# Em viết tiếp ở đây
''',
    fills=['''mage = {"name": "Pháp sư", "image": "hero-mage", "x": 420, "y": 300, "hp": 3}
mage["hp"] += 2
draw_person(mage)'''],
    wrong=[("cộng máu sau khi vẽ", ['''mage = {"name": "Pháp sư", "image": "hero-mage", "x": 420, "y": 300, "hp": 3}
draw_person(mage)
mage["hp"] += 2'''], []),
           ("sửa nhầm hộp knight", ['''mage = {"name": "Pháp sư", "image": "hero-mage", "x": 420, "y": 300, "hp": 3}
knight["hp"] += 2
draw_person(mage)'''], [])],
    mode="script", input="blocks", keep=False, new="dict: một hộp nhiều ngăn, ngăn nào cũng có tên")

YMOVE = '''if key_pressed("up"):
    hero["y"] -= hero["speed"]
if key_pressed("down"):
    hero["y"] += hero["speed"]
if hero["y"] < 24:
    hero["y"] = 24
if hero["y"] > 576:
    hero["y"] = 576'''
ex(
    "h03-e2", "Nhân vật là một hộp",
    "x, y, speed đã dọn vào hộp hero. move_hero() mới đi ngang được. Em viết phần lên xuống: giống code Bài 2, nhưng "
    "dùng hero[\"y\"] và hero[\"speed\"]. Nhớ chặn cả mép trên và mép dưới.",
    ["Tìm def move_hero(): phần đi ngang và chặn mép trái, phải đã có sẵn.",
     "if key_pressed(\"up\"): rồi thụt vào hero[\"y\"] -= hero[\"speed\"]",
     "if key_pressed(\"down\"): rồi thụt vào hero[\"y\"] += hero[\"speed\"]",
     "Chặn mép: if hero[\"y\"] < 24: rồi hero[\"y\"] = 24. Với 576 cũng vậy.",
     "Không cần global: mình chỉ đổi một ngăn trong hộp, không thay cả cái hộp.",
     "Bấm ▶ Chạy, rồi ⛶ để đi thử."],
    ["Nhìn 8 dòng đi ngang ở ngay trên, đổi \"x\" thành \"y\".",
     "if key_pressed(\"up\"):\n    hero[\"y\"] -= hero[\"speed\"]",
     "Chép mép: if hero[\"y\"] > 576:\n    hero[\"y\"] = 576"],
    [run_goal(),
     goal("down", "staysWithin", "Đi xuống được", sprite="hero", axis="y", min=320, max=400, frames=[19, 21]),
     goal("up", "moves", "Đi lên được", sprite="hero", axis="y", dir=-1),
     goal("edge", "staysWithin", "Không ra khỏi mép trên, dưới", sprite="hero", axis="y", min=0, max=552),
     goal("hp", "drewText", "Máu hiện trên màn hình", text="Máu: 5")],
    base='''
from pyquest import *

hero = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 300, "y": 300, "hp": 5, "speed": 3}


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


def move_hero():
    if key_pressed("right"):
        hero["x"] += hero["speed"]
    if key_pressed("left"):
        hero["x"] -= hero["speed"]
    if hero["x"] < 24:
        hero["x"] = 24
    if hero["x"] > 576:
        hero["x"] = 576
    # Em viết tiếp ở đây


def update():
    move_hero()


def draw():
    clear("#2b2438")
    draw_thing("deco-torch", 124, 84, 3)
    draw_thing("deco-torch", 476, 84, 3)
    draw_thing(hero["image"], hero["x"], hero["y"], 3)
    draw_text(hero["name"], hero["x"], hero["y"] - 36, 18)
    draw_text("Máu: " + str(hero["hp"]), 60, 24)
''',
    fills=[YMOVE],
    wrong=[("quên chặn mép", ['''if key_pressed("up"):
    hero["y"] -= hero["speed"]
if key_pressed("down"):
    hero["y"] += hero["speed"]'''], []),
           ("quên đi xuống", ['''if key_pressed("up"):
    hero["y"] -= hero["speed"]
if hero["y"] < 24:
    hero["y"] = 24'''], [])],
    test={"frames": 260, "keys": [hold("down", 0, 20), hold("up", 21, 259)]},
    new="đọc và đổi một ngăn của dict, không cần global",
    reorganised="Sắp xếp lại lần 1: x, y, speed gom vào hero; phần đi tách thành move_hero(); thêm draw_thing(image, x, "
                "y, size) vẽ ảnh theo điểm giữa, nên không còn phải trừ 24 ở từng chỗ.")

# ---------------------------------------------------------------- h04
ex(
    "h04-e1", "Danh sách các hộp",
    "mobs là danh sách, mỗi phần tử là một hộp dict. Em thêm 2 con nữa: mob-ghost ở (200, 400) và mob-golem ở (400, 400). "
    "Rồi dùng for mob in mobs để vẽ cả bầy bằng draw_thing, to gấp 4.",
    ["Nhìn 3 dòng mobs.append(...) có sẵn: em viết thêm 2 dòng y như vậy.",
     "mobs.append({\"image\": \"mob-ghost\", \"x\": 200, \"y\": 400}) rồi một dòng cho mob-golem ở 400, 400.",
     "for mob in mobs: lấy lần lượt từng hộp, cất vào mob.",
     "Thụt vào: draw_thing(mob[\"image\"], mob[\"x\"], mob[\"y\"], 4)",
     "Bấm ▶ Chạy, bấm 👀 để so với hình mẫu."],
    ["append thêm một hộp vào cuối danh sách.",
     "Trong vòng for, mob là một hộp: mob[\"x\"] là x của con đó.",
     "for mob in mobs:\n    draw_thing(mob[\"image\"], mob[\"x\"], mob[\"y\"], 4)"],
    [run_goal(),
     goal("five", "called", "draw_thing chạy cho 5 con khác nhau", name="draw_thing", min=5, distinct=True),
     goal("same", "matches", "Giống hình mẫu")],
    base='''
from pyquest import *

mobs = []
mobs.append({"image": "mob-slime", "x": 100, "y": 200})
mobs.append({"image": "mob-bat", "x": 300, "y": 200})
mobs.append({"image": "mob-mushroom", "x": 500, "y": 200})


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


clear("#2b2438")
# Em viết tiếp ở đây
''',
    fills=['''mobs.append({"image": "mob-ghost", "x": 200, "y": 400})
mobs.append({"image": "mob-golem", "x": 400, "y": 400})
for mob in mobs:
    draw_thing(mob["image"], mob["x"], mob["y"], 4)'''],
    wrong=[("append sau khi vẽ", ['''for mob in mobs:
    draw_thing(mob["image"], mob["x"], mob["y"], 4)
mobs.append({"image": "mob-ghost", "x": 200, "y": 400})
mobs.append({"image": "mob-golem", "x": 400, "y": 400})'''], []),
           ("chỉ vẽ con đầu", ['''mobs.append({"image": "mob-ghost", "x": 200, "y": 400})
mobs.append({"image": "mob-golem", "x": 400, "y": 400})
mob = mobs[0]
draw_thing(mob["image"], mob["x"], mob["y"], 4)'''], [])],
    mode="script", input="blocks", keep=False, new="danh sách các dict, for mob in mobs")

ex(
    "h04-e2", "Cả bầy trong hầm",
    "make_mob(x, y) trả về một hộp quái. (1) Trong start_game(): lặp 6 lần, thêm vào mobs một con ở x ngẫu nhiên từ 40 "
    "tới 560, y = 40. (2) Trong draw(): vẽ từng con bằng draw_thing, to gấp 2.",
    ["Chỗ (1): for i in range(6): rồi thụt vào mobs.append(make_mob(random_int(40, 560), 40))",
     "make_mob(...) trả về một hộp mới, append cất hộp đó vào danh sách.",
     "Chỗ (2): for mob in mobs: rồi thụt vào draw_thing(mob[\"image\"], mob[\"x\"], mob[\"y\"], 2)",
     "Bấm ▶ Chạy: 6 con nhớt xếp hàng trên đầu sân."],
    ["(1) thêm vào danh sách, (2) vẽ từ danh sách: hai việc khác nhau.",
     "for i in range(6):\n    mobs.append(make_mob(random_int(40, 560), 40))",
     "for mob in mobs:\n    draw_thing(mob[\"image\"], mob[\"x\"], mob[\"y\"], 2)"],
    [run_goal(),
     goal("count", "drewCount", "Có 6 con quái", sprite="mob", min=6),
     goal("spread", "distinctCount", "Mỗi con một chỗ", sprite="mob", axis="x", min=4),
     goal("top", "staysWithin", "Quái ở trên đầu sân", sprite="mob", axis="y", min=20, max=28)],
    prep=[('''"hp": 5, "speed": 3}
''', '''"hp": 5, "speed": 3}
mobs = []
'''), ('''def move_hero():
''', '''def make_mob(x, y):
    return {"image": "mob-slime", "x": x, "y": y}


def start_game():
    # Em viết tiếp ở đây (1)
    pass


def move_hero():
'''), ('''    draw_thing(hero["image"]''', '''    # Em viết tiếp ở đây (2)
    draw_thing(hero["image"]'''), ('''60, 24)
''', '''60, 24)


start_game()
''')],
    fills=['''for i in range(6):
    mobs.append(make_mob(random_int(40, 560), 40))''', '''for mob in mobs:
    draw_thing(mob["image"], mob["x"], mob["y"], 2)'''],
    wrong=[("append một con ngoài vòng lặp", ["mobs.append(make_mob(random_int(40, 560), 40))", '''for mob in mobs:
    draw_thing(mob["image"], mob["x"], mob["y"], 2)'''], []),
           ("con nào cũng một chỗ", ["for i in range(6):\n    mobs.append(make_mob(300, 40))", '''for mob in mobs:
    draw_thing(mob["image"], mob["x"], mob["y"], 2)'''], [])],
    test={"frames": 5}, new="hàm trả về dict mới; thêm vào danh sách rồi vẽ từ danh sách",
    reorganised="Thêm mobs, make_mob(x, y) và start_game() (gọi ở dòng cuối file).")

# ---------------------------------------------------------------- h05
STEP = '''if thing["x"] > target["x"]:
    thing["x"] -= speed
if thing["y"] < target["y"]:
    thing["y"] += speed
if thing["y"] > target["y"]:
    thing["y"] -= speed'''
ex(
    "h05-e1", "Quái đuổi theo em",
    "step_to(thing, target, speed) cho thing bước một bước về phía target. Đã có: ở bên trái thì sang phải. Em viết 3 chữ "
    "if còn lại: ở bên phải thì sang trái, ở trên thì đi xuống, ở dưới thì đi lên.",
    ["Tìm def step_to(thing, target, speed): thing là con đang đi, target là chỗ muốn tới.",
     "if thing[\"x\"] > target[\"x\"]: rồi thụt vào thing[\"x\"] -= speed",
     "Với y: nhỏ hơn thì cộng speed, lớn hơn thì trừ speed.",
     "move_mobs() có sẵn: nó gọi step_to cho từng con, thêm một chút lắc lư để quái không chồng khít lên nhau.",
     "Bấm ▶ Chạy rồi ⛶: em chạy đâu, quái theo đó."],
    ["Mỗi trục 2 chữ if: nhỏ hơn thì cộng, lớn hơn thì trừ.",
     "Nhớ dùng thing và target, đừng viết mob hay hero trong step_to.",
     "if thing[\"y\"] < target[\"y\"]:\n    thing[\"y\"] += speed"],
    [run_goal(),
     goal("x", "staysWithin", "Quái sang trái tới chỗ em", sprite="mob", axis="x", min=80, max=122, frames=[280, 290]),
     goal("y", "staysWithin", "Quái đi xuống tới chỗ em", sprite="mob", axis="y", min=264, max=304, frames=[280, 290]),
     goal("right", "staysWithin", "Em chạy sang phải, quái theo", sprite="mob", axis="x", min=290, max=340, frames=[585, 599]),
     goal("up", "staysWithin", "Em chạy lên, quái theo", sprite="mob", axis="y", min=50, max=96, frames=[585, 599])],
    prep=[('''"mob-slime", "x": x, "y": y}''', '''"mob-slime", "x": x, "y": y, "speed": 1}'''), ('''def update():
    move_hero()
''', '''def step_to(thing, target, speed):
    if thing["x"] < target["x"]:
        thing["x"] += speed
    # Em viết tiếp ở đây


def move_mobs():
    for mob in mobs:
        step_to(mob, hero, mob["speed"])
        mob["x"] += random_int(-1, 1)
        mob["y"] += random_int(-1, 1)


def update():
    move_hero()
    move_mobs()
''')],
    fills=[STEP],
    wrong=[("quái chạy trốn theo chiều dọc", [STEP.replace('y"] += ', 'y"] @= ').replace('y"] -= ', 'y"] += ').replace("@=", "-=")], []),
           ("quên đi lên", ['''if thing["x"] > target["x"]:
    thing["x"] -= speed
if thing["y"] < target["y"]:
    thing["y"] += speed'''], []),
           ("quên sang trái", ['''if thing["y"] < target["y"]:
    thing["y"] += speed
if thing["y"] > target["y"]:
    thing["y"] -= speed'''], [])],
    test={"frames": 600, "keys": [hold("left", 0, 60), hold("right", 300, 370), hold("up", 300, 369)]},
    new="so sánh từng trục; hàm nhận vào cả một dict",
    reorganised="Hộp quái thêm ngăn speed. Thêm move_mobs() gọi step_to cho từng con, kèm lắc lư ngẫu nhiên (-1 tới 1).")

ex(
    "h05-e2", "Quái ra liên tục",
    "far_edge(value) trả về mép sân ở xa em: value nhỏ hơn 300 thì trả về 580, còn lại trả về 20. Rồi trong update(): cứ 50 "
    "khung hình, nếu có ít hơn 14 con thì gọi spawn_mob().",
    ["Chỗ (1): if value < 300: rồi thụt vào return 580. Dòng cuối, ngoài if: return 20",
     "Vì sao mép xa? Để quái không hiện ra ngay sát em, như vậy mới công bằng.",
     "Chỗ (2): tick % 50 == 0 nghĩa là cứ 50 khung thì đúng một lần.",
     "if tick % 50 == 0 and len(mobs) < 14: rồi thụt vào spawn_mob()",
     "Bấm ▶ Chạy, rồi ⛶: đứng gần mép trên thì quái ra ở mép dưới."],
    ["Hàm gặp return là xong, không chạy dòng dưới nữa.",
     "if value < 300:\n    return 580\nreturn 20",
     "if tick % 50 == 0 and len(mobs) < 14:\n    spawn_mob()"],
    [run_goal(),
     goal("more", "drewCount", "Quái đông dần lên 14 con", sprite="mob", min=14),
     goal("far", "drew", "Em ở trên thì quái ra ở mép dưới", sprite="mob-slime", at=[284, 800], tolerance=300),
     goal("edge", "called", "Có gọi far_edge", name="far_edge", min=5),
     goal("limit", "varCompare", "Không quá 14 con", name="crowd", op="<=", value=14)],
    prep=[('''mobs = []
''', '''mobs = []
tick = 0
crowd = 0
'''), ('''def start_game():
''', '''def far_edge(value):
    # Em viết tiếp ở đây (1)
    return 300


def spawn_mob():
    mobs.append(make_mob(random_int(20, 580), far_edge(hero["y"])))


def start_game():
'''), ('''def update():
    move_hero()
    move_mobs()
''', '''def update():
    global tick, crowd
    tick += 1
    # Em viết tiếp ở đây (2)
    move_hero()
    move_mobs()
    crowd = len(mobs)
'''), ('''60, 24)
''', '''60, 24)
    draw_text("Quái: " + str(crowd), 540, 24)
''')],
    fills=["if value < 300:\n    return 580\nreturn 20", "if tick % 50 == 0 and len(mobs) < 14:\n    spawn_mob()"],
    sol=[("    return 20\n    return 300\n", "    return 20\n")],
    wrong=[("nhầm mép gần", ["if value < 300:\n    return 20\nreturn 580", "if tick % 50 == 0 and len(mobs) < 14:\n    spawn_mob()"], []),
           ("khung nào cũng ra quái, không giới hạn", ["if value < 300:\n    return 580\nreturn 20", "spawn_mob()"], []),
           ("trả về 20 mãi", ["return 20", "if tick % 50 == 0 and len(mobs) < 14:\n    spawn_mob()"], [])],
    test={"frames": 600, "keys": [hold("up", 0, 599)]},
    new="đếm khung bằng tick, % để làm việc theo nhịp; hàm có return sớm",
    reorganised="Thêm tick, crowd (số quái, để hiện chữ) và spawn_mob().")

# ---------------------------------------------------------------- h06
ex(
    "h06-e1", "Gần bao nhiêu là chạm?",
    "(1) distance(a, b) trả về đường đi ngang cộng đường đi dọc giữa hai hộp, dùng abs để không bị số âm. (2) Trong "
    "check_hits(): con quái nào near hero dưới 36 thì hero[\"hp\"] bớt 1.",
    ["Chỗ (1): dx = abs(a[\"x\"] - b[\"x\"]). abs(-5) là 5: bỏ dấu trừ đi.",
     "dy = abs(a[\"y\"] - b[\"y\"]), rồi return dx + dy thay cho return 0.",
     "Chỗ (2): for mob in mobs: rồi thụt vào if near(mob, hero, 36):",
     "Thụt thêm: hero[\"hp\"] -= 1",
     "Bấm ▶ Chạy: hầm chỉ có 1 con. Nó vừa chạm là máu tụt ngay, máy chạy né một lần rồi vẫn thua. Bài tập 2 sẽ sửa."],
    ["Nhớ xóa dòng return 0.",
     "dx = abs(a[\"x\"] - b[\"x\"])\ndy = abs(a[\"y\"] - b[\"y\"])\nreturn dx + dy",
     "for mob in mobs:\n    if near(mob, hero, 36):\n        hero[\"hp\"] -= 1"],
    [run_goal(),
     goal("full", "drewText", "Chưa chạm thì chưa mất máu", text="Máu: 5"),
     goal("over", "varEquals", "Bị chạm nhiều thì thua", name="game_over", value=True),
     goal("late", "varCompare", "Quái tới sát mới mất máu", name="tick", op=">=", value=230),
     goal("soon", "varCompare", "Chạm là mất máu ngay", name="tick", op="<=", value=520)],
    prep=[('''range(6)''', '''range(1)'''), ('''len(mobs) < 14''', '''len(mobs) < 1'''), ('''crowd = 0
''', '''crowd = 0
game_over = False
'''), ('''def step_to(''', '''def distance(a, b):
    # Em viết tiếp ở đây (1)
    return 0


def near(a, b, size):
    return distance(a, b) < size


def check_hits():
    # Em viết tiếp ở đây (2)
    pass


def step_to('''), ('''    global tick, crowd
    tick += 1
''', '''    global tick, crowd, game_over
    if game_over:
        return
    tick += 1
'''), ('''    crowd = len(mobs)
''', '''    crowd = len(mobs)
    check_hits()
    if hero["hp"] <= 0:
        game_over = True
'''), ('''str(crowd), 540, 24)
''', '''str(crowd), 540, 24)
    if game_over:
        draw_text("Thua rồi!", 300, 250, 48)
''')],
    fills=['''dx = abs(a["x"] - b["x"])
dy = abs(a["y"] - b["y"])
return dx + dy''', '''for mob in mobs:
    if near(mob, hero, 36):
        hero["hp"] -= 1'''],
    sol=[("    return dx + dy\n    return 0\n", "    return dx + dy\n")],
    wrong=[("chỉ đo chiều ngang", ['return abs(a["x"] - b["x"])', '''for mob in mobs:
    if near(mob, hero, 36):
        hero["hp"] -= 1'''], []),
           ("quên abs", ['return a["x"] - b["x"] + a["y"] - b["y"]', '''for mob in mobs:
    if near(mob, hero, 36):
        hero["hp"] -= 1'''], []),
           ("chỉ đo chiều dọc", ['return abs(a["y"] - b["y"])', '''for mob in mobs:
    if near(mob, hero, 36):
        hero["hp"] -= 1'''], []),
           ("trừ máu không cần chạm", ['''dx = abs(a["x"] - b["x"])
dy = abs(a["y"] - b["y"])
return dx + dy''', '''for mob in mobs:
    hero["hp"] -= 1'''], [])],
    test={"frames": 560, "keys": [hold("right", 130, 190), hold("up", 130, 172), hold("right", 293, 322), hold("down", 293, 322)]},
    new="abs; khoảng cách = ngang + dọc; near(a, b, size) trả về True/False",
    reorganised="Thêm game_over và chữ Thua rồi! (như Bay Qua Khe); tick chỉ đếm khi còn chơi. Bài tập này chỉ có 1 con quái cho dễ nhìn máu tụt.")

ex(
    "h06-e2", "Bất tử một chút",
    "Một lần chạm mà mất sạch máu thì chán quá. safe đếm số khung em còn bất tử. (1) Nếu safe > 0: safe bớt 1 rồi return. "
    "(2) Khi bị chạm: máu bớt 1 và safe = 60, rồi return để chỉ một con làm em đau.",
    ["Chỗ (1), đầu check_hits(): if safe > 0: rồi thụt vào safe -= 1 và return",
     "return ở đây nghĩa là: đang bất tử thì thôi, không xét chạm nữa.",
     "Chỗ (2), ngay dưới hero[\"hp\"] -= 1, cùng thụt lề: safe = 60 rồi return",
     "60 khung là khoảng 1 giây. Phần nhấp nháy khi bất tử đã có sẵn trong draw().",
     "Bấm ▶ Chạy, rồi ⛶: bị chạm thì em nhấp nháy và có 1 giây để chạy."],
    ["safe đếm ngược từ 60 về 0.",
     "if safe > 0:\n    safe -= 1\n    return",
     "hero[\"hp\"] -= 1\nsafe = 60\nreturn"],
    [run_goal(),
     goal("one", "drewText", "Chạm lần đầu chỉ mất 1 máu", text="Máu: 4"),
     goal("two", "drewText", "Hết bất tử lại mất máu", text="Máu: 2"),
     goal("alive", "varEquals", "Không thua ngay lập tức", name="game_over", value=False),
     goal("blink", "varCompare", "Có lúc đang bất tử", name="safe", op=">=", value=30, when="ever")],
    prep=[('''range(1)''', '''range(6)'''), ('''len(mobs) < 1:''', '''len(mobs) < 14:'''), ('''game_over = False
''', '''game_over = False
safe = 0
'''), ('''def check_hits():
    for mob in mobs:
        if near(mob, hero, 36):
            hero["hp"] -= 1
''', '''def check_hits():
    global safe
    # Em viết tiếp ở đây (1)
    for mob in mobs:
        if near(mob, hero, 36):
            hero["hp"] -= 1
            # Em viết tiếp ở đây (2)
'''), ('''    draw_thing(hero["image"], hero["x"], hero["y"], 3)
''', '''    if safe % 10 < 5:
        draw_thing(hero["image"], hero["x"], hero["y"], 3)
''')],
    fills=["if safe > 0:\n    safe -= 1\n    return", "safe = 60\nreturn"],
    wrong=[("quên trừ safe", ["if safe > 0:\n    return", "safe = 60\nreturn"], []),
           ("quên đặt safe = 60", ["if safe > 0:\n    safe -= 1\n    return", "return"], [])],
    test={"frames": 400},
    new="đếm ngược khung hình (cooldown)",
    reorganised="Cả bầy trở lại (6 con, thêm dần tới 14). Thêm safe; draw() nhấp nháy nhân vật khi safe > 0.")
