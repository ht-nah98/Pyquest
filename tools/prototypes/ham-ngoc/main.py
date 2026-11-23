# Hầm Ngọc — bản chơi thử. Đi bằng mũi tên (hoặc chạm vào sân), nhân vật tự đánh, nhặt ngọc, lên cấp thì chọn 1 trong 3 thẻ.
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
}

# "faces": trong ảnh gốc, nhân vật (quái) quay mặt về bên nào. Đi về bên kia thì lật ảnh.
HEROES = [
    {"name": "Kiếm sĩ", "image": "hero-knight", "faces": "left", "attack": "slash", "hp": 7, "speed": 2.6, "power": 4,
     "reload": 42, "range": 84, "color": "#6fa8ff", "text": "7 tim. Chém cả vòng quanh mình"},
    {"name": "Pháp sư", "image": "hero-mage", "faces": "left", "attack": "orb", "hp": 5, "speed": 2.6, "power": 4,
     "reload": 43, "range": 230, "color": "#c79bff", "text": "5 tim. Đạn phép nổ lan"},
    {"name": "Cung thủ", "image": "hero-archer", "faces": "right", "attack": "arrow", "hp": 6, "speed": 2.9, "power": 4,
     "reload": 45, "range": 235, "color": "#7fd87a", "text": "6 tim. Chạy nhanh, tên bay xa"},
]

# "size": chạm gần bấy nhiêu thì trúng. "scale": ảnh 16 điểm phóng to mấy lần.
MOBS = {
    "slime": {"image": "mob-slime", "faces": "left", "scale": 2, "move": "chase", "hp": 8, "speed": 1.35, "size": 13,
              "xp": 1},
    "bat": {"image": "mob-bat", "faces": "left", "scale": 2, "move": "zigzag", "hp": 5, "speed": 2.1, "size": 11, "xp": 1},
    "mushroom": {"image": "mob-mushroom", "faces": "left", "scale": 2, "move": "shoot", "hp": 11, "speed": 1, "size": 14,
                 "xp": 2},
    "ghost": {"image": "mob-ghost", "faces": "left", "scale": 2, "move": "dash", "hp": 12, "speed": 1, "size": 14, "xp": 2},
    "golem": {"image": "mob-golem", "faces": "left", "scale": 3, "move": "chase", "hp": 32, "speed": 0.8, "size": 19,
              "xp": 3},
    "boss1": {"image": "boss-1", "faces": "left", "scale": 5, "move": "hop", "hp": 140, "speed": 4.2, "size": 34, "xp": 8,
              "boss": "Rồng Nhớt"},
    "boss2": {"image": "boss-2", "faces": "left", "scale": 5, "move": "ring", "hp": 230, "speed": 0.8, "size": 36, "xp": 8,
              "boss": "Người Tuyết"},
    "boss3": {"image": "boss-3", "faces": "left", "scale": 6, "move": "charge", "hp": 850, "speed": 1.3, "size": 38,
              "xp": 8, "boss": "Vua Dung Nham"},
}

# Mỗi đợt ghi: quái nào, mấy con. "gap": mấy khung thì ra một con. "tough": máu quái nhân lên bấy nhiêu.
WAVES = [
    {"name": "Đồng Rêu", "color": "#6f8a68", "spot": "#66815f", "wall": "#3c4f42", "tough": 0.9, "gap": 42, "boss": "boss1",
     "waves": [{"slime": 12}, {"slime": 12, "bat": 5}, {"slime": 11, "bat": 6, "mushroom": 3}]},
    {"name": "Rừng Sương", "color": "#8a7f93", "spot": "#81768b", "wall": "#4a4258", "tough": 1.1, "gap": 36, "boss": "boss2",
     "waves": [{"bat": 18, "mushroom": 8}, {"slime": 16, "ghost": 10}, {"mushroom": 10, "ghost": 10, "bat": 10}]},
    {"name": "Hang Đá", "color": "#94806a", "spot": "#8a7661", "wall": "#4d4036", "tough": 2.9, "gap": 23, "boss": "boss3",
     "waves": [{"golem": 7, "bat": 18}, {"ghost": 18, "mushroom": 9}, {"golem": 11, "ghost": 10, "bat": 14}]},
]

# Mỗi danh sách có 3 số: cấp 1, cấp 2, cấp 3. "every": mấy khung thì dùng một lần.
SKILLS = {
    "fire_orbit": {"name": "Đốm Lửa", "branch": "fire", "icon": "skill-fire-2", "count": [1, 2, 3], "power": [5, 5, 6],
                   "text": ["1 đốm lửa bay quanh em", "2 đốm lửa bay quanh em", "3 đốm lửa, nóng hơn"]},
    "fire_trail": {"name": "Vệt Than", "branch": "fire", "icon": "skill-fire-3", "every": [24, 20, 16], "power": [2, 3, 4],
                   "text": ["Em đi tới đâu, than cháy tới đó", "Than nóng hơn, dày hơn", "Than nóng nhất, dày nhất"]},
    "fire_hit": {"name": "Đòn Cháy", "branch": "fire", "icon": "skill-fire-1", "power": [1.5, 3, 4.5],
                 "text": ["Trúng đòn thì quái bị cháy", "Cháy đau gấp 2", "Cháy đau gấp 3"]},
    "fire_boom": {"name": "Nổ Tàn Tro", "branch": "fire", "icon": "skill-fire-4", "radius": [48, 60, 72],
                  "power": [4, 6, 8],
                  "text": ["Quái thua thì nổ, quái gần bị đau", "Nổ to hơn", "Nổ rất to"]},
    "ice_rain": {"name": "Mưa Đá", "branch": "ice", "icon": "skill-ice-1", "every": [150, 115, 85], "power": [7, 9, 11],
                 "text": ["Cục đá rơi trúng quái, làm chậm", "Đá rơi nhanh hơn, đau hơn", "Đá rơi liên tục"]},
    "ice_ring": {"name": "Vòng Sương", "branch": "ice", "icon": "skill-ice-4", "every": [240, 200, 165],
                 "radius": [95, 110, 125], "power": [5, 6, 8],
                 "text": ["Vòng sương quanh em làm chậm quái", "Vòng rộng hơn, nhiều hơn", "Vòng rất rộng"]},
    "ice_shield": {"name": "Áo Băng", "branch": "ice", "icon": "skill-ice-3", "every": [1800, 1560, 1320],
                   "power": [3, 6, 9],
                   "text": ["Đỡ 1 đòn, 30 giây có lại", "26 giây có lại, vỡ ra đau hơn", "22 giây có lại, vỡ ra rất đau"]},
    "ice_hit": {"name": "Đòn Buốt", "branch": "ice", "icon": "skill-ice-2", "slow": [60, 90, 120], "power": [0.5, 1, 1.5],
                "text": ["Trúng đòn thì quái chậm 1 giây", "Chậm lâu hơn, đau hơn", "Chậm 2 giây, đau hơn nữa"]},
    "spark_jump": {"name": "Sét Nhảy", "branch": "spark", "icon": "skill-spark-2", "count": [2, 3, 4], "power": [3, 4, 5],
                   "text": ["Đòn đánh nhảy sang 2 quái nữa", "Nhảy sang 3 quái", "Nhảy sang 4 quái"]},
    "spark_cloud": {"name": "Mây Giông", "branch": "spark", "icon": "skill-spark-3", "every": [80, 60, 45],
                    "power": [6, 7, 8],
                    "text": ["Mây đi theo em, đánh sét xuống quái", "Sét nhanh hơn", "Sét rất nhanh, rất đau"]},
    "spark_trap": {"name": "Bẫy Điện", "branch": "spark", "icon": "skill-spark-4", "every": [180, 140, 100],
                   "power": [12, 16, 20],
                   "text": ["Thả bẫy, quái giẫm là nổ điện", "Thả bẫy nhanh hơn", "Nhiều bẫy, rất đau"]},
    "spark_fast": {"name": "Tay Chớp", "branch": "spark", "icon": "skill-spark-1", "faster": [0.75, 0.6, 0.45],
                   "text": ["Đánh nhanh hơn một chút", "Đánh nhanh hơn nữa", "Đánh nhanh như chớp"]},
    "heart": {"name": "Tim To", "branch": "common", "icon": "skill-common-1", "text": ["Thêm 1 tim, hồi 2 tim"] * 3},
    "boots": {"name": "Giày Gió", "branch": "common", "icon": "skill-common-2", "text": ["Chạy nhanh, trúng đòn bất tử lâu hơn"] * 3},
    "magnet": {"name": "Nam Châm", "branch": "common", "icon": "skill-common-3", "text": ["Hút ngọc từ xa, ngọc thêm kinh nghiệm"] * 3},
    "muscle": {"name": "Đòn Mạnh", "branch": "common", "icon": "skill-common-4", "text": ["Đòn đánh thường đau hơn nhiều"] * 3},
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

# Hiệu ứng: ảnh "fx-..." có mấy khung, rộng bao nhiêu, mỗi khung ảnh giữ mấy khung hình.
# "foot": hàng điểm ảnh nằm đúng chỗ (x, y). Ở giữa ảnh, hoặc ở chân với thứ mọc lên từ đất.
FX = {
    "hit": {"frames": 9, "width": 48, "foot": 24, "hold": 3},
    "slash": {"frames": 8, "width": 48, "foot": 24, "hold": 3},
    "spark": {"frames": 9, "width": 48, "foot": 24, "hold": 3},
    "explosion": {"frames": 8, "width": 48, "foot": 24, "hold": 4},
    "poof": {"frames": 9, "width": 56, "foot": 32, "hold": 3},
    "pickup": {"frames": 9, "width": 48, "foot": 24, "hold": 3},
    "fire": {"frames": 9, "width": 48, "foot": 40, "hold": 4},
    "ice": {"frames": 10, "width": 56, "foot": 44, "hold": 4},
    "levelup": {"frames": 10, "width": 56, "foot": 54, "hold": 4},
    "heal": {"frames": 8, "width": 48, "foot": 42, "hold": 4},
}

# Đồ trang trí: [ảnh, x, y]. Và mấy mảng nền đậm: [x, y, rộng, cao].
DECO = [["deco-torch", 80, 58], ["deco-torch", 490, 58], ["deco-misc", 8, 72], ["deco-misc", 560, 72],
        ["deco-barrel", 6, 494], ["deco-crate", 560, 494]]
SPOTS = [[70, 130, 90, 50], [250, 180, 60, 34], [430, 120, 80, 60], [150, 290, 110, 44], [370, 300, 120, 60],
         [60, 410, 80, 50], [280, 430, 70, 40], [470, 440, 70, 44]]

TOP = 62            # sân bắt đầu dưới thanh trên
BOTTOM = 536        # và hết ở trên thanh dưới
BIRTH = 40          # quái mới ra chưa làm đau ai trong bấy nhiêu khung
SAFE = 75           # trúng đòn xong thì bất tử bấy nhiêu khung
WAIT = 25           # màn mới hiện ra thì chờ một chút mới nhận phím, kẻo bấm nhầm
MAX_LEVEL = 3
MAX_MOBS = 24       # đông quá thì khó nhìn và chạy chậm
MAX_SHOTS = 30
MAX_GEMS = 30
MAX_ZONES = 24
MAX_EFFECTS = 20
KEYS = ["1", "2", "3", "space"]


# ---------- CÁC LOẠI VẬT TRONG GAME ----------

class Hero:
    def __init__(self, data):
        self.data = data
        self.x, self.y = WIDTH / 2, (TOP + BOTTOM) / 2
        self.target = None              # chỗ em chạm để đi tới: [x, y]
        self.moving = False
        self.look = "right"
        self.size = 11
        self.max_hp = self.hp = data["hp"]
        self.speed, self.power = data["speed"], data["power"]
        self.magnet = 70
        self.gem_bonus = 1              # mỗi viên ngọc được nhân lên bấy nhiêu
        self.safe_time = SAFE           # trúng đòn xong thì bất tử bấy nhiêu khung
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
        self.look = "left"
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
    # Chỉ để nhìn: ảnh trong bảng FX, hoặc ring (vòng nở ra), bolt (tia sét từ x, y tới x2, y2)
    def __init__(self, kind, x, y, scale, color, x2, y2):
        self.kind, self.scale, self.color = kind, scale, color
        self.x, self.y, self.x2, self.y2 = x, y, x2, y2
        self.age = 0
        self.life = 14
        if kind in FX:
            self.life = FX[kind]["frames"] * FX[kind]["hold"]
        self.alive = True


game = {"state": "hero", "clock": 0, "time": 0, "floor": 0, "wave": 0, "kills": 0, "last_gem": 0}
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
play_music("calm")


# ---------- VIỆC NHỎ DÙNG NHIỀU LẦN ----------

def distance(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


def direction(a, b):
    # Mũi tên dài 1 chỉ từ a tới b, và khoảng cách. Đứng trùng nhau thì không chia cho 0 được, nên chỉ đại sang phải.
    dx = b.x - a.x
    dy = b.y - a.y
    far = (dx ** 2 + dy ** 2) ** 0.5
    if far < 0.01:
        return 1, 0, far
    return dx / far, dy / far, far


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


def add_effect(kind, x, y, scale=1, color="#ffffff", x2=0, y2=0):
    # Nhiều quá thì bỏ cái cũ nhất, để cái mới luôn hiện.
    if len(effects) >= MAX_EFFECTS:
        effects.pop(0)
    effects.append(Effect(kind, x, y, scale, color, x2, y2))


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
    return 172 + i * 120


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
    if dx != 0 or dy != 0:
        hero.target = None      # bấm phím thì thôi đi theo chỗ chạm
        if dx != 0 and dy != 0:
            step = step * 0.7   # đi chéo thì bước ngắn lại, kẻo nhanh hơn đi thẳng
    elif hero.target is not None:
        dx, dy, step = step_to_target()
    hero.moving = dx != 0 or dy != 0
    if dx > 0.1:
        hero.look = "right"
    elif dx < -0.1:
        hero.look = "left"
    hero.x = hero.x + dx * step
    hero.y = hero.y + dy * step
    keep_inside(hero, 24)
    hero.safe = max(0, hero.safe - 1)


def read_tap():
    # Chạm vào sân: đi tới đó. Mới chọn thẻ xong thì chờ một chút, kẻo chạm đúp vào thẻ thành chạm vào sân.
    if clicked() and game["clock"] >= WAIT and TOP <= mouse_y() <= BOTTOM and 0 <= mouse_x() <= WIDTH:
        hero.target = [max(24, min(WIDTH - 24, mouse_x())), max(TOP + 24, min(BOTTOM - 24, mouse_y()))]


def step_to_target():
    dx = hero.target[0] - hero.x
    dy = hero.target[1] - hero.y
    far = (dx ** 2 + dy ** 2) ** 0.5
    if far <= hero.speed:           # bước cuối: tới đúng chỗ rồi dừng
        hero.target = None
        return dx, dy, 1
    return dx / far, dy / far, hero.speed


def nearest_mob(x, y, reach, skip):
    best = None
    for mob in mobs:
        far = ((mob.x - x) ** 2 + (mob.y - y) ** 2) ** 0.5 - mob.size
        if far < reach and mob.age >= BIRTH and mob.hp > 0 and mob not in skip:
            best = mob
            reach = far         # từ giờ phải gần hơn con này mới được tính
    return best


def mobs_near(x, y, r):
    return [mob for mob in mobs if (mob.x - x) ** 2 + (mob.y - y) ** 2 < (r + mob.size) ** 2 and mob.age >= BIRTH]


def attack():
    hero.wait = hero.wait - 1
    if hero.wait > 0:
        return
    target = nearest_mob(hero.x, hero.y, hero.data["range"], [])
    if target is None:
        return
    hero.wait = hero.data["reload"]
    if level_of("spark_fast") > 0:
        hero.wait = hero.wait * value("spark_fast", "faster")
    dx, dy, far = direction(hero, target)
    if not hero.moving:         # đứng yên thì quay mặt về phía quái
        hero.look = "right"
        if dx < 0:
            hero.look = "left"
    if hero.data["attack"] == "slash":
        slash()
    else:
        add(shots, Shot(hero.data["attack"], hero.x, hero.y, dx, dy, 7, hero.power), MAX_SHOTS)


def slash():
    # Nhát chém xa hơn mép ảnh một chút nên phóng to vừa bằng tầm chém.
    reach = hero.data["range"]
    add_effect("ring", hero.x, hero.y, reach, "#ffffff")
    add_effect("slash", hero.x, hero.y, reach / 24)
    first = True
    for mob in mobs_near(hero.x, hero.y, reach):
        hit(mob, hero.power, first)
        first = False       # sét chỉ nhảy từ con đầu tiên


def hit(mob, power, can_jump):
    # Đòn đánh thường: ngoài sát thương còn kèm các skill "Trúng đòn thì..."
    hurt(mob, power, "common")
    add_effect("hit", mob.x, mob.y)
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
    hero.safe = hero.safe_time
    play_sound("hit")
    if hero.shield:
        hero.shield = False
        hero.shield_wait = value("ice_shield", "every")
        blast(hero.x, hero.y, 100, value("ice_shield", "power"), "ice", 120)
        return
    hero.hp = max(0, hero.hp - 1)


def heal(hearts):
    hero.hp = min(hero.max_hp, hero.hp + hearts)
    add_effect("heal", hero.x, hero.y + 16, 1.5)


def xp_needed():
    return 3 + hero.level * 3


# ---------- SKILL ----------

def hurt(mob, power, branch):
    if mob.age < BIRTH or mob.hp <= 0:
        return
    if "ember" in combos and branch == "fire":
        power = power * 1.4
    if "chill" in combos and mob.slow > 0:
        power = power * 1.2
    if "conduct" in combos and branch == "spark" and mob.slow > 0:
        power = power * 1.5
    if "stun" in combos and branch == "spark":
        mob.stun = 20
    mob.hp = mob.hp - power
    mob.flash = 5
    if "steam" in combos and branch == "fire" and mob.slow > 0 and mob.steam_wait == 0:
        mob.steam_wait = 60     # nghỉ 1 giây, kẻo lửa cháy liên tục thì nổ hoài
        blast(mob.x, mob.y, 60, 5, "steam", 0)


def blast(x, y, r, power, branch, slow):
    # Nổ vòng tròn: con nào trong vòng cũng đau, và chậm đi "slow" khung.
    if branch == "fire":
        add_effect("explosion", x, y, r / 30)
    elif branch == "spark":
        add_effect("spark", x, y, r / 30)
    elif branch == "ice":
        add_effect("ring", x, y, r, BRANCHES["ice"]["color"])
    else:
        add_effect("poof", x, y, r / 45)
    for mob in mobs_near(x, y, r):
        hurt(mob, power, branch)
        mob.slow = max(mob.slow, slow)
        if branch == "ice":
            add_effect("ice", mob.x, mob.y + mob.size)


def strike(x, y, mob, power):
    add_effect("bolt", x, y, 1, BRANCHES["spark"]["color"], mob.x, mob.y)
    add_effect("spark", mob.x, mob.y)
    hurt(mob, power, "spark")


def spark_jump(mob):
    done = [mob]
    for i in range(value("spark_jump", "count")):
        last = done[-1]
        target = nearest_mob(last.x, last.y, 110, done)
        if target is None:
            return
        strike(last.x, last.y, target, value("spark_jump", "power"))
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
        mob = nearest_mob(hero.x, hero.y, 250, [])
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
    if zone.kind == "trap" and zone.life % 4 == 0 and len(mobs_near(zone.x, zone.y, 22)) > 0:
        blast(zone.x, zone.y, zone.r, zone.power, "spark", 0)
        zone.life = 0
    if zone.kind == "hail" and zone.life == 0:
        blast(zone.x, zone.y, zone.r, zone.power, "ice", 70)
    if zone.kind == "rock" and zone.life == 0:
        add_effect("poof", zone.x, zone.y, zone.r / 40)
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
    if dir_x > 0.2:
        mob.look = "right"
    elif dir_x < -0.2:
        mob.look = "left"


def update_mob(mob):
    mob.age = mob.age + 1
    if mob.slow > 0:
        mob.slow = mob.slow - 1
    if mob.flash > 0:
        mob.flash = mob.flash - 1
    if mob.steam_wait > 0:
        mob.steam_wait = mob.steam_wait - 1
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
    dx, dy, far = direction(mob, hero)
    move_mob(mob, dx, dy, far)
    keep_inside(mob, 8 * mob.data["scale"])
    if far < mob.size + hero.size - 4:
        hurt_hero()


def move_mob(mob, dx, dy, far):
    move = mob.data["move"]
    speed = mob.data["speed"]
    if move == "chase":
        walk(mob, dx, dy, speed)
    elif move == "zigzag":
        side = 1
        if mob.age // 30 % 2 == 0:
            side = -1
        walk(mob, dx - dy * side, dy + dx * side, speed * 0.75)
    elif move == "shoot":
        if far > 170:
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
    # Rồng Nhớt: ngồi im lấy đà, nhảy tới chỗ em, đáp xuống thì đẻ 2 nhớt con.
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
    # Người Tuyết: đi chậm, cứ một lúc lại bắn một vòng đạn. Mỗi vòng xoay lệch để khe hở đổi chỗ.
    walk(mob, dx, dy, speed)
    if mob.age % 110 == 0:
        for i in range(10):
            angle = i * 2 * pi / 10 + mob.age
            add(shots, Shot("spore", mob.x, mob.y, cos(angle), sin(angle), 2.4, 1), MAX_SHOTS)


def move_charge(mob, dx, dy, speed):
    # Vua Dung Nham: đi bộ, ngắm (hiện vạch đỏ), húc thẳng, rồi đá rơi quanh em. Còn nửa máu thì đá rơi nhiều hơn.
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
        drop_gem(mob.x, mob.y, mob.data["xp"])
        if level_of("fire_boom") > 0:
            blast(mob.x, mob.y, value("fire_boom", "radius"), value("fire_boom", "power"), "fire", 0)
        else:
            add_effect("poof", mob.x, mob.y, mob.size / 16)
        if "boss" in mob.data:
            finish_floor()
    remove_dead(mobs)


def drop_gem(x, y, amount):
    if len(gems) < MAX_GEMS:
        gems.append(Gem(x, y, amount))
    else:
        gems[0].value = gems[0].value + amount      # sân đầy ngọc: gộp vào viên cũ, em không mất kinh nghiệm


def update_gem(gem):
    dx, dy, far = direction(gem, hero)
    if far < hero.magnet:
        gem.x = gem.x + dx * 6
        gem.y = gem.y + dy * 6
    if far < 18:
        gem.alive = False
        hero.xp = hero.xp + gem.value * hero.gem_bonus
        if game["time"] - game["last_gem"] >= 24:       # nhặt cả nắm thì chỉ kêu và lóe một lần
            game["last_gem"] = game["time"]
            play_sound("point")
            add_effect("pickup", hero.x, hero.y)


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
        for mob in mobs:
            if abs(mob.x - shot.x) < mob.size + 6 and abs(mob.y - shot.y) < mob.size + 6 and mob.age >= BIRTH:
                shot.alive = False
                hit_with_shot(shot, mob)
                break


def hit_with_shot(shot, mob):
    if shot.kind == "plasma":
        hurt(mob, shot.power, "fire")
        hurt(mob, shot.power, "spark")
        add_effect("hit", mob.x, mob.y)
        return
    hit(mob, shot.power, True)
    if shot.kind == "orb":          # đạn phép nổ lan: các quái đứng gần cũng bị đau
        add_effect("ring", shot.x, shot.y, 50, hero.data["color"])
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
    game["last_gem"] = 0
    start_floor(0)


def start_floor(number):
    for things in [mobs, shots, gems, zones, effects, queue]:
        things.clear()
    game["floor"] = number
    game["boss_out"] = False
    game["floor_done"] = False
    hero.x = WIDTH / 2
    hero.y = (TOP + BOTTOM) / 2
    hero.target = None
    hero.safe = SAFE
    announce("Ải " + str(number + 1) + ": " + WAVES[number]["name"])
    play_music("happy")
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
            play_sound("fall")
            play_music("adventure")


def finish_floor():
    # Trùm thua thì quái con tan hết, ngọc tự bay về em.
    game["floor_done"] = True
    for mob in mobs:
        if mob.alive:
            mob.alive = False
            add_effect("poof", mob.x, mob.y)
    for gem in gems:
        hero.xp = hero.xp + gem.value * hero.gem_bonus
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
        heal(1)
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
    add_effect("levelup", hero.x, hero.y + 16, 1.5)
    if name == "heart":
        hero.max_hp = hero.max_hp + 1
        heal(2)
    if name == "boots":
        hero.speed = hero.speed + 0.35
        hero.safe_time = hero.safe_time + 60
    if name == "magnet":
        hero.magnet = hero.magnet + 90
        hero.gem_bonus = hero.gem_bonus + 0.2
    if name == "muscle":
        hero.power = hero.power + 3
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
            play_sound("click")
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
            start_floor(game["floor"] + 1)
            heal(2)
    elif wants_next():              # win hoặc lose
        open_screen("hero")
        play_music("calm")


def update_play():
    game["time"] = game["time"] + 1
    read_tap()
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
        effect.age = effect.age + 1
        if effect.kind == "levelup" or effect.kind == "heal":       # hai thứ này đi theo chân em
            effect.x = hero.x
            effect.y = hero.y + 16
        effect.alive = effect.age < effect.life
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
    # Mỗi khung chỉ xét một phần ba số quái (cách 3 con lấy 1), cho nhẹ máy.
    for a in mobs[game["time"] % 3::3]:
        for b in mobs:
            if abs(a.x - b.x) < 18 and abs(a.y - b.y) < 18 and a is not b and "boss" not in a.data:
                dx, dy, far = direction(b, a)
                a.x = a.x + dx * 1.8
                a.y = a.y + dy * 1.8
                keep_inside(a, a.size)


# ---------- VẼ ----------

def draw_sprite(name, x, y, scale, mirror=False):
    # Ảnh vuông 16 điểm, (x, y) là giữa ảnh.
    draw_image("images/" + name + ".png", x - 8 * scale, y - 8 * scale, scale=scale, mirror=mirror)


def draw_floor():
    floor = WAVES[game["floor"]]
    clear(floor["color"])
    for spot in SPOTS:
        draw_rect(spot[0], spot[1], spot[2], spot[3], floor["spot"])
    draw_rect(0, TOP, WIDTH, 22, floor["wall"])
    draw_rect(0, TOP + 22, WIDTH, 4, "#00000055")
    draw_rect(0, TOP, 6, BOTTOM - TOP, floor["wall"])
    draw_rect(WIDTH - 6, TOP, 6, BOTTOM - TOP, floor["wall"])
    draw_rect(0, BOTTOM - 6, WIDTH, 6, floor["wall"])
    for deco in DECO:
        draw_image("images/" + deco[0] + ".png", deco[1], deco[2], scale=2)


def draw_mob(mob):
    if mob.age < BIRTH:
        draw_circle(mob.x, mob.y, 4 + mob.age / 4, "#ffffff66")      # bóng mờ báo trước: sắp có quái
        return
    data = mob.data
    half = 8 * data["scale"]
    draw_rect(mob.x - half * 0.7, mob.y + half - 5, half * 1.4, 6, "#00000055")
    if mob.slow > 0:
        draw_circle(mob.x, mob.y, half + 2, "#7fd8ff77")
    lift = mob.age // 8 % 2 * 2         # nhún lên nhún xuống
    if mob.kind == "bat":
        lift = lift * 2 + 4
    if mob.kind == "boss1" and mob.age % 120 > 70:
        lift = sin((mob.age % 120 - 70) / 50 * pi) * 36
    draw_sprite(data["image"], mob.x, mob.y - lift, data["scale"], mob.look != data["faces"])
    if mob.flash > 2:
        draw_circle(mob.x, mob.y - lift, half * 0.8, "#ffffff99")
    if mob.stun > 0:
        draw_sprite("skill-spark-1", mob.x, mob.y - half - 8, 1)
    elif mob.burn > 0:
        draw_sprite("shot-fire", mob.x, mob.y - half - 8, 1)
    if mob.kind == "boss3" and 70 < mob.age % 190 < 111:        # vạch đỏ: trùm sắp húc theo hướng này, né đi
        draw_line(mob.x, mob.y, mob.x + mob.dir_x * 260, mob.y + mob.dir_y * 260, "#ff5050aa", 6)


def draw_shot(shot):
    if shot.kind == "arrow":
        draw_arrow(shot)
    elif shot.kind == "orb":
        draw_sprite("shot-spark", shot.x, shot.y, 1.5)
    elif shot.kind == "plasma":
        draw_sprite("shot-fire", shot.x, shot.y, 1.5)
    else:
        draw_circle(shot.x, shot.y, 8, "#1b1b28")
        draw_circle(shot.x, shot.y, 7, "#ff4f6d")
        draw_circle(shot.x, shot.y, 3, "#ffffff")


def draw_arrow(shot):
    if abs(shot.dir_y) < 0.15:          # bay ngang thì dùng ảnh. Trong ảnh, mũi tên chỉ sang trái.
        draw_sprite("shot-arrow", shot.x, shot.y, 1.5, shot.dir_x > 0)
        return
    back_x = shot.x - shot.dir_x * 18
    back_y = shot.y - shot.dir_y * 18
    draw_line(back_x, back_y, shot.x, shot.y, "#1b1b28", 5)
    draw_line(back_x, back_y, shot.x, shot.y, "#c98a5a", 2)
    draw_line(back_x, back_y, back_x + shot.dir_x * 5, back_y + shot.dir_y * 5, "#e05060", 4)
    draw_line(shot.x - shot.dir_x * 3, shot.y - shot.dir_y * 3, shot.x, shot.y, "#e8f0ff", 4)


def draw_zone(zone):
    if zone.kind == "flame":
        # Bùng lên (khung 0, 1), cháy (2 tới 5), rồi tàn (6 tới 8).
        frame = 2 + zone.life // 5 % 4
        if zone.life > 142:
            frame = (150 - zone.life) // 4
        elif zone.life < 15:
            frame = 8 - zone.life // 5
        draw_image("images/fx-fire.png", zone.x - 24, zone.y - 26, frame=frame)
    elif zone.kind == "trap":
        draw_sprite("skill-spark-4", zone.x, zone.y, 1.5)
    elif zone.kind == "hail":
        draw_circle(zone.x, zone.y, zone.r, "#7fd8ff44")
        draw_sprite("shot-ice", zone.x, zone.y - zone.life * 4, 2)
    else:
        draw_circle(zone.x, zone.y, zone.r, "#ff505055")
        draw_circle(zone.x, zone.y, max(0, zone.r - zone.life * 0.7), "#ff505066")


def draw_effect(effect):
    if effect.kind == "ring":
        draw_circle(effect.x, effect.y, effect.scale * (0.3 + effect.age / 20), effect.color + "33")
    elif effect.kind == "bolt":
        mid_x = (effect.x + effect.x2) / 2 + effect.age - 7
        mid_y = (effect.y + effect.y2) / 2 - 8
        draw_line(effect.x, effect.y, mid_x, mid_y, effect.color, 3)
        draw_line(mid_x, mid_y, effect.x2, effect.y2, effect.color, 3)
    else:
        fx = FX[effect.kind]
        path = "images/fx-" + effect.kind + ".png"
        x = effect.x - fx["width"] / 2 * effect.scale
        y = effect.y - fx["foot"] * effect.scale
        frame = min(fx["frames"] - 1, effect.age // fx["hold"])
        draw_image(path, x, y, frame=frame, scale=effect.scale)
        if effect.kind == "slash":      # thêm nửa vòng bên kia
            draw_image(path, x, y, frame=frame, flip=True, scale=effect.scale, mirror=True)


def draw_hero_in_play():
    if hero.target is not None:
        draw_circle(hero.target[0], hero.target[1], 11, "#ffffffaa")
        draw_circle(hero.target[0], hero.target[1], 8, WAVES[game["floor"]]["color"])
    draw_rect(hero.x - 11, hero.y + 13, 22, 6, "#00000055")
    if hero.shield:
        draw_circle(hero.x, hero.y, 26, "#7fd8ff88")
    lift = 0
    if hero.moving:
        lift = game["time"] // 6 % 2 * 3
    if hero.safe // 5 % 2 == 0:         # nhấp nháy khi đang bất tử
        draw_sprite(hero.data["image"], hero.x, hero.y - lift, 2.5, hero.look != hero.data["faces"])
    for spot in ember_spots():
        draw_sprite("shot-fire", spot[0], spot[1], 1.5)
    if level_of("spark_cloud") > 0:
        draw_sprite("skill-spark-3", hero.x, hero.y - 48, 2)


def draw_skill_icon(name, x, y, scale, level):
    # Ô có viền màu của nhánh, hình của skill, và vạch trắng cho biết mấy cấp.
    branch = BRANCHES[SKILLS[name]["branch"]]
    side = 16 * scale
    draw_rect(x, y, side + 4, side + 4, branch["color"])
    draw_rect(x + 2, y + 2, side, side, "#20202e")
    draw_image("images/" + SKILLS[name]["icon"] + ".png", x + 2, y + 2, scale=scale)
    draw_rect(x, y + side + 4, (side + 4) * level / MAX_LEVEL, 2 + scale, "#ffffff")


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
        draw_image("images/item-heart.png", 190 + i * 24, 13, scale=1.25)
        if i >= hero.hp:
            draw_rect(188 + i * 24, 11, 24, 24, "#181824cc")      # tim đã mất: che mờ đi
    draw_text("Cấp " + str(hero.level), 545, 24, 26, "#5ff0c8")
    draw_rect(0, TOP - 12, WIDTH, 10, "#33334a")
    draw_rect(0, TOP - 12, WIDTH * min(1, hero.xp / xp_needed()), 10, "#2fc9a8")
    for mob in mobs:
        if "boss" in mob.data:          # thanh máu trùm
            draw_rect(180, 37, 300, 11, "#4a2430")
            draw_rect(182, 39, max(0, 296 * mob.hp / mob.max_hp), 7, "#ff6b6b")
    for i in range(len(combos)):
        draw_combo(i, COMBOS[combos[i]])
    x = 5
    for name in hero.skills:
        draw_skill_icon(name, x, BOTTOM + 28, 1.75, hero.skills[name])
        x = x + 37


def draw_combo(i, combo):
    # Phối hợp đã mở thì hiện tên mãi ở thanh dưới. Vạch màu: cần những nhánh nào.
    x = 4 + i * 99
    draw_rect(x, BOTTOM + 2, 97, 24, "#4a3560")
    width = 97 / len(combo["needs"])
    for branch in combo["needs"]:
        draw_rect(x, BOTTOM + 2, width, 4, BRANCHES[branch]["color"])
        x = x + width
    draw_text(combo["name"], 4 + i * 99 + 48, BOTTOM + 15, 18, "#ffd0f0")


def draw_play():
    draw_floor()
    for zone in zones:
        draw_zone(zone)
    for gem in gems:
        draw_sprite("item-xp", gem.x, gem.y, 1.25)
    for mob in mobs:
        draw_mob(mob)
    for effect in effects:
        draw_effect(effect)
    draw_hero_in_play()     # vẽ em sau hiệu ứng, để lúc nào cũng thấy em ở đâu
    for shot in shots:
        draw_shot(shot)
    draw_hud()
    if len(banners) > 0 and game["state"] == "play":
        draw_rect(20, 98, 560, 40, "#101018bb")
        draw_text(banners[0][0], 300, 118, 24, "#ffe9a8")


def draw_row(i, color, dark):
    draw_rect(40, row_top(i), 520, 110, color)
    draw_rect(43, row_top(i) + 3, 514, 104, dark)
    draw_text(str(i + 1), 66, row_top(i) + 55, 36, color)


def draw_hero_choice():
    clear("#1d1b2c")
    draw_text("HẦM NGỌC", 300, 60, 64, "#5ff0c8")
    draw_text("Chọn nhân vật: phím 1, 2, 3 hoặc bấm vào", 300, 130, 26)
    for i in range(3):
        data = HEROES[i]
        draw_row(i, data["color"], "#4a4660")
        draw_sprite(data["image"], 135, row_top(i) + 55 - game["clock"] // 20 % 2 * 4, 5, data["faces"] == "left")
        draw_text(data["name"], 370, row_top(i) + 36, 36, data["color"])
        draw_text(data["text"], 370, row_top(i) + 76, 24)
    draw_text("Mũi tên / WASD hoặc chạm để đi", 300, 562, 26, "#ffe9a8")


def draw_cards():
    draw_rect(20, 66, 560, 470, "#101018ee")
    draw_text("Lên cấp " + str(hero.level) + "!", 300, 98, 44, "#5ff0c8")
    draw_text("Chọn 1 thẻ: phím 1, 2, 3 hoặc bấm vào", 300, 143, 24)
    for i in range(len(cards)):
        draw_card(i, cards[i])


def draw_card(i, name):
    branch = BRANCHES[SKILLS[name]["branch"]]
    level = level_of(name) + 1
    y = row_top(i)
    draw_row(i, branch["color"], branch["dark"])
    draw_skill_icon(name, 88, y + 18, 4, level)
    draw_text(SKILLS[name]["name"] + " - " + branch["name"] + " cấp " + str(level), 360, y + 24, 30, branch["color"])
    draw_text(SKILLS[name]["text"][level - 1], 360, y + 58, 24)
    unlock = combo_from(name)
    if unlock != "":
        draw_text("Mở phối hợp: " + unlock, 360, y + 90, 22, "#ff9ad9")


def draw_message(image, title, line, color, after):
    draw_rect(60, 150, 480, 270, "#101018ee")
    draw_sprite(image, 300, 195, 4)
    draw_text(title, 300, 270, 56, color)
    draw_text(line, 300, 325, 26)
    draw_text("Bấm Space hoặc chạm để " + after, 300, 380, 24, "#b9c0d8")


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
        draw_message("item-heart", "Qua ải " + str(game["floor"] + 1) + "!", "Em được hồi 2 tim", "#5ff0c8", "đi tiếp")
    elif state == "win":
        draw_message("item-chest", "Em thắng rồi!", beaten, "#ffe14d", "chơi lại")
    elif state == "lose":
        draw_message(hero.data["image"], "Thua mất rồi!", beaten, "#ff8a8a", "chơi lại")
