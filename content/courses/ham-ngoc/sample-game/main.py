# Hầm Ngọc — bản chơi thử. Đi bằng mũi tên, nhân vật tự đánh, nhặt ngọc, lên cấp thì chọn 1 trong 3 thẻ.
# Muốn đổi game: sửa các BẢNG ở đầu file trước. Phần code bên dưới chỉ đọc bảng.

from math import cos, sin, pi
from pyquest import *


# ---------- BẢNG DỮ LIỆU ----------
# Thời gian tính bằng khung hình: 60 khung = 1 giây.

BRANCHES = {
    "fire": {"name": "Lửa", "color": "#ff8a3c", "dark": "#5a2a1a"},
    "ice": {"name": "Băng", "color": "#7fd8ff", "dark": "#1d3f5c"},
    "spark": {"name": "Sét", "color": "#ffe14d", "dark": "#4f4718"},
    "common": {"name": "Chung", "color": "#b9e88a", "dark": "#2c4a2c"},
    "steam": {"name": "Hơi", "color": "#f0f0ff", "dark": "#555566"},
}

HEROES = [
    {"name": "Kiếm sĩ", "attack": "slash", "hp": 7, "speed": 2.6, "power": 4, "reload": 42, "range": 84,
     "color": "#d95f5f", "text": "7 tim. Chém cả vòng quanh mình"},
    {"name": "Pháp sư", "attack": "orb", "hp": 5, "speed": 2.6, "power": 4, "reload": 43, "range": 230,
     "color": "#9a6be0", "text": "5 tim. Đạn phép nổ lan"},
    {"name": "Cung thủ", "attack": "arrow", "hp": 6, "speed": 2.9, "power": 4, "reload": 45, "range": 235,
     "color": "#4fae6a", "text": "6 tim. Chạy nhanh, tên bay xa"},
]

MOBS = {
    "slime": {"shape": "slime", "move": "chase", "hp": 8, "speed": 1.35, "size": 13, "xp": 1, "color": "#6fcf5f"},
    "bat": {"shape": "bat", "move": "zigzag", "hp": 5, "speed": 2.1, "size": 11, "xp": 1, "color": "#b07ad9"},
    "mushroom": {"shape": "mushroom", "move": "shoot", "hp": 11, "speed": 1, "size": 14, "xp": 2, "color": "#e0605a"},
    "ghost": {"shape": "ghost", "move": "dash", "hp": 12, "speed": 1, "size": 14, "xp": 2, "color": "#dfe8ff"},
    "golem": {"shape": "golem", "move": "chase", "hp": 32, "speed": 0.8, "size": 18, "xp": 3, "color": "#b09a7a"},
    "boss1": {"shape": "slime", "move": "hop", "hp": 170, "speed": 4.6, "size": 34, "xp": 8, "color": "#3fae8a",
              "boss": "Vua Nhớt"},
    "boss2": {"shape": "mushroom", "move": "ring", "hp": 340, "speed": 0.8, "size": 36, "xp": 8, "color": "#d94f8a",
              "boss": "Nấm Chúa"},
    "boss3": {"shape": "golem", "move": "charge", "hp": 480, "speed": 1.3, "size": 38, "xp": 8, "color": "#8f84a8",
              "boss": "Vua Đá"},
}

# Mỗi đợt ghi: quái nào, mấy con. "gap": mấy khung thì ra một con. "tough": máu quái nhân lên bấy nhiêu.
WAVES = [
    {"name": "Đồng Rêu", "color": "#26382f", "tough": 1, "gap": 34, "boss": "boss1",
     "waves": [{"slime": 15}, {"slime": 14, "bat": 8}, {"slime": 12, "bat": 8, "mushroom": 5}]},
    {"name": "Rừng Nấm", "color": "#33273a", "tough": 1.6, "gap": 27, "boss": "boss2",
     "waves": [{"bat": 18, "mushroom": 8}, {"slime": 16, "ghost": 10}, {"mushroom": 10, "ghost": 10, "bat": 10}]},
    {"name": "Hang Đá", "color": "#33302c", "tough": 2.2, "gap": 23, "boss": "boss3",
     "waves": [{"golem": 7, "bat": 18}, {"ghost": 18, "mushroom": 9}, {"golem": 11, "ghost": 10, "bat": 14}]},
]

# Mỗi danh sách có 3 số: cấp 1, cấp 2, cấp 3. "every": mấy khung thì dùng một lần.
SKILLS = {
    "fire_orbit": {"name": "Đốm Lửa", "branch": "fire", "count": [1, 2, 3], "power": [4, 4, 5], "text": [
        "1 đốm lửa bay quanh em", "2 đốm lửa bay quanh em", "3 đốm lửa, nóng hơn"]},
    "fire_trail": {"name": "Vệt Than", "branch": "fire", "every": [24, 20, 16], "power": [3, 4, 5], "text": [
        "Em đi tới đâu, than cháy tới đó", "Than nóng hơn, dày hơn", "Than nóng nhất, dày nhất"]},
    "fire_hit": {"name": "Đòn Cháy", "branch": "fire", "power": [1, 2, 3], "text": [
        "Trúng đòn thì quái bị cháy", "Cháy đau gấp 2", "Cháy đau gấp 3"]},
    "fire_boom": {"name": "Nổ Tàn Tro", "branch": "fire", "radius": [45, 58, 70], "power": [3, 5, 7], "text": [
        "Quái thua thì nổ, quái gần bị đau", "Nổ to hơn", "Nổ rất to"]},
    "ice_rain": {"name": "Mưa Đá", "branch": "ice", "every": [150, 115, 85], "power": [6, 8, 10], "text": [
        "Cục đá rơi trúng quái, làm chậm", "Đá rơi nhanh hơn, đau hơn", "Đá rơi liên tục"]},
    "ice_ring": {"name": "Vòng Sương", "branch": "ice", "every": [270, 230, 190], "radius": [90, 105, 120],
                 "power": [3, 4, 6], "text": [
        "Vòng sương quanh em làm chậm quái", "Vòng rộng hơn, nhiều hơn", "Vòng rất rộng"]},
    "ice_shield": {"name": "Áo Băng", "branch": "ice", "every": [1320, 1080, 840], "power": [4, 8, 12], "text": [
        "Đỡ 1 đòn, 22 giây có lại", "18 giây có lại, vỡ ra đau hơn", "14 giây có lại, vỡ ra rất đau"]},
    "ice_hit": {"name": "Đòn Buốt", "branch": "ice", "slow": [60, 90, 120], "power": [0.5, 1, 1.5], "text": [
        "Trúng đòn thì quái chậm 1 giây", "Chậm lâu hơn, đau hơn", "Chậm 2 giây, đau hơn nữa"]},
    "spark_jump": {"name": "Sét Nhảy", "branch": "spark", "count": [2, 3, 4], "power": [3, 4, 5], "text": [
        "Đòn đánh nhảy sang 2 quái nữa", "Nhảy sang 3 quái", "Nhảy sang 4 quái"]},
    "spark_cloud": {"name": "Mây Giông", "branch": "spark", "every": [80, 60, 45], "power": [6, 7, 8], "text": [
        "Mây đi theo em, đánh sét xuống quái", "Sét nhanh hơn", "Sét rất nhanh, rất đau"]},
    "spark_trap": {"name": "Bẫy Điện", "branch": "spark", "every": [180, 140, 100], "power": [10, 14, 18], "text": [
        "Thả bẫy, quái giẫm là nổ điện", "Thả bẫy nhanh hơn", "Nhiều bẫy, rất đau"]},
    "spark_fast": {"name": "Tay Chớp", "branch": "spark", "faster": [0.8, 0.65, 0.5], "text": [
        "Đánh nhanh hơn một chút", "Đánh nhanh hơn nữa", "Đánh nhanh như chớp"]},
    "heart": {"name": "Tim To", "branch": "common", "text": ["Thêm 1 tim, hồi 2 tim"] * 3},
    "boots": {"name": "Giày Gió", "branch": "common", "text": ["Chạy nhanh hơn"] * 3},
    "magnet": {"name": "Nam Châm", "branch": "common", "text": ["Hút ngọc từ xa hơn"] * 3},
    "muscle": {"name": "Đòn Mạnh", "branch": "common", "text": ["Đòn đánh đau hơn"] * 3},
}

# "needs": mỗi nhánh cần mấy skill khác nhau thì phối hợp được mở.
COMBOS = {
    "ember": {"name": "Lò Than", "needs": {"fire": 2}, "text": "mọi đòn lửa đau thêm"},
    "chill": {"name": "Thấu Xương", "needs": {"ice": 2}, "text": "quái bị chậm thì đau thêm"},
    "stun": {"name": "Quá Tải", "needs": {"spark": 2}, "text": "đòn sét làm quái đứng hình"},
    "steam": {"name": "Hơi Nước", "needs": {"fire": 1, "ice": 1}, "text": "lửa trúng quái chậm thì nổ hơi"},
    "conduct": {"name": "Băng Dẫn Điện", "needs": {"ice": 1, "spark": 1}, "text": "sét trúng quái chậm đau gấp rưỡi"},
    "plasma": {"name": "Bão Plasma", "needs": {"fire": 1, "spark": 1}, "text": "cứ 5 giây bắn ra 8 tia"},
}

# Hình tạm: mỗi hình là vài mảnh [loại, màu, các số...]. "body" là màu riêng của con đó.
# circle: x, y, r. rect: x, y, rộng, cao. triangle: 3 góc. Có ảnh thật rồi thì bỏ bảng này, dùng draw_image.
DARK = "#1b1b28"
PARTS = {
    "slash": [["rect", "body", -8, -2, 16, 13], ["circle", "#f6cfa8", 0, -7, 8], ["rect", DARK, -5, -8, 3, 3],
              ["rect", DARK, 2, -8, 3, 3], ["rect", "#b8c0cc", -9, -16, 18, 6], ["rect", "#f4f4ff", 11, -14, 4, 19]],
    "orb": [["rect", "body", -8, -2, 16, 13], ["circle", "#f6cfa8", 0, -7, 8], ["rect", DARK, -5, -8, 3, 3],
            ["rect", DARK, 2, -8, 3, 3], ["triangle", "body", -11, -11, 11, -11, 0, -27],
            ["rect", "#8a5a3a", 11, -6, 3, 17], ["circle", "#7ff0ff", 12, -9, 5]],
    "arrow": [["rect", "body", -8, -2, 16, 13], ["circle", "#f6cfa8", 0, -7, 8], ["rect", DARK, -5, -8, 3, 3],
              ["rect", DARK, 2, -8, 3, 3], ["triangle", "body", -10, -9, 10, -9, 0, -19],
              ["triangle", "#c98a4a", 10, -12, 10, 12, 17, 0]],
    "slime": [["circle", "body", 0, 0, 1], ["rect", "body", -1, 0, 2, 0.8], ["rect", DARK, -0.5, -0.2, 0.3, 0.4],
              ["rect", DARK, 0.2, -0.2, 0.3, 0.4]],
    "bat": [["triangle", "body", 0, -0.3, 0, 0.5, -2, -0.8], ["triangle", "body", 0, -0.3, 0, 0.5, 2, -0.8],
            ["circle", "body", 0, 0, 0.7], ["rect", DARK, -0.4, -0.3, 0.8, 0.3]],
    "mushroom": [["circle", "body", 0, -0.2, 1], ["rect", "#f2e3c9", -0.5, 0.2, 1, 0.9],
                 ["circle", "#ffffff", 0.3, -0.6, 0.25], ["rect", DARK, -0.3, 0.4, 0.6, 0.2]],
    "ghost": [["circle", "body", 0, -0.2, 1], ["triangle", "body", -1, 0, 1, 0, -0.5, 1.3],
              ["triangle", "body", -1, 0, 1, 0, 0.5, 1.3], ["rect", "#39406a", -0.5, -0.4, 1, 0.35]],
    "golem": [["rect", "body", -1, -0.8, 2, 1.8], ["rect", "body", -0.6, -1.2, 1.2, 0.5],
              ["rect", "#ffb347", -0.5, -0.6, 1, 0.25], ["rect", DARK, -0.5, 0.2, 1, 0.2]],
}

TOP = 62            # sân bắt đầu dưới thanh trên
BOTTOM = 560        # và hết ở trên thanh dưới
BIRTH = 40          # quái mới ra chưa làm đau ai trong bấy nhiêu khung
SAFE = 75           # trúng đòn xong thì bất tử bấy nhiêu khung
WAIT = 25           # màn mới hiện ra thì chờ một chút mới nhận phím, kẻo bấm nhầm
MAX_LEVEL = 3
MAX_MOBS = 24       # đông quá thì khó nhìn và chạy chậm
MAX_SHOTS = 30
MAX_GEMS = 30
MAX_ZONES = 24
MAX_EFFECTS = 24
KEYS = ["1", "2", "3", "space"]


# ---------- CÁC LOẠI VẬT TRONG GAME ----------

class Hero:
    def __init__(self, data):
        self.data = data
        self.x, self.y = WIDTH / 2, (TOP + BOTTOM) / 2
        self.size = 11
        self.max_hp = self.hp = data["hp"]
        self.speed, self.power = data["speed"], data["power"]
        self.magnet = 70
        self.wait = 0                   # còn mấy khung nữa mới đánh tiếp
        self.safe = 0                   # còn bất tử mấy khung
        self.shield = False
        self.shield_wait = 0
        self.level, self.xp = 1, 0
        self.skills = {}                # tên skill: cấp


class Mob:
    def __init__(self, kind, x, y, tough):
        self.kind, self.data = kind, MOBS[kind]
        self.x, self.y = x, y
        self.dir_x, self.dir_y = 0, 0   # hướng lao, dùng cho ma và trùm
        self.size = self.data["size"]
        self.max_hp = self.hp = self.data["hp"] * tough
        self.age = 0
        self.slow = self.stun = self.burn = 0   # còn bị chậm, đứng hình, cháy mấy khung
        self.steam_wait = 0
        self.flash = 0
        self.alive = True


class Shot:
    # arrow, orb, plasma là của em; spore là của quái
    def __init__(self, kind, x, y, dir_x, dir_y, speed, power):
        self.kind, self.power = kind, power
        self.x, self.y = x, y
        self.dir_x, self.dir_y, self.speed = dir_x, dir_y, speed
        self.alive = True


class Gem:
    def __init__(self, x, y, value):
        self.x, self.y, self.value = x, y, value
        self.alive = True


class Zone:
    # Thứ nằm trên đất: flame (than), trap (bẫy), hail (đá sắp rơi trúng quái), rock (đá sắp rơi trúng em)
    def __init__(self, kind, x, y, r, power, life):
        self.kind, self.r, self.power, self.life = kind, r, power, life
        self.x, self.y = x, y
        self.alive = True


class Effect:
    # Chỉ để nhìn: ring (vòng nở ra), bolt (tia sét từ x, y tới x2, y2), puff (khói)
    def __init__(self, kind, x, y, color, r, x2, y2):
        self.kind, self.color, self.r = kind, color, r
        self.x, self.y, self.x2, self.y2 = x, y, x2, y2
        self.life = 14
        self.alive = True


game = {"state": "hero", "clock": 0, "time": 0, "floor": 0, "wave": 0, "kills": 0}
held = {}           # phím nào đang bị giữ
fresh = {}          # phím nào vừa mới bấm ở khung này
hero = Hero(HEROES[0])
mobs = []
shots = []
gems = []
zones = []
effects = []
queue = []          # quái của đợt này còn chờ ra sân
cards = []          # 3 thẻ đang hiện
combos = []         # phối hợp đã mở
banners = []        # các dòng thông báo: [chữ, còn mấy khung]


# ---------- VIỆC NHỎ DÙNG NHIỀU LẦN ----------

def distance(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


def direction(a, b):
    # Mũi tên dài 1 chỉ từ a tới b. Đứng trùng nhau thì không chia cho 0 được, nên chỉ đại sang phải.
    far = distance(a, b)
    if far < 0.01:
        return 1, 0
    return (b.x - a.x) / far, (b.y - a.y) / far


def keep_inside(thing, edge):
    thing.x = max(edge, min(WIDTH - edge, thing.x))
    thing.y = max(TOP + edge, min(BOTTOM - edge, thing.y))


def remove_dead(things):
    # Đi trên bản sao things[:], vì xóa ngay trên danh sách đang đi thì sẽ bị bỏ sót.
    for thing in things[:]:
        if not thing.alive:
            things.remove(thing)


def add(things, thing, limit):
    if len(things) < limit:
        things.append(thing)


def add_effect(kind, x, y, color, r=0, x2=0, y2=0):
    add(effects, Effect(kind, x, y, color, r, x2, y2), MAX_EFFECTS)


def announce(text):
    banners.append([text, 130])


def level_of(name):
    return hero.skills.get(name, 0)


def value(name, column):
    # Số của skill ở cấp đang có. Danh sách đếm từ 0 nên cấp 1 nằm ở chỗ 0.
    return SKILLS[name][column][level_of(name) - 1]


def is_time(name):
    return level_of(name) > 0 and game["time"] % value(name, "every") == 0


def open_screen(state):
    game["state"] = state
    game["clock"] = 0


def read_keys():
    # Phím "mới bấm" = giờ đang bấm mà khung trước chưa bấm. Giữ phím từ màn trước thì không tính.
    for key in KEYS:
        down = key_pressed(key)
        fresh[key] = down and not held.get(key, False)
        held[key] = down


def row_top(i):
    return 190 + i * 122


def picked_row():
    # Bé chọn hàng nào trong 3 hàng: 0, 1, 2. Chưa chọn thì None.
    if game["clock"] < WAIT:
        return None
    for i in range(3):
        if fresh[str(i + 1)]:
            return i
        if clicked() and 40 <= mouse_x() <= 560 and row_top(i) <= mouse_y() <= row_top(i) + 110:
            return i
    return None


def wants_next():
    return game["clock"] >= WAIT * 2 and (fresh["space"] or clicked())


# ---------- NHÂN VẬT ----------

def move_hero():
    dx, dy = 0, 0
    if key_pressed("left"):
        dx = dx - 1
    if key_pressed("right"):
        dx = dx + 1
    if key_pressed("up"):
        dy = dy - 1
    if key_pressed("down"):
        dy = dy + 1
    step = hero.speed
    if dx != 0 and dy != 0:
        step = step * 0.7       # đi chéo thì bước ngắn lại, kẻo nhanh hơn đi thẳng
    hero.x = hero.x + dx * step
    hero.y = hero.y + dy * step
    keep_inside(hero, 24)
    hero.safe = max(0, hero.safe - 1)


def nearest_mob(thing, reach, skip):
    best = None
    for mob in mobs:
        far = distance(thing, mob) - mob.size
        if far < reach and mob not in skip and mob.age >= BIRTH and mob.hp > 0:
            best = mob
            reach = far         # từ giờ phải gần hơn con này mới được tính
    return best


def mobs_near(x, y, r):
    found = []
    for mob in mobs:
        if (mob.x - x) ** 2 + (mob.y - y) ** 2 < (r + mob.size) ** 2 and mob.age >= BIRTH:
            found.append(mob)
    return found


def attack():
    hero.wait = hero.wait - 1
    if hero.wait > 0:
        return
    target = nearest_mob(hero, hero.data["range"], [])
    if target is None:
        return
    hero.wait = hero.data["reload"]
    if level_of("spark_fast") > 0:
        hero.wait = hero.wait * value("spark_fast", "faster")
    if hero.data["attack"] == "slash":
        slash()
    else:
        dx, dy = direction(hero, target)
        add(shots, Shot(hero.data["attack"], hero.x, hero.y, dx, dy, 7, hero.power), MAX_SHOTS)


def slash():
    reach = hero.data["range"]
    add_effect("ring", hero.x, hero.y, "#ffffff", reach)
    first = True
    for mob in mobs_near(hero.x, hero.y, reach):
        hit(mob, hero.power, first)
        first = False       # sét chỉ nhảy từ con đầu tiên


def hit(mob, power, can_jump):
    # Đòn đánh thường: ngoài sát thương còn kèm các skill "Trúng đòn thì..."
    hurt(mob, power, "common")
    if level_of("fire_hit") > 0:
        mob.burn = 120
    if level_of("ice_hit") > 0:
        hurt(mob, value("ice_hit", "power"), "ice")
        mob.slow = max(mob.slow, value("ice_hit", "slow"))
    if level_of("spark_jump") > 0 and can_jump:
        spark_jump(mob)


def hurt_hero():
    if hero.safe > 0:
        return
    hero.safe = SAFE
    if hero.shield:
        hero.shield = False
        hero.shield_wait = value("ice_shield", "every")
        blast(hero.x, hero.y, 100, value("ice_shield", "power"), "ice", 120)
        return
    hero.hp = max(0, hero.hp - 1)
    play_sound("hit")


def xp_needed():
    return 4 + hero.level * 3


# ---------- SKILL ----------

def hurt(mob, power, branch):
    if mob.age < BIRTH:
        return
    if "ember" in combos and branch == "fire":
        power = power * 1.4
    if "chill" in combos and mob.slow > 0:
        power = power * 1.2
    if "conduct" in combos and branch == "spark" and mob.slow > 0:
        power = power * 1.5
        add_effect("puff", mob.x, mob.y, "#a0fff0")
    if "stun" in combos and branch == "spark":
        mob.stun = 20
    mob.hp = mob.hp - power
    mob.flash = 4
    if "steam" in combos and branch == "fire" and mob.slow > 0 and mob.steam_wait == 0:
        mob.steam_wait = 60     # nghỉ 1 giây, kẻo lửa cháy liên tục thì nổ hoài
        blast(mob.x, mob.y, 60, 5, "steam", 0)


def blast(x, y, r, power, branch, slow):
    # Nổ vòng tròn: con nào trong vòng cũng đau, và chậm đi "slow" khung.
    add_effect("ring", x, y, BRANCHES[branch]["color"], r)
    for mob in mobs_near(x, y, r):
        hurt(mob, power, branch)
        mob.slow = max(mob.slow, slow)


def strike(x, y, mob, power):
    add_effect("bolt", x, y, BRANCHES["spark"]["color"], 0, mob.x, mob.y)
    hurt(mob, power, "spark")


def spark_jump(mob):
    done = [mob]
    for i in range(value("spark_jump", "count")):
        target = nearest_mob(done[-1], 110, done)
        if target is None:
            return
        strike(done[-1].x, done[-1].y, target, value("spark_jump", "power"))
        done.append(target)


def ember_spots():
    # Các đốm lửa chia đều trên vòng tròn quanh em.
    spots = []
    if level_of("fire_orbit") > 0:
        count = value("fire_orbit", "count")
        for i in range(count):
            angle = game["time"] * 0.06 + i * 2 * pi / count
            spots.append([hero.x + cos(angle) * 62, hero.y + sin(angle) * 62])
    return spots


def use_skills():
    if game["time"] % 12 == 0:
        for spot in ember_spots():
            for mob in mobs_near(spot[0], spot[1], 14):
                hurt(mob, value("fire_orbit", "power"), "fire")
    if is_time("fire_trail"):
        add(zones, Zone("flame", hero.x, hero.y, 24, value("fire_trail", "power"), 150), MAX_ZONES)
    if is_time("ice_rain") and len(mobs) > 0:
        mob = mobs[random_int(0, len(mobs) - 1)]
        add(zones, Zone("hail", mob.x, mob.y, 45, value("ice_rain", "power"), 25), MAX_ZONES)
    if is_time("ice_ring"):
        blast(hero.x, hero.y, value("ice_ring", "radius"), value("ice_ring", "power"), "ice", 120)
    if level_of("ice_shield") > 0 and not hero.shield:
        hero.shield_wait = hero.shield_wait - 1
        if hero.shield_wait <= 0:
            hero.shield = True
    if is_time("spark_cloud"):
        mob = nearest_mob(hero, 250, [])
        if mob is not None:
            strike(hero.x, hero.y - 45, mob, value("spark_cloud", "power"))
    if is_time("spark_trap"):
        add(zones, Zone("trap", hero.x, hero.y, 60, value("spark_trap", "power"), 600), MAX_ZONES)
    if "plasma" in combos and game["time"] % 300 == 0:
        for i in range(8):
            angle = i * pi / 4
            add(shots, Shot("plasma", hero.x, hero.y, cos(angle), sin(angle), 5, 6), MAX_SHOTS)


def update_zone(zone):
    zone.life = zone.life - 1
    if zone.kind == "flame" and zone.life % 25 == 0:
        for mob in mobs_near(zone.x, zone.y, zone.r):
            hurt(mob, zone.power, "fire")
    if zone.kind == "trap" and zone.life % 4 == 0 and nearest_mob(zone, 22, []) is not None:
        blast(zone.x, zone.y, zone.r, zone.power, "spark", 0)
        zone.life = 0
    if zone.kind == "hail" and zone.life == 0:
        blast(zone.x, zone.y, zone.r, zone.power, "ice", 70)
    if zone.kind == "rock" and zone.life == 0:
        add_effect("ring", zone.x, zone.y, "#c0a080", zone.r)
        if distance(zone, hero) < zone.r:
            hurt_hero()
    zone.alive = zone.life > 0


# ---------- QUÁI VÀ TRÙM ----------

def spawn_mob(kind):
    # Ra ở mép sân. Trúng chỗ gần em quá thì đổi sang mép đối diện.
    mob = Mob(kind, random_int(30, WIDTH - 30), random_int(TOP + 30, BOTTOM - 30), WAVES[game["floor"]]["tough"])
    side = random_int(1, 4)
    if side == 1:
        mob.x = 30
    elif side == 2:
        mob.x = WIDTH - 30
    elif side == 3:
        mob.y = TOP + 30
    else:
        mob.y = BOTTOM - 30
    if distance(mob, hero) < 170:
        mob.x = WIDTH - mob.x
        mob.y = TOP + BOTTOM - mob.y
    if "boss" in mob.data:          # máu trùm ghi sẵn trong bảng, không nhân thêm
        mob.max_hp = mob.hp = mob.data["hp"]
    add(mobs, mob, MAX_MOBS)


def walk(mob, dir_x, dir_y, speed):
    if mob.slow > 0:
        speed = speed * 0.6
        if "boss" in mob.data:
            speed = speed * 1.4     # trùm khỏe nên chỉ chậm một chút
    mob.x = mob.x + dir_x * speed
    mob.y = mob.y + dir_y * speed


def update_mob(mob):
    mob.age = mob.age + 1
    mob.slow = max(0, mob.slow - 1)
    mob.flash = max(0, mob.flash - 1)
    mob.steam_wait = max(0, mob.steam_wait - 1)
    if mob.burn > 0:
        mob.burn = mob.burn - 1
        if mob.burn % 30 == 0:
            hurt(mob, value("fire_hit", "power"), "fire")
    if mob.age < BIRTH:
        return
    if mob.stun > 0:
        mob.stun = mob.stun - 1
        if "boss" not in mob.data:      # trùm không đứng hình, kẻo em đánh trùm mà trùm không làm gì được
            return
    move_mob(mob)
    keep_inside(mob, mob.size)
    if distance(mob, hero) < mob.size + hero.size - 4:
        hurt_hero()


def move_mob(mob):
    move = mob.data["move"]
    dx, dy = direction(mob, hero)
    speed = mob.data["speed"]
    if move == "chase":
        walk(mob, dx, dy, speed)
    elif move == "zigzag":
        side = 1
        if mob.age // 30 % 2 == 0:
            side = -1
        walk(mob, dx - dy * side, dy + dx * side, speed * 0.75)
    elif move == "shoot":
        if distance(mob, hero) > 170:
            walk(mob, dx, dy, speed)
        if mob.age % 150 == 0:
            add(shots, Shot("spore", mob.x, mob.y, dx, dy, 2.6, 1), MAX_SHOTS)
    elif move == "dash":
        move_dash(mob, dx, dy, speed)
    elif move == "hop":
        move_hop(mob, dx, dy, speed)
    elif move == "ring":
        move_ring(mob, dx, dy, speed)
    elif move == "charge":
        move_charge(mob, dx, dy, speed)


def move_dash(mob, dx, dy, speed):
    # Ma: đi chậm, dừng lại ngắm, rồi lao thẳng.
    beat = mob.age % 150
    if beat < 90:
        walk(mob, dx, dy, speed)
    elif beat == 90:
        mob.dir_x = dx
        mob.dir_y = dy
    elif beat > 115:
        walk(mob, mob.dir_x, mob.dir_y, speed * 4.5)


def move_hop(mob, dx, dy, speed):
    # Vua Nhớt: ngồi im lấy đà, nhảy tới chỗ em, đáp xuống thì đẻ 2 nhớt con.
    beat = mob.age % 120
    if beat == 70:
        mob.dir_x = dx
        mob.dir_y = dy
    elif beat > 70:
        walk(mob, mob.dir_x, mob.dir_y, speed)
    if beat == 119:
        add(zones, Zone("rock", mob.x, mob.y, 85, 1, 1), MAX_ZONES)
        for shift in [-30, 30]:
            add(mobs, Mob("slime", mob.x + shift, mob.y, 1), MAX_MOBS)
            keep_inside(mobs[-1], 20)


def move_ring(mob, dx, dy, speed):
    # Nấm Chúa: đi chậm, cứ một lúc lại bắn một vòng bào tử. Mỗi vòng xoay lệch để khe hở đổi chỗ.
    walk(mob, dx, dy, speed)
    if mob.age % 110 == 0:
        for i in range(10):
            angle = i * 2 * pi / 10 + mob.age
            add(shots, Shot("spore", mob.x, mob.y, cos(angle), sin(angle), 2.4, 1), MAX_SHOTS)


def move_charge(mob, dx, dy, speed):
    # Vua Đá: đi bộ, ngắm (hiện vạch đỏ), húc thẳng, rồi đá rơi quanh em. Còn nửa máu thì đá rơi nhiều hơn.
    beat = mob.age % 190
    if beat < 70:
        walk(mob, dx, dy, speed)
    elif beat < 85:
        mob.dir_x = dx
        mob.dir_y = dy
    elif 110 < beat < 150:
        walk(mob, mob.dir_x, mob.dir_y, 8)
    elif beat == 150:
        rocks = 3
        if mob.hp < mob.max_hp / 2:
            rocks = 5
        for i in range(rocks):
            rock = Zone("rock", hero.x + random_int(-90, 90), hero.y + random_int(-90, 90), 42, 1, 55)
            keep_inside(rock, 20)
            add(zones, rock, MAX_ZONES)


def bury_dead():
    for mob in mobs[:]:
        if mob.hp > 0 or not mob.alive:
            continue
        mob.alive = False
        game["kills"] = game["kills"] + 1
        add_effect("puff", mob.x, mob.y, mob.data["color"])
        drop_gem(mob.x, mob.y, mob.data["xp"])
        if level_of("fire_boom") > 0:
            blast(mob.x, mob.y, value("fire_boom", "radius"), value("fire_boom", "power"), "fire", 0)
        if "boss" in mob.data:
            finish_floor()
    remove_dead(mobs)


def drop_gem(x, y, amount):
    if len(gems) < MAX_GEMS:
        gems.append(Gem(x, y, amount))
    else:
        gems[0].value = gems[0].value + amount      # sân đầy ngọc: gộp vào viên cũ, em không mất kinh nghiệm


def update_gem(gem):
    far = distance(gem, hero)
    if far < hero.magnet:
        dx, dy = direction(gem, hero)
        gem.x = gem.x + dx * 6
        gem.y = gem.y + dy * 6
    if far < 18:
        gem.alive = False
        hero.xp = hero.xp + gem.value
        play_sound("point")


def update_shot(shot):
    shot.x = shot.x + shot.dir_x * shot.speed
    shot.y = shot.y + shot.dir_y * shot.speed
    if shot.x < 4 or shot.x > WIDTH - 4 or shot.y < TOP + 4 or shot.y > BOTTOM - 4:
        shot.alive = False
        keep_inside(shot, 4)
    elif shot.kind == "spore":
        if distance(shot, hero) < hero.size + 5:
            shot.alive = False
            hurt_hero()
    else:
        mob = nearest_mob(shot, 7, [])
        if mob is not None:
            shot.alive = False
            hit_with_shot(shot, mob)


def hit_with_shot(shot, mob):
    if shot.kind == "plasma":
        hurt(mob, shot.power, "fire")
        hurt(mob, shot.power, "spark")
        return
    hit(mob, shot.power, True)
    if shot.kind == "orb":          # đạn phép nổ lan: các quái đứng gần cũng bị đau
        add_effect("ring", shot.x, shot.y, hero.data["color"], 50)
        for other in mobs_near(shot.x, shot.y, 50):
            if other is not mob:
                hit(other, shot.power * 0.75, False)


# ---------- ĐỢT, ẢI, LÊN CẤP ----------

def start_game(number):
    global hero
    hero = Hero(HEROES[number])
    combos.clear()
    banners.clear()
    game["time"] = 0
    game["kills"] = 0
    play_music("adventure")
    start_floor(0)


def start_floor(number):
    for things in [mobs, shots, gems, zones, effects, queue]:
        things.clear()
    game["floor"] = number
    game["boss_out"] = False
    game["floor_done"] = False
    hero.x = WIDTH / 2
    hero.y = (TOP + BOTTOM) / 2
    hero.safe = SAFE
    announce("Ải " + str(number + 1) + ": " + WAVES[number]["name"])
    start_wave(0)
    open_screen("play")


def start_wave(number):
    game["wave"] = number
    wave = WAVES[game["floor"]]["waves"][number]
    for kind in wave:
        for i in range(wave[kind]):
            queue.append(kind)


def run_waves():
    floor = WAVES[game["floor"]]
    if len(queue) > 0:
        if game["time"] % floor["gap"] == 0 and len(mobs) < MAX_MOBS:
            spawn_mob(queue.pop(random_int(0, len(queue) - 1)))
    elif len(mobs) == 0 and not game["boss_out"]:
        if game["wave"] + 1 < len(floor["waves"]):
            start_wave(game["wave"] + 1)
        else:
            game["boss_out"] = True
            spawn_mob(floor["boss"])
            announce("Trùm: " + MOBS[floor["boss"]]["boss"] + "!")


def finish_floor():
    # Trùm thua thì quái con tan hết, ngọc tự bay về em.
    game["floor_done"] = True
    for mob in mobs:
        if mob.alive:
            mob.alive = False
            add_effect("puff", mob.x, mob.y, mob.data["color"])
    for gem in gems:
        hero.xp = hero.xp + gem.value
    for things in [gems, shots, zones]:     # đạn và đá rơi còn sót cũng mất, kẻo thắng rồi mà vẫn bị trúng
        things.clear()
    hero.hp = max(1, hero.hp)       # trùm và em ngã cùng lúc: tính là em thắng


def check_end():
    if hero.hp <= 0:
        open_screen("lose")
        stop_music()
        play_sound("fall")
    elif hero.xp >= xp_needed():
        level_up()
    elif game["floor_done"]:
        if game["floor"] + 1 < len(WAVES):
            open_screen("next")
        else:
            open_screen("win")
            stop_music()
        play_sound("win")


def level_up():
    # Dư kinh nghiệm thì giữ lại. Đủ lên thêm cấp nữa thì khung sau lại vào đây.
    hero.xp = hero.xp - xp_needed()
    hero.level = hero.level + 1
    deal_cards()
    if len(cards) == 0:             # đã có hết mọi thẻ: hồi 1 tim thay cho thẻ
        hero.hp = min(hero.max_hp, hero.hp + 1)
    else:
        open_screen("cards")
        play_sound("win")


def deal_cards():
    cards.clear()
    pool = []
    for name in SKILLS:
        if level_of(name) < MAX_LEVEL:
            pool.append(name)
    while len(pool) > 0 and len(cards) < 3:
        cards.append(pool.pop(random_int(0, len(pool) - 1)))    # rút ra khỏi pool nên 3 thẻ không trùng nhau


def take_card(name):
    hero.skills[name] = level_of(name) + 1
    if name == "heart":
        hero.max_hp = hero.max_hp + 1
        hero.hp = min(hero.max_hp, hero.hp + 2)
    if name == "boots":
        hero.speed = hero.speed + 0.35
    if name == "magnet":
        hero.magnet = hero.magnet + 60
    if name == "muscle":
        hero.power = hero.power + 1.5
    for combo in COMBOS:
        if combo not in combos and is_open(combo, hero.skills):
            combos.append(combo)
            announce("Phối hợp " + COMBOS[combo]["name"] + ": " + COMBOS[combo]["text"])


def is_open(combo, skills):
    needs = COMBOS[combo]["needs"]
    for branch in needs:
        count = 0
        for name in skills:
            if SKILLS[name]["branch"] == branch:
                count = count + 1
        if count < needs[branch]:
            return False
    return True


def combo_from(card):
    # Chọn thẻ này thì mở phối hợp nào? Thử trên một bản sao bộ skill.
    trial = dict(hero.skills)
    trial[card] = 1
    for combo in COMBOS:
        if combo not in combos and is_open(combo, trial):
            return COMBOS[combo]["name"]
    return ""


# ---------- MỖI KHUNG HÌNH ----------

def update():
    read_keys()
    game["clock"] = game["clock"] + 1
    state = game["state"]
    if state == "hero":
        row = picked_row()
        if row is not None:
            start_game(row)
    elif state == "play":
        update_play()
    elif state == "cards":
        row = picked_row()
        if row is not None and row < len(cards):
            take_card(cards[row])
            play_sound("click")
            open_screen("play")
    elif state == "next":
        if wants_next():
            hero.hp = min(hero.max_hp, hero.hp + 2)
            start_floor(game["floor"] + 1)
    elif wants_next():              # win hoặc lose
        open_screen("hero")


def update_play():
    game["time"] = game["time"] + 1
    move_hero()
    run_waves()
    attack()
    use_skills()
    for mob in mobs[:]:
        update_mob(mob)
    push_apart()
    for zone in zones[:]:
        update_zone(zone)
    for shot in shots[:]:
        update_shot(shot)
    for gem in gems:
        update_gem(gem)
    for effect in effects:
        effect.life = effect.life - 1
        effect.alive = effect.life > 0
    bury_dead()
    for things in [shots, zones, gems, effects]:
        remove_dead(things)
    if len(banners) > 0:
        banners[0][1] = banners[0][1] - 1
        if banners[0][1] <= 0:
            banners.pop(0)
    check_end()


def push_apart():
    # Hai quái đứng chồng lên nhau thì con đứng trước nhích ra, để em đếm được có mấy con.
    for a in mobs:
        for b in mobs:
            if a is not b and abs(a.x - b.x) < 14 and abs(a.y - b.y) < 14 and "boss" not in a.data:
                dx, dy = direction(b, a)
                a.x = a.x + dx * 0.6
                a.y = a.y + dy * 0.6
                keep_inside(a, a.size)


# ---------- VẼ: mỗi thứ một hàm, sau này đổi thành draw_image ----------

def draw_parts(name, x, y, s, color):
    # Vẽ một hình trong bảng PARTS, phóng to s lần.
    for part in PARTS[name]:
        n = []
        for number in part[2:]:
            n.append(number * s)
        paint = part[1]
        if paint == "body":
            paint = color
        if part[0] == "circle":
            draw_circle(x + n[0], y + n[1], n[2], paint)
        elif part[0] == "rect":
            draw_rect(x + n[0], y + n[1], n[2], n[3], paint)
        else:
            draw_triangle(x + n[0], y + n[1], x + n[2], y + n[3], x + n[4], y + n[5], paint)


def draw_hero(number, x, y, big):
    draw_parts(HEROES[number]["attack"], x, y, big, HEROES[number]["color"])


def draw_mob(mob):
    if mob.age < BIRTH:
        draw_circle(mob.x, mob.y, 4 + mob.age / 4, "#ffffff44")      # bóng mờ báo trước: sắp có quái
        return
    color = mob.data["color"]
    if mob.flash > 0:
        color = "#ffffff"
    if mob.slow > 0:
        draw_circle(mob.x, mob.y, mob.size + 5, "#7fd8ff66")
    draw_parts(mob.data["shape"], mob.x, mob.y, mob.size, color)
    if mob.stun > 0:
        draw_rect(mob.x - 2, mob.y - mob.size - 12, 4, 10, "#ffe14d")
    elif mob.burn > 0:
        draw_triangle(mob.x - 5, mob.y - mob.size, mob.x + 5, mob.y - mob.size, mob.x, mob.y - mob.size - 12, "#ff8a3c")
    if "boss" in mob.data:
        draw_boss_extra(mob)


def draw_boss_extra(mob):
    top = mob.y - mob.size * 1.1
    for shift in [-16, 0, 16]:
        draw_triangle(mob.x + shift - 8, top, mob.x + shift + 8, top, mob.x + shift, top - 16, "#ffd75e")
    beat = mob.age % 190
    if mob.kind == "boss3" and 70 < beat < 111:         # vạch đỏ: trùm sắp húc theo hướng này, né đi
        draw_line(mob.x, mob.y, mob.x + mob.dir_x * 260, mob.y + mob.dir_y * 260, "#ff5050aa", 6)
    draw_rect(150, 78, 300, 10, "#1b1b28")
    draw_rect(152, 80, max(0, 296 * mob.hp / mob.max_hp), 6, "#ff6b6b")


def draw_shot(shot):
    if shot.kind == "arrow":
        draw_line(shot.x - shot.dir_x * 14, shot.y - shot.dir_y * 14, shot.x, shot.y, "#f3e2b3", 3)
    elif shot.kind == "orb":
        draw_circle(shot.x, shot.y, 7, "#c9a0ff")
    elif shot.kind == "plasma":
        draw_circle(shot.x, shot.y, 6, "#ff7ad9")
    else:
        draw_circle(shot.x, shot.y, 7, "#ff4f6d")
        draw_circle(shot.x, shot.y, 3, "#ffffff")


def draw_gem(gem):
    draw_triangle(gem.x - 5, gem.y, gem.x + 5, gem.y, gem.x, gem.y - 8, "#5ff0c8")
    draw_triangle(gem.x - 5, gem.y, gem.x + 5, gem.y, gem.x, gem.y + 8, "#2fae9a")


def draw_zone(zone):
    if zone.kind == "flame":
        draw_circle(zone.x, zone.y, 8 + zone.life / 12, "#ff7a2c77")
    elif zone.kind == "trap":
        draw_circle(zone.x, zone.y, 9, "#ffe14d66")
        draw_line(zone.x - 4, zone.y - 6, zone.x + 4, zone.y + 6, "#ffe14d", 3)
    elif zone.kind == "hail":
        draw_circle(zone.x, zone.y, zone.r, "#7fd8ff33")
        draw_circle(zone.x, zone.y - zone.life * 4, 11, "#d8f4ff")
    else:
        draw_circle(zone.x, zone.y, zone.r, "#ff505055")
        draw_circle(zone.x, zone.y, max(0, zone.r - zone.life * 0.7), "#ff505066")


def draw_effect(effect):
    if effect.kind == "ring":
        draw_circle(effect.x, effect.y, effect.r * (1 - effect.life / 20), effect.color + "44")
    elif effect.kind == "bolt":
        mid_x = (effect.x + effect.x2) / 2 + effect.life - 7
        mid_y = (effect.y + effect.y2) / 2 - 8
        draw_line(effect.x, effect.y, mid_x, mid_y, effect.color, 3)
        draw_line(mid_x, mid_y, effect.x2, effect.y2, effect.color, 3)
    else:
        draw_circle(effect.x, effect.y, effect.life, effect.color + "88")


def draw_hero_in_play():
    if level_of("spark_cloud") > 0:
        draw_circle(hero.x - 8, hero.y - 46, 9, "#8d93a8")
        draw_circle(hero.x + 8, hero.y - 46, 11, "#a9afc4")
    for spot in ember_spots():
        draw_circle(spot[0], spot[1], 9, "#ff8a3c")
        draw_circle(spot[0], spot[1], 4, "#ffe9a8")
    if hero.shield:
        draw_circle(hero.x, hero.y - 4, 24, "#7fd8ff66")
    if hero.safe // 5 % 2 == 0:         # nhấp nháy khi đang bất tử
        draw_hero(HEROES.index(hero.data), hero.x, hero.y, 1)


def draw_heart(x, y, color):
    draw_circle(x - 4, y, 5, color)
    draw_circle(x + 4, y, 5, color)
    draw_triangle(x - 9, y + 2, x + 9, y + 2, x, y + 11, color)


def draw_skill_icon(name, x, y, level):
    branch = BRANCHES[SKILLS[name]["branch"]]
    draw_rect(x, y, 30, 30, branch["color"])
    draw_rect(x + 2, y + 2, 26, 26, branch["dark"])
    words = SKILLS[name]["name"].split()
    draw_text(words[0][0] + words[1][0], x + 15, y + 12, 20, branch["color"])
    draw_rect(x + 3, y + 23, 8 * level, 4, "#ffffff")


def draw_hud():
    draw_rect(0, 0, WIDTH, TOP, "#181824")
    draw_rect(0, BOTTOM, WIDTH, HEIGHT - BOTTOM, "#181824")
    where = "Ải " + str(game["floor"] + 1)
    if game["boss_out"]:
        where = where + " - Trùm"
    else:
        where = where + " - Đợt " + str(game["wave"] + 1) + "/" + str(len(WAVES[game["floor"]]["waves"]))
    draw_text(where, 90, 24, 26)
    for i in range(hero.max_hp):
        color = "#ff5f7a"
        if i >= hero.hp:
            color = "#454558"
        draw_heart(205 + i * 24, 22, color)
    draw_text("Cấp " + str(hero.level), 545, 24, 26, "#5ff0c8")
    draw_rect(0, TOP - 12, WIDTH, 10, "#33334a")
    draw_rect(0, TOP - 12, WIDTH * min(1, hero.xp / xp_needed()), 10, "#2fc9a8")
    x = 6
    for name in hero.skills:
        draw_skill_icon(name, x, BOTTOM + 5, hero.skills[name])
        x = x + 36


def draw_play():
    clear(WAVES[game["floor"]]["color"])
    for zone in zones:
        draw_zone(zone)
    for gem in gems:
        draw_gem(gem)
    for mob in mobs:
        draw_mob(mob)
    draw_hero_in_play()
    for effect in effects:
        draw_effect(effect)
    for shot in shots:
        draw_shot(shot)
    draw_hud()
    if len(banners) > 0 and game["state"] == "play":
        draw_rect(20, 98, 560, 40, "#10101888")
        draw_text(banners[0][0], 300, 118, 24, "#ffe9a8")


def draw_row(i, color, dark):
    draw_rect(40, row_top(i), 520, 110, color)
    draw_rect(43, row_top(i) + 3, 514, 104, dark)
    draw_text(str(i + 1), 65, row_top(i) + 22, 28, color)


def draw_hero_choice():
    clear("#1d1b2c")
    draw_text("HẦM NGỌC", 300, 70, 64, "#5ff0c8")
    draw_text("Chọn nhân vật: phím 1, 2, 3 hoặc bấm vào", 300, 140, 26)
    for i in range(3):
        data = HEROES[i]
        draw_row(i, data["color"], "#2a2838")
        draw_hero(i, 115, row_top(i) + 65, 2)
        draw_text(data["name"], 340, row_top(i) + 36, 36, data["color"])
        draw_text(data["text"], 340, row_top(i) + 76, 24)


def draw_cards():
    draw_rect(20, 80, 560, 475, "#101018ee")
    draw_text("Lên cấp " + str(hero.level) + "!", 300, 112, 44, "#5ff0c8")
    draw_text("Chọn 1 thẻ: phím 1, 2, 3 hoặc bấm vào", 300, 155, 24)
    for i in range(len(cards)):
        draw_card(i, cards[i])


def draw_card(i, name):
    branch = BRANCHES[SKILLS[name]["branch"]]
    level = level_of(name) + 1
    y = row_top(i)
    draw_row(i, branch["color"], branch["dark"])
    draw_skill_icon(name, 100, y + 40, level)
    draw_text(SKILLS[name]["name"] + " - " + branch["name"] + " cấp " + str(level), 345, y + 24, 30, branch["color"])
    draw_text(SKILLS[name]["text"][level - 1], 345, y + 58, 24)
    unlock = combo_from(name)
    if unlock != "":
        draw_text("Mở phối hợp: " + unlock, 345, y + 90, 22, "#ff9ad9")


def draw_message(title, line, color, after):
    draw_rect(60, 200, 480, 190, "#101018ee")
    draw_text(title, 300, 250, 56, color)
    draw_text(line, 300, 305, 26)
    draw_text("Bấm Space hoặc chạm để " + after, 300, 355, 24, "#b9c0d8")


def draw():
    state = game["state"]
    if state == "hero":
        draw_hero_choice()
        return
    draw_play()
    beaten = "Hạ " + str(game["kills"]) + " quái, cấp " + str(hero.level)
    if state == "cards":
        draw_cards()
    elif state == "next":
        draw_message("Qua ải " + str(game["floor"] + 1) + "!", "Em được hồi 2 tim", "#5ff0c8", "đi tiếp")
    elif state == "win":
        draw_message("Em thắng rồi!", beaten, "#ffe14d", "chơi lại")
    elif state == "lose":
        draw_message("Thua mất rồi!", beaten, "#ff8a8a", "chơi lại")
