# Hầm Ngọc — bản chơi thử. Đi bằng mũi tên (hoặc giữ chuột), nhân vật tự đánh, nhặt ngọc, lên cấp thì chọn 1 trong 3 thẻ.
# Muốn đổi game: sửa các BẢNG ở đầu file trước. Phần code bên dưới chỉ đọc bảng.

from math import cos, sin, pi
from pyquest import *


# ---------- BẢNG DỮ LIỆU ----------
# Thời gian tính bằng khung hình: 60 khung = 1 giây. Riêng bảng FLOORS ghi bằng giây cho dễ đọc.

BRANCHES = {
    "fire": {"name": "Lửa", "color": "#ff8a3c", "dark": "#5a2a1a"},
    "ice": {"name": "Băng", "color": "#7fd8ff", "dark": "#1d3f5c"},
    "spark": {"name": "Sét", "color": "#ffe14d", "dark": "#4f4718"},
    "common": {"name": "Chung", "color": "#b9e88a", "dark": "#2c4a2c"},
}

# "faces": trong ảnh gốc, nhân vật (quái) quay mặt về bên nào. Đi về bên kia thì lật ảnh.
HEROES = [
    {"name": "Kiếm sĩ", "image": "hero-knight", "faces": "left", "attack": "slash", "hp": 120, "speed": 1.55, "power": 9,
     "reload": 70, "range": 105, "color": "#6fa8ff", "text": "120 máu. Chém cả vòng quanh mình"},
    {"name": "Pháp sư", "image": "hero-mage", "faces": "left", "attack": "orb", "hp": 105, "speed": 1.55, "power": 8,
     "reload": 78, "range": 380, "color": "#c79bff", "text": "105 máu. Đạn phép nổ lan"},
    {"name": "Cung thủ", "image": "hero-archer", "faces": "right", "attack": "arrow", "hp": 105, "speed": 1.7, "power": 8,
     "reload": 58, "range": 420, "color": "#7fd87a", "text": "105 máu. Đi nhanh, tên xuyên 3 con"},
]
PIERCE = 3          # một mũi tên trúng được mấy con
SHOT_SPEED = 4      # đạn của em bay bấy nhiêu điểm mỗi khung

# "size": chạm gần bấy nhiêu thì trúng. "scale": ảnh 16 điểm phóng to mấy lần. "bite": chạm em thì em mất mấy máu.
# "xp": viên ngọc rơi ra đáng mấy kinh nghiệm (ải sau nhân thêm, xem "gems" trong FLOORS).
MOBS = {
    "slime": {"image": "mob-slime", "faces": "left", "scale": 1.75, "move": "chase", "hp": 7, "speed": 0.5, "size": 11,
              "bite": 7, "xp": 1},
    "bat": {"image": "mob-bat", "faces": "left", "scale": 1.75, "move": "zigzag", "hp": 4, "speed": 0.85, "size": 10,
            "bite": 6, "xp": 1, "fly": True},
    "mushroom": {"image": "mob-mushroom", "faces": "left", "scale": 1.75, "move": "shoot", "hp": 12, "speed": 0.42,
                 "size": 12, "bite": 9, "xp": 2},
    "ghost": {"image": "mob-ghost", "faces": "left", "scale": 1.75, "move": "dash", "hp": 14, "speed": 0.55, "size": 12,
              "bite": 10, "xp": 2, "fly": True},
    "golem": {"image": "mob-golem", "faces": "left", "scale": 2.5, "move": "chase", "hp": 50, "speed": 0.36, "size": 16,
              "bite": 16, "xp": 6},
    "boss1": {"image": "boss-1", "faces": "left", "scale": 5.5, "move": "hop", "hp": 900, "speed": 2.2, "size": 36, "bite": 24,
              "xp": 40, "fly": True, "boss": "Rồng Nhớt"},
    "boss2": {"image": "boss-2", "faces": "left", "scale": 5.5, "move": "ring", "hp": 2200, "speed": 0.5, "size": 38,
              "bite": 26, "xp": 40, "fly": True, "boss": "Người Tuyết"},
    "boss3": {"image": "boss-3", "faces": "left", "scale": 6.5, "move": "charge", "hp": 4600, "speed": 0.7, "size": 42,
              "bite": 30, "xp": 40, "fly": True, "boss": "Vua Dung Nham"},
}

# Mỗi ải là một sân rộng gấp mấy lần màn hình, màn hình đi theo em.
# "world": sân rộng, cao. "length": mấy giây thì trùm ra. "tough", "pace": máu và tốc độ quái nhân lên bấy nhiêu.
# "gems": ngọc ở ải này đáng gấp mấy lần (ải sau quái khó hơn thì cho nhiều kinh nghiệm hơn).
# "waves": từ giây thứ mấy, các loại quái (số to = ra nhiều hơn), mấy khung ra một con, sân lúc nào cũng có ít nhất mấy con.
# "swarms": giây thứ mấy có cả bầy kéo tới. "elites": giây thứ mấy có quái to giữ rương.
# "props": [ảnh, phóng to, bán kính chắn đường (0 = đi xuyên được), hay gặp tới đâu]. "thick": trong 10 ô thì mấy ô có đồ.
# "walls": vật cản dài (hàng rào, vách đá): [ảnh, phóng to, chắn, mấy bức, ngắn nhất, dài nhất (số món)].
# "clumps": cụm cây, cụm đá chen nhau, chừa lối nhỏ: [[các ảnh], phóng to, chắn, mấy cụm].
# "pools": ảnh vũng, làm chậm (slow) hay gây bỏng (burn), mấy vũng. "marks": thứ đặt sẵn quanh giữa sân, [ảnh, to, chắn, x, y].
FLOORS = [
    {"name": "Đồng Rêu", "world": [4200, 2600], "ground": "deco-ground-meadow", "outside": "#2f4a33", "length": 150,
     "tough": 1, "pace": 1, "gems": 1, "boss": "boss1",
     "waves": [[0, {"slime": 1}, 60, 10], [20, {"slime": 3, "bat": 1}, 46, 16], [45, {"slime": 3, "bat": 2}, 38, 22],
               [75, {"slime": 3, "bat": 2, "mushroom": 1}, 32, 28], [110, {"slime": 3, "bat": 3, "mushroom": 1}, 26, 36]],
     "swarms": [[35, "bat", 14], [65, "slime", 20], [100, "bat", 22], [130, "slime", 26]],
     "elites": [[55, "slime"], [95, "mushroom"]],
     "props": [["deco-oak", 5, 15, 3], ["deco-chestnut", 5, 15, 3], ["deco-walnut", 5, 15, 1], ["deco-stump", 3, 14, 1],
               ["deco-boulder", 3, 18, 2], ["deco-bush", 3, 0, 3], ["deco-flowers", 2.5, 0, 4], ["deco-grass", 2.5, 0, 6]],
     "thick": 4, "walls": [["deco-fence", 3, 14, 14, 4, 9]],
     "clumps": [[["deco-oak", "deco-chestnut", "deco-walnut"], 5, 15, 10], [["deco-boulder", "deco-stump"], 3, 16, 6]],
     "patch": "deco-dirt", "pools": ["deco-pond", "slow", 12], "rim": "deco-reed", "edge": ["deco-oak", "deco-chestnut"],
     "marks": [["deco-well", 4, 24, 0, -120], ["deco-fence", 3, 14, -110, -140], ["deco-fence", 3, 14, -64, -140],
               ["deco-fence", 3, 14, 64, -140], ["deco-fence", 3, 14, 110, -140], ["deco-flowers", 2.5, 0, -90, -100],
               ["deco-flowers", 2.5, 0, 90, -100]], "air": "petals"},
    {"name": "Rừng Sương", "world": [5000, 2200], "ground": "deco-ground-forest", "outside": "#1c2f33", "length": 165,
     "tough": 1.85, "pace": 1.1, "gems": 1.6, "boss": "boss2",
     "waves": [[0, {"bat": 2, "slime": 2}, 44, 16], [25, {"bat": 2, "mushroom": 2, "slime": 1}, 36, 22],
               [60, {"ghost": 2, "slime": 2, "mushroom": 1}, 32, 28], [95, {"ghost": 2, "mushroom": 2, "bat": 2}, 27, 36],
               [130, {"ghost": 3, "mushroom": 2, "bat": 3}, 24, 42]],
     "swarms": [[30, "bat", 22], [70, "ghost", 16], [105, "bat", 30], [145, "ghost", 22]],
     "elites": [[50, "mushroom"], [90, "ghost"], [135, "bat"]],
     "props": [["deco-haunted", 5, 15, 3], ["deco-spirit", 5, 15, 3], ["deco-dead", 5, 15, 2], ["deco-star-tree", 5, 15, 2], ["deco-fern", 4, 13, 2],
               ["deco-thistle", 2.5, 0, 4], ["deco-crystal-flower", 2, 0, 3], ["deco-grass", 2.5, 0, 4]],
     "thick": 5, "walls": [["deco-fern", 4, 13, 8, 4, 8]],
     "clumps": [[["deco-haunted", "deco-spirit", "deco-dead"], 5, 15, 18], [["deco-star-tree", "deco-fern"], 5, 14, 6]],
     "patch": "deco-mist-moss", "pools": ["deco-swamp", "slow", 13], "rim": "deco-fern",
     "edge": ["deco-haunted", "deco-spirit"],
     "marks": [["deco-lantern", 5, 15, -230, -120], ["deco-lantern", 5, 15, 230, -120], ["deco-lantern", 5, 15, -230, 150],
               ["deco-lantern", 5, 15, 230, 150], ["deco-lantern", 5, 15, -700, 0], ["deco-lantern", 5, 15, 700, 0]],
     "air": "mist"},
    {"name": "Hang Đá", "world": [3800, 3000], "ground": "deco-ground-cave", "outside": "#241b1a", "length": 180,
     "tough": 4.1, "pace": 1.22, "gems": 2.4, "boss": "boss3",
     "waves": [[0, {"golem": 1, "bat": 3}, 40, 18], [25, {"golem": 2, "bat": 3, "ghost": 1}, 33, 26],
               [65, {"golem": 2, "ghost": 3, "mushroom": 1}, 28, 32], [105, {"golem": 2, "ghost": 3, "bat": 3}, 24, 40],
               [145, {"golem": 3, "ghost": 3, "mushroom": 2, "bat": 3}, 22, 46]],
     "swarms": [[35, "bat", 26], [75, "ghost", 20], [110, "golem", 10], [150, "bat", 34]],
     "elites": [[45, "bat"], [85, "golem"], [130, "ghost"]],
     "props": [["deco-rock", 4, 20, 4], ["deco-ember-rock", 3.5, 18, 2], ["deco-crystal", 3, 16, 2],
               ["deco-crystal-green", 3, 16, 1], ["deco-burnt", 4, 14, 2], ["deco-ruin", 4, 18, 1], ["deco-boulder", 2.5, 14, 2]],
     "thick": 3, "walls": [["deco-rock", 4, 20, 16, 5, 11], ["deco-ruin", 4, 18, 5, 3, 6]],
     "clumps": [[["deco-crystal", "deco-crystal-green", "deco-rock"], 3.5, 16, 8]],
     "patch": "deco-ash", "pools": ["deco-lava", "burn", 14], "rim": "deco-ember-rock",
     "edge": ["deco-rock", "deco-boulder"],
     "marks": [["deco-pillar", 4, 20, -300, -190], ["deco-column", 4, 20, 0, -260], ["deco-pillar", 4, 20, 300, -190],
               ["deco-column", 4, 20, 360, 60], ["deco-pillar", 4, 20, 300, 260], ["deco-column", 4, 20, 0, 330],
               ["deco-pillar", 4, 20, -300, 260], ["deco-column", 4, 20, -360, 60], ["deco-brazier", 3, 16, -150, -110],
               ["deco-brazier", 3, 16, 150, -110], ["deco-brazier", 3, 16, -150, 170], ["deco-brazier", 3, 16, 150, 170]],
     "air": "embers"},
]
# Đồ phát sáng: ảnh quầng sáng và phóng to mấy lần.
GLOWS = {"deco-lantern": ["deco-glow-cool", 4], "deco-brazier": ["deco-glow-warm", 4.5], "deco-spirit": ["deco-glow-cool", 2.5],
         "deco-star-tree": ["deco-glow-warm", 2.5], "deco-crystal": ["deco-glow-cool", 2.2],
         "deco-crystal-green": ["deco-glow-cool", 2.2], "deco-lava": ["deco-glow-warm", 4.5]}

# Mỗi danh sách có 3 số: cấp 1, cấp 2, cấp 3. "every": mấy khung thì dùng một lần.
SKILLS = {
    "fire_orbit": {"name": "Đốm Lửa", "branch": "fire", "icon": "skill-fire-2", "count": [1, 2, 3], "power": [5, 6, 7],
                   "text": ["1 đốm lửa bay quanh em", "2 đốm lửa bay quanh em", "3 đốm lửa, nóng hơn"]},
    "fire_trail": {"name": "Vệt Than", "branch": "fire", "icon": "skill-fire-3", "every": [36, 30, 24], "power": [4, 6, 8],
                   "text": ["Em đi tới đâu, than cháy tới đó", "Than nóng hơn, dày hơn", "Than nóng nhất, dày nhất"]},
    "fire_hit": {"name": "Đòn Cháy", "branch": "fire", "icon": "skill-fire-1", "power": [2, 4, 6],
                 "text": ["Trúng đòn thì quái bị cháy", "Cháy đau gấp 2", "Cháy đau gấp 3"]},
    "fire_boom": {"name": "Nổ Tàn Tro", "branch": "fire", "icon": "skill-fire-4", "radius": [50, 62, 75],
                  "power": [4, 6, 9],
                  "text": ["Quái thua thì nổ, quái gần bị đau", "Nổ to hơn", "Nổ rất to"]},
    "ice_rain": {"name": "Mưa Đá", "branch": "ice", "icon": "skill-ice-1", "every": [140, 105, 75], "power": [10, 13, 16],
                 "text": ["Cục đá rơi trúng quái, làm chậm", "Đá rơi nhanh hơn, đau hơn", "Đá rơi liên tục"]},
    "ice_ring": {"name": "Vòng Sương", "branch": "ice", "icon": "skill-ice-4", "every": [260, 215, 170],
                 "radius": [110, 130, 150], "power": [6, 8, 11],
                 "text": ["Vòng sương quanh em làm chậm quái", "Vòng rộng hơn, nhiều hơn", "Vòng rất rộng"]},
    "ice_shield": {"name": "Áo Băng", "branch": "ice", "icon": "skill-ice-3", "every": [1500, 1200, 900],
                   "power": [8, 14, 20],
                   "text": ["Đỡ 1 đòn, 25 giây có lại", "20 giây có lại, vỡ ra đau hơn", "15 giây có lại, vỡ ra rất đau"]},
    "ice_hit": {"name": "Đòn Buốt", "branch": "ice", "icon": "skill-ice-2", "slow": [70, 100, 130], "power": [1, 2, 3],
                "text": ["Trúng đòn thì quái chậm 1 giây", "Chậm lâu hơn, đau hơn", "Chậm 2 giây, đau hơn nữa"]},
    "spark_jump": {"name": "Sét Nhảy", "branch": "spark", "icon": "skill-spark-2", "count": [2, 3, 4], "power": [4, 5, 7],
                   "text": ["Đòn đánh nhảy sang 2 quái nữa", "Nhảy sang 3 quái", "Nhảy sang 4 quái"]},
    "spark_cloud": {"name": "Mây Giông", "branch": "spark", "icon": "skill-spark-3", "every": [85, 65, 48],
                    "power": [8, 10, 12],
                    "text": ["Mây đi theo em, đánh sét xuống quái", "Sét nhanh hơn", "Sét rất nhanh, rất đau"]},
    "spark_trap": {"name": "Bẫy Điện", "branch": "spark", "icon": "skill-spark-4", "every": [180, 140, 100],
                   "power": [14, 18, 23],
                   "text": ["Thả bẫy, quái giẫm là nổ điện", "Thả bẫy nhanh hơn", "Nhiều bẫy, rất đau"]},
    "spark_fast": {"name": "Tay Chớp", "branch": "spark", "icon": "skill-spark-1", "faster": [0.82, 0.68, 0.55],
                   "text": ["Đánh nhanh hơn một chút", "Đánh nhanh hơn nữa", "Đánh nhanh như chớp"]},
    "heart": {"name": "Tim To", "branch": "common", "icon": "skill-common-1", "text": ["Thêm 25 máu, hồi 40 máu"] * 3},
    "boots": {"name": "Giày Gió", "branch": "common", "icon": "skill-common-2", "text": ["Đi nhanh, trúng đòn ít đau hơn"] * 3},
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
    "slash": {"frames": 8, "width": 48, "foot": 24, "hold": 4},
    "spark": {"frames": 9, "width": 48, "foot": 24, "hold": 3},
    "explosion": {"frames": 8, "width": 48, "foot": 24, "hold": 4},
    "poof": {"frames": 9, "width": 56, "foot": 32, "hold": 3},
    "pickup": {"frames": 9, "width": 48, "foot": 24, "hold": 3},
    "fire": {"frames": 9, "width": 48, "foot": 40, "hold": 4},
    "ice": {"frames": 10, "width": 56, "foot": 44, "hold": 4},
    "levelup": {"frames": 10, "width": 56, "foot": 54, "hold": 4},
    "heal": {"frames": 8, "width": 48, "foot": 42, "hold": 4},
}

# Đồ rơi trong thùng và rương: [ảnh, phóng to]
DROPS = {"heart": ["item-heart", 2], "magnet": ["skill-common-3", 1.75], "chest": ["item-chest", 2.5]}

TILE = 480          # nền lát bằng ảnh 160 điểm phóng to 3 lần
CELL = 48           # chia sân thành ô vuông để biết quái có vướng đồ không
BIRTH = 30          # quái mới ra chưa làm đau ai trong bấy nhiêu khung
SAFE = 28           # trúng đòn xong thì không mất máu nữa trong bấy nhiêu khung
WAIT = 25           # màn mới hiện ra thì chờ một chút mới nhận phím, kẻo bấm nhầm
MAX_LEVEL = 3
SLOTS = 6           # bộ skill có mấy ô. Thẻ nhánh Chung không chiếm ô
MAX_MOBS = 96       # đông quá thì chạy chậm
MAX_SHOTS = 40
MAX_GEMS = 120
MAX_ZONES = 28
MAX_EFFECTS = 40
KEYS = ["1", "2", "3", "space"]
U = HEIGHT / 540    # chữ và khung trên màn hình phóng theo màn: màn 1600 × 900 thì U = 1,67

# Ngọc kinh nghiệm có 3 bậc: đáng từ bấy nhiêu trở lên thì [màu quầng, phóng to]. Ngọc to nhìn từ xa đã thấy.
GEM_TIERS = [[12, "#ff5c8a", 2.4], [4, "#7dff6b", 1.9], [0, "#4fd8ff", 1.4]]
XP_FIRST = 8        # lên cấp 2 cần bấy nhiêu kinh nghiệm
XP_STEP = 5         # mỗi cấp sau cần thêm bấy nhiêu
XP_LATE = 2         # từ cấp 10 trở đi, mỗi cấp cần thêm nữa bấy nhiêu (lên cấp chậm dần)


# ---------- CÁC LOẠI VẬT TRONG GAME ----------

class Hero:
    def __init__(self, data):
        self.data = data
        self.x, self.y = 0, 0
        self.target = None              # chỗ em chỉ để đi tới: [x, y]
        self.moving = False
        self.look = "right"
        self.size = 11
        self.max_hp = self.hp = data["hp"]
        self.speed, self.power = data["speed"], data["power"]
        self.armor = 1                  # máu mất được nhân với số này
        self.magnet = 75
        self.gem_bonus = 1              # mỗi viên ngọc được nhân lên bấy nhiêu
        self.wait = 0                   # còn mấy khung nữa mới đánh tiếp
        self.safe_end = 0               # tới khung này thì hết được bảo vệ
        self.shield = False
        self.shield_wait = 0
        self.level, self.xp = 1, 0
        self.skills = {}                # tên skill: cấp


class Mob:
    def __init__(self, kind, x, y, tough, elite=False):
        self.kind, self.data = kind, MOBS[kind]
        self.x, self.y = x, y
        self.step_x, self.step_y = 0, 0     # mỗi khung đi bao nhiêu
        self.dir_x, self.dir_y = 0, 0       # hướng lao, dùng cho ma và trùm
        self.look = "left"
        self.elite = elite                  # quái to giữ rương
        self.size, self.scale = self.data["size"], self.data["scale"]
        self.boss = "boss" in self.data
        self.max_hp = self.hp = self.data["hp"]
        if not self.boss:                   # máu trùm ghi sẵn trong bảng, không nhân thêm
            self.max_hp = self.hp = self.data["hp"] * tough
        if elite:
            self.max_hp = self.hp = self.hp * 9 + 40
            self.size, self.scale = self.size * 1.6, self.scale * 1.75
        self.born = game["time"]
        self.beat = random_int(0, 59)       # để quái không cử động giống hệt nhau
        self.slow_end = self.stun_end = self.burn_end = self.flash_end = self.steam_end = 0
        self.alive = True


class Shot:
    # arrow, orb, plasma là của em; spore là của quái
    def __init__(self, kind, x, y, dir_x, dir_y, speed, power, life):
        self.kind, self.power = kind, power
        self.x, self.y = x, y
        self.dir_x, self.dir_y, self.speed = dir_x, dir_y, speed
        self.life = life
        self.done = []          # các con đã trúng mũi tên này
        self.alive = True


class Gem:
    def __init__(self, x, y, value):
        self.x, self.y, self.value = x, y, value
        self.fly = False        # đang bay về phía em
        self.speed = 2          # bay về càng lúc càng nhanh
        self.alive = True


class Drop:
    # box là thùng: chạm vào thì vỡ, rơi ra đồ. Còn lại là đồ để nhặt, xem bảng DROPS.
    def __init__(self, kind, x, y):
        self.kind = kind
        self.x, self.y = x, y
        self.alive = True


class Prop:
    # Cây, đá, cột... (x, y) là chân. solid: bán kính chắn đường, 0 là đi xuyên được.
    def __init__(self, image, scale, solid, x, y):
        self.image, self.scale, self.solid = image, scale, solid
        self.x, self.y = x, y


class Zone:
    # Thứ nằm trên đất: flame (than), trap (bẫy), hail (đá sắp rơi trúng quái), rock (đá sắp rơi trúng em)
    def __init__(self, kind, x, y, r, power, life):
        self.kind, self.r, self.power, self.life = kind, r, power, life
        self.x, self.y = x, y
        self.alive = True


class Effect:
    # Chỉ để nhìn: ảnh trong bảng FX, ring (vòng nở ra), bolt (tia sét từ x, y tới x2, y2), number (số bay lên, số nằm ở x2)
    def __init__(self, kind, x, y, scale, color, x2, y2):
        self.kind, self.scale, self.color = kind, scale, color
        self.x, self.y, self.x2, self.y2 = x, y, x2, y2
        self.age = 0
        self.life = 16
        if kind == "number":
            self.life = 32
        if kind in FX:
            self.life = FX[kind]["frames"] * FX[kind]["hold"]
        self.alive = True


game = {"state": "hero", "clock": 0, "time": 0, "floor": 0, "second": 0, "tick": 0, "kills": 0, "last_gem": 0,
        "last_bite": 0, "xp_shown": 0, "xp_glow": 0}
camera = {"x": 0, "y": 0}
world = {"w": WIDTH, "h": HEIGHT}
held = {}           # phím nào đang bị giữ
fresh = {}          # phím nào vừa mới bấm ở khung này
hero = Hero(HEROES[0])
mobs = []
shots = []
gems = []
drops = []
zones = []
effects = []
props = []          # cây, đá, cột trên sân
solids = []         # những món chắn đường
blocks = {}         # ô nào có món chắn đường: (cột, hàng): món đó
pools = []          # vũng: [x, y]
patches = []        # mảng nền: [x, y]
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
    far = (dx * dx + dy * dy) ** 0.5
    if far < 0.01:
        return 1, 0, far
    return dx / far, dy / far, far


def keep_inside(thing, edge):
    thing.x = max(edge, min(world["w"] - edge, thing.x))
    thing.y = max(edge, min(world["h"] - edge, thing.y))


def on_screen(thing, edge):
    return -edge < thing.x - camera["x"] < WIDTH + edge and -edge < thing.y - camera["y"] < HEIGHT + edge


def remove_dead(things):
    # things[:] = ... thay hết ruột của danh sách, chỉ giữ lại những thứ còn sống.
    things[:] = [thing for thing in things if thing.alive]


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
    return (136 + i * 128) * U


def picked_row():
    # Bé chọn hàng nào trong 3 hàng: 0, 1, 2. Chưa chọn thì None.
    if game["clock"] < WAIT:
        return None
    for i in range(3):
        if fresh[str(i + 1)]:
            return i
        if clicked() and 160 * U <= mouse_x() <= 800 * U and row_top(i) <= mouse_y() <= row_top(i) + 116 * U:
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
        hero.target = None      # bấm phím thì thôi đi theo chỗ chỉ
        if dx != 0 and dy != 0:
            step = step * 0.7   # đi chéo thì bước ngắn lại, kẻo nhanh hơn đi thẳng
    elif hero.target is not None:
        dx, dy, step = step_to_target()
    hero.moving = dx != 0 or dy != 0
    if dx > 0.1:
        hero.look = "right"
    elif dx < -0.1:
        hero.look = "left"
    if in_pool():
        if FLOORS[game["floor"]]["pools"][1] == "slow":
            step = step * 0.6
        elif game["time"] % 30 == 0:
            lose_hp(4)
    old_x, old_y = hero.x, hero.y
    hero.x = hero.x + dx * step
    hero.y = hero.y + dy * step
    go_around(hero)
    keep_inside(hero, 24)
    if stuck(hero):             # kẹt giữa hai món (khe hàng rào): đứng lại chỗ cũ
        hero.x, hero.y = old_x, old_y


def near_solids(x, y):
    # Những món chắn đường ở gần (x, y): mỗi ô vuông nhớ sẵn các món phủ lên nó.
    return blocks.get((x // CELL, y // CELL), [])


def go_around(thing):
    # Vướng cây, đá thì bị đẩy ra ngoài vòng tròn của nó, thành ra trượt quanh nó.
    # Làm 3 lượt, vì đẩy ra khỏi món này có thể đẩy vào món bên cạnh.
    for i in range(3):
        for prop in near_solids(thing.x, thing.y):
            dx, dy, far = direction(prop, thing)
            reach = prop.solid + thing.size
            if far < reach:
                thing.x = prop.x + dx * reach
                thing.y = prop.y + dy * reach


def stuck(thing):
    return any([distance(prop, thing) < prop.solid + thing.size - 0.5 for prop in near_solids(thing.x, thing.y)])


def in_pool():
    # Vũng hình bầu dục: ngang 80, dọc 52.
    return any([((hero.x - p[0]) / 80) ** 2 + ((hero.y + 12 - p[1]) / 52) ** 2 < 1 for p in pools])


def read_pointer():
    # Bấm hoặc giữ chuột trên sân: đi tới đó. Mới chọn thẻ xong thì chờ một chút, kẻo bấm đúp vào thẻ thành bấm vào sân.
    if clicked() and game["clock"] >= WAIT:
        game["pointing"] = True
    if not held["space"]:
        game["pointing"] = False
    if game["pointing"] or (clicked() and game["clock"] >= WAIT):
        x = mouse_x() + camera["x"]
        y = mouse_y() + camera["y"]
        hero.target = [max(24, min(world["w"] - 24, x)), max(24, min(world["h"] - 24, y))]


def step_to_target():
    dx = hero.target[0] - hero.x
    dy = hero.target[1] - hero.y
    far = (dx ** 2 + dy ** 2) ** 0.5
    if far <= hero.speed:           # bước cuối: tới đúng chỗ rồi dừng
        hero.target = None
        return dx, dy, 1
    return dx / far, dy / far, hero.speed


def move_camera():
    # Em ở giữa màn hình, trừ khi đã tới gần mép sân.
    camera["x"] = round(max(-40, min(world["w"] + 40 - WIDTH, hero.x - WIDTH / 2)))
    camera["y"] = round(max(-70, min(world["h"] + 60 - HEIGHT, hero.y - HEIGHT / 2)))


def targets():
    # Quái đã ra hẳn và còn sống: đánh được.
    ready = game["time"] - BIRTH
    return [mob for mob in mobs if mob.hp > 0 and mob.born <= ready]


def nearest_mob(x, y, reach, skip):
    # Ghi (bình phương khoảng cách, số thứ tự) của từng con trong tầm, rồi lấy cặp nhỏ nhất.
    ready = targets()
    far = [((mob.x - x) ** 2 + (mob.y - y) ** 2, i) for i, mob in enumerate(ready)
           if mob not in skip and (mob.x - x) ** 2 + (mob.y - y) ** 2 < (reach + mob.size) ** 2]
    if len(far) == 0:
        return None
    return ready[min(far)[1]]


def mobs_near(x, y, r):
    return [mob for mob in targets() if (mob.x - x) ** 2 + (mob.y - y) ** 2 < (r + mob.size) ** 2]


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
        add(shots, Shot(hero.data["attack"], hero.x, hero.y, dx, dy, SHOT_SPEED, hero.power, 120), MAX_SHOTS)


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
    # Đòn đánh thường: đẩy lùi quái, ngoài sát thương còn kèm các skill "Trúng đòn thì..."
    hurt(mob, power, "common")
    add_effect("hit", mob.x, mob.y)
    if not mob.boss:
        dx, dy, far = direction(hero, mob)
        mob.x = mob.x + dx * 7
        mob.y = mob.y + dy * 7
        keep_inside(mob, 8)
    if level_of("fire_hit") > 0:
        mob.burn_end = game["time"] + 120
    if level_of("ice_hit") > 0:
        hurt(mob, value("ice_hit", "power"), "ice")
        mob.slow_end = max(mob.slow_end, game["time"] + value("ice_hit", "slow"))
    if level_of("spark_jump") > 0 and can_jump:
        spark_jump(mob)


def hurt_hero(bite):
    if game["time"] < hero.safe_end:
        return
    hero.safe_end = game["time"] + SAFE
    if hero.shield:
        hero.shield = False
        hero.shield_wait = value("ice_shield", "every")
        hero.safe_end = game["time"] + SAFE * 2
        blast(hero.x, hero.y, 110, value("ice_shield", "power"), "ice", 120)
        return
    lose_hp(bite)


def lose_hp(bite):
    hero.hp = max(0, hero.hp - max(1, round(bite * hero.armor)))
    add_effect("number", hero.x, hero.y - 24, 24, "#ff7a7a", "-" + str(max(1, round(bite * hero.armor))))
    if game["time"] - game["last_bite"] >= 30:
        game["last_bite"] = game["time"]
        play_sound("hit")


def heal(amount):
    hero.hp = min(hero.max_hp, hero.hp + amount)
    add_effect("heal", hero.x, hero.y + 16, 1.5)


def xp_needed():
    # Cấp càng cao càng cần nhiều kinh nghiệm. Từ cấp 10 còn tăng nhanh hơn nữa.
    return XP_FIRST + (hero.level - 1) * XP_STEP + max(0, hero.level - 9) * (hero.level - 9) * XP_LATE


# ---------- SKILL ----------

def hurt(mob, power, branch):
    now = game["time"]
    if now - mob.born < BIRTH or mob.hp <= 0:
        return
    if branch == "fire" and "ember" in combos:
        power = power * 1.4
    if mob.slow_end > now:
        if "chill" in combos:
            power = power * 1.2
        if branch == "spark" and "conduct" in combos:
            power = power * 1.5
    if branch == "spark" and "stun" in combos:
        mob.stun_end = now + 20
    mob.hp = mob.hp - power
    mob.flash_end = now + 5
    if power >= 1:
        add_effect("number", mob.x, mob.y - mob.size - 6, 18, BRANCHES[branch]["color"], str(round(power)))
    if branch == "fire" and mob.slow_end > now and mob.steam_end <= now and "steam" in combos:
        mob.steam_end = now + 60        # nghỉ 1 giây, kẻo lửa cháy liên tục thì nổ hoài
        blast(mob.x, mob.y, 60, 6, "steam", 0)


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
    kind = branch
    if branch == "steam":
        kind = "common"         # hơi nước không phải lửa, kẻo nổ dây chuyền mãi
    for mob in mobs_near(x, y, r):
        hurt(mob, power, kind)
        if slow > 0:
            mob.slow_end = max(mob.slow_end, game["time"] + slow)
            add_effect("ice", mob.x, mob.y + mob.size)


def strike(x, y, mob, power):
    add_effect("bolt", x, y, 1, BRANCHES["spark"]["color"], mob.x, mob.y)
    add_effect("spark", mob.x, mob.y)
    hurt(mob, power, "spark")


def spark_jump(mob):
    done = [mob]
    for i in range(value("spark_jump", "count")):
        last = done[-1]
        target = nearest_mob(last.x, last.y, 130, done)
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
            angle = game["time"] * 0.04 + i * 2 * pi / count
            spots.append([hero.x + cos(angle) * 74, hero.y + sin(angle) * 74])
    return spots


def use_skills():
    if game["time"] % 14 == 0:
        for spot in ember_spots():
            for mob in mobs_near(spot[0], spot[1], 18):
                hurt(mob, value("fire_orbit", "power"), "fire")
    if is_time("fire_trail"):
        add(zones, Zone("flame", hero.x, hero.y, 26, value("fire_trail", "power"), 200), MAX_ZONES)
    if is_time("ice_rain"):
        seen = [mob for mob in targets() if on_screen(mob, 0)]
        if len(seen) > 0:
            mob = seen[random_int(0, len(seen) - 1)]
            add(zones, Zone("hail", mob.x, mob.y, 52, value("ice_rain", "power"), 30), MAX_ZONES)
    if is_time("ice_ring"):
        blast(hero.x, hero.y, value("ice_ring", "radius"), value("ice_ring", "power"), "ice", 120)
    if level_of("ice_shield") > 0 and not hero.shield:
        hero.shield_wait = hero.shield_wait - 1
        if hero.shield_wait <= 0:
            hero.shield = True
    if is_time("spark_cloud"):
        mob = nearest_mob(hero.x, hero.y, 380, [])
        if mob is not None:
            strike(hero.x, hero.y - 45, mob, value("spark_cloud", "power"))
    if is_time("spark_trap"):
        add(zones, Zone("trap", hero.x, hero.y, 64, value("spark_trap", "power"), 700), MAX_ZONES)
    if "plasma" in combos and game["time"] % 300 == 0:
        for i in range(8):
            angle = i * pi / 4
            add(shots, Shot("plasma", hero.x, hero.y, cos(angle), sin(angle), 3.2, 9, 130), MAX_SHOTS)


def update_zone(zone):
    zone.life = zone.life - 1
    if zone.kind == "flame" and zone.life % 25 == 0:
        for mob in mobs_near(zone.x, zone.y, zone.r):
            hurt(mob, zone.power, "fire")
    if zone.kind == "trap" and zone.life % 6 == 0 and len(mobs_near(zone.x, zone.y, 22)) > 0:
        blast(zone.x, zone.y, zone.r, zone.power, "spark", 0)
        zone.life = 0
    if zone.kind == "hail" and zone.life == 0:
        blast(zone.x, zone.y, zone.r, zone.power, "ice", 80)
    if zone.kind == "rock" and zone.life == 0:
        add_effect("poof", zone.x, zone.y, zone.r / 40)
        if distance(zone, hero) < zone.r:
            hurt_hero(zone.power)
    zone.alive = zone.life > 0


# ---------- QUÁI VÀ TRÙM ----------

def outside_point():
    # Một chỗ ngay ngoài màn hình mà vẫn trong sân. Thử vài lần, vì em đứng gần mép thì có phía không còn sân.
    x, y = 0, 0
    for i in range(10):
        side = random_int(1, 4)
        x = camera["x"] + random_int(-30, WIDTH + 30)
        y = camera["y"] + random_int(-30, HEIGHT + 30)
        if side == 1:
            x = camera["x"] - 40
        elif side == 2:
            x = camera["x"] + WIDTH + 40
        elif side == 3:
            y = camera["y"] - 40
        else:
            y = camera["y"] + HEIGHT + 40
        if 20 < x < world["w"] - 20 and 20 < y < world["h"] - 20:
            return x, y
    return x, y


def spawn_mob(kind, elite=False):
    x, y = outside_point()
    mob = Mob(kind, x, y, FLOORS[game["floor"]]["tough"], elite)
    keep_inside(mob, 20)
    if elite or mob.boss:           # con quan trọng thì luôn có chỗ: bớt đi một quái thường
        if len(mobs) >= MAX_MOBS:
            mobs.pop(0)
        mobs.append(mob)
    else:
        add(mobs, mob, MAX_MOBS)
    return mob


def update_mobs():
    now = game["time"]
    for mob in mobs[:]:
        if mob.burn_end > now and (now + mob.beat) % 30 == 0:
            hurt(mob, value("fire_hit", "power"), "fire")
        if mob.stun_end > now and not mob.boss:     # trùm không đứng hình
            continue
        if mob.boss:
            steer_boss(mob, now)
        elif (now + mob.beat) % 3 == 0:             # 3 khung mới nghĩ một lần, cho nhẹ máy
            steer(mob, now)
        mob.x = mob.x + mob.step_x
        mob.y = mob.y + mob.step_y
        if abs(mob.x - hero.x) < mob.size + 7 and abs(mob.y - hero.y) < mob.size + 7 and now - mob.born > BIRTH:
            hurt_hero(mob.data["bite"])


def steer(mob, now):
    # Quái thường: tính xem mấy khung tới đi về hướng nào.
    dx, dy, far = direction(mob, hero)
    if far > WIDTH * 0.8:               # bị bỏ xa quá: vòng ra phía khác, kẻo em chạy thẳng là thoát hết
        mob.x, mob.y = outside_point()
        keep_inside(mob, 20)
        return
    speed = mob.data["speed"] * FLOORS[game["floor"]]["pace"]
    if mob.slow_end > now:
        speed = speed * 0.5
    move = mob.data["move"]
    if move == "zigzag":
        side = (now + mob.beat) // 45 % 2 * 2 - 1
        dx, dy = dx - dy * side * 0.7, dy + dx * side * 0.7
        speed = speed * 0.85
    elif move == "shoot":
        speed = aim_spores(mob, now, dx, dy, far, speed)
    elif move == "dash":
        dx, dy, speed = aim_dash(mob, now, dx, dy, speed)
    mob.step_x = dx * speed
    mob.step_y = dy * speed
    if dx > 0.2:
        mob.look = "right"
    elif dx < -0.2:
        mob.look = "left"
    push_apart(mob)
    if "fly" not in mob.data:
        walk_around(mob)
    keep_inside(mob, 8)


def aim_spores(mob, now, dx, dy, far, speed):
    # Nấm: tới gần thì đứng lại, lâu lâu phun một viên bào tử.
    if (now + mob.beat) % 270 < 3 and far < 460:
        add(shots, Shot("spore", mob.x, mob.y, dx, dy, 1.3, mob.data["bite"], 300), MAX_SHOTS)
    if far < 220:
        return 0
    return speed


def aim_dash(mob, now, dx, dy, speed):
    # Ma: đi chậm, dừng lại ngắm, rồi lao thẳng.
    beat = (now + mob.beat) % 240
    if beat < 150:
        mob.dir_x, mob.dir_y = dx, dy
        return dx, dy, speed
    if beat < 190:
        return mob.dir_x, mob.dir_y, 0
    return mob.dir_x, mob.dir_y, speed * 3


def push_apart(mob):
    # Đứng chồng lên con khác thì nhích ra, để em đếm được có mấy con.
    near = [b for b in mobs if abs(b.x - mob.x) < 20 and abs(b.y - mob.y) < 20 and b is not mob]
    if len(near) > 0:
        dx, dy, far = direction(near[0], mob)
        mob.step_x = mob.step_x + dx * 0.5
        mob.step_y = mob.step_y + dy * 0.5


def walk_around(mob):
    # Ô này có cây, đá: bỏ phần đang đâm thẳng vào nó, rồi lách sang một bên.
    # Lách về phía gần em hơn, để quái không đi vòng mãi sau hàng rào.
    for prop in near_solids(mob.x, mob.y):
        dx, dy, far = direction(prop, mob)
        if far < prop.solid + mob.size:
            inward = min(0, mob.step_x * dx + mob.step_y * dy)
            side = 1
            if (hero.x - mob.x) * -dy + (hero.y - mob.y) * dx < 0:
                side = -1
            mob.step_x = mob.step_x - inward * dx + dx * 0.25 - dy * 0.35 * side
            mob.step_y = mob.step_y - inward * dy + dy * 0.25 + dx * 0.35 * side


def steer_boss(mob, now):
    dx, dy, far = direction(mob, hero)
    speed = mob.data["speed"]
    if far > 560:
        speed = speed * 1.8             # bị bỏ xa thì trùm chạy theo
    if mob.slow_end > now:
        speed = speed * 0.8             # trùm khỏe nên chỉ chậm một chút
    if dx > 0.2:
        mob.look = "right"
    elif dx < -0.2:
        mob.look = "left"
    move = mob.data["move"]
    beat = now - mob.born
    if move == "hop":
        boss_hop(mob, beat % 150, dx, dy, speed)
    elif move == "ring":
        boss_ring(mob, beat, dx, dy, speed)
    else:
        boss_charge(mob, beat % 230, dx, dy, speed)
    keep_inside(mob, 8 * mob.scale)


def go(mob, dx, dy, speed):
    mob.step_x = dx * speed
    mob.step_y = dy * speed


def boss_hop(mob, beat, dx, dy, speed):
    # Rồng Nhớt: ngồi im lấy đà, nhảy tới chỗ em, đáp xuống thì đẻ 2 nhớt con.
    if beat < 90:
        go(mob, 0, 0, 0)
    elif beat == 90:
        mob.dir_x, mob.dir_y = dx, dy
        go(mob, dx, dy, speed)
    elif beat == 149:
        add(zones, Zone("rock", mob.x, mob.y, 95, mob.data["bite"], 1), MAX_ZONES)
        for shift in [-34, 34]:
            small = Mob("slime", mob.x + shift, mob.y, 1)
            keep_inside(small, 20)
            add(mobs, small, MAX_MOBS)


def boss_ring(mob, beat, dx, dy, speed):
    # Người Tuyết: đi chậm, cứ một lúc lại bắn một vòng đạn. Mỗi vòng xoay lệch để khe hở đổi chỗ.
    go(mob, dx, dy, speed)
    if beat % 150 == 149:
        for i in range(12):
            angle = i * 2 * pi / 12 + beat
            add(shots, Shot("spore", mob.x, mob.y, cos(angle), sin(angle), 1.4, 9, 320), MAX_SHOTS)


def boss_charge(mob, beat, dx, dy, speed):
    # Vua Dung Nham: đi bộ, ngắm (hiện vạch đỏ), húc thẳng, rồi đá rơi quanh em. Còn nửa máu thì đá rơi nhiều hơn.
    if beat < 90:
        go(mob, dx, dy, speed)
    elif beat < 105:
        mob.dir_x, mob.dir_y = dx, dy
        go(mob, 0, 0, 0)
    elif beat == 145:
        go(mob, mob.dir_x, mob.dir_y, 4.4)
    elif beat == 190:
        go(mob, 0, 0, 0)
        rocks = 4
        if mob.hp < mob.max_hp / 2:
            rocks = 7
        for i in range(rocks):
            rock = Zone("rock", hero.x + random_int(-130, 130), hero.y + random_int(-130, 130), 46, 14, 75)
            keep_inside(rock, 20)
            add(zones, rock, MAX_ZONES)


def bury_dead():
    for mob in [m for m in mobs if m.hp <= 0]:
        mob.alive = False
        game["kills"] = game["kills"] + 1
        worth = mob.data["xp"] * FLOORS[game["floor"]]["gems"]
        if mob.elite:
            worth = worth * 6       # quái to cho ngọc to
        drop_gem(mob.x, mob.y, worth)
        if mob.elite:
            drops.append(Drop("chest", mob.x, mob.y))
        if level_of("fire_boom") > 0:
            blast(mob.x, mob.y, value("fire_boom", "radius"), value("fire_boom", "power"), "fire", 0)
        else:
            add_effect("poof", mob.x, mob.y, mob.size / 16)
        if mob.boss:
            finish_floor()
    remove_dead(mobs)


# ---------- NGỌC, THÙNG, RƯƠNG ----------

def drop_gem(x, y, amount):
    if len(gems) < MAX_GEMS:
        gems.append(Gem(x, y, amount))
    else:
        gems[0].value = gems[0].value + amount      # sân đầy ngọc: gộp vào viên cũ, em không mất kinh nghiệm


def update_gems():
    reach = hero.magnet
    for gem in [g for g in gems if g.fly or (abs(g.x - hero.x) < reach and abs(g.y - hero.y) < reach)]:
        dx, dy, far = direction(gem, hero)
        if far < reach:
            gem.fly = True
        if gem.fly:                 # bay chậm rồi nhanh dần, như bị hút
            gem.speed = min(14, gem.speed + 0.5)
            gem.x = gem.x + dx * min(gem.speed, far)
            gem.y = gem.y + dy * min(gem.speed, far)
        if far < 18:
            take_gem(gem)


def take_gem(gem):
    gem.alive = False
    hero.xp = hero.xp + gem.value * hero.gem_bonus
    game["xp_glow"] = 12            # thanh kinh nghiệm sáng lên một chút
    if game["time"] - game["last_gem"] >= 24:       # nhặt cả nắm thì chỉ kêu và lóe một lần
        game["last_gem"] = game["time"]
        play_sound("point")
        add_effect("pickup", hero.x, hero.y)


def update_drops():
    for drop in [d for d in drops if abs(d.x - hero.x) < 30 and abs(d.y - hero.y) < 30]:
        drop.alive = False
        if drop.kind == "box":
            open_box(drop)
        elif drop.kind == "heart":
            heal(30)
            play_sound("point")
        elif drop.kind == "magnet":
            for gem in gems:
                gem.fly = True
            announce("Nam châm: ngọc cả sân bay về em!")
            play_sound("win")
        else:
            open_chest()


def open_box(box):
    add_effect("poof", box.x, box.y, 1)
    play_sound("click")
    luck = random_int(1, 10)
    if luck <= 4:
        drops.append(Drop("heart", box.x + 34, box.y))
    elif luck <= 6:
        drops.append(Drop("magnet", box.x + 34, box.y))
    else:
        for shift in [-24, 0, 24]:
            drop_gem(box.x + shift, box.y + 34, 2)


def open_chest():
    # Rương: một skill em đang có lên thêm cấp. Không còn skill nào lên được thì hồi máu.
    play_sound("win")
    ready = [name for name in hero.skills if level_of(name) < MAX_LEVEL]
    if len(ready) == 0:
        heal(40)
        announce("Rương: hồi 40 máu")
        return
    name = ready[random_int(0, len(ready) - 1)]
    take_card(name)
    announce("Rương: " + SKILLS[name]["name"] + " lên cấp " + str(level_of(name)) + "!")


def update_shot(shot):
    shot.x = shot.x + shot.dir_x * shot.speed
    shot.y = shot.y + shot.dir_y * shot.speed
    shot.life = shot.life - 1
    if shot.life <= 0 or not on_screen(shot, 60):
        shot.alive = False
    elif shot.kind == "spore":
        if abs(shot.x - hero.x) < 14 and abs(shot.y - hero.y) < 14:
            shot.alive = False
            hurt_hero(shot.power)
    else:
        touched = [m for m in mobs if abs(m.x - shot.x) < m.size + 6 and abs(m.y - shot.y) < m.size + 6 and m.hp > 0]
        for mob in touched:
            if shot.alive and mob not in shot.done and game["time"] - mob.born >= BIRTH:
                hit_with_shot(shot, mob)


def hit_with_shot(shot, mob):
    shot.done.append(mob)
    shot.alive = shot.kind == "arrow" and len(shot.done) < PIERCE       # mũi tên xuyên qua vài con
    if shot.kind == "plasma":
        hurt(mob, shot.power, "fire")
        hurt(mob, shot.power, "spark")
        add_effect("hit", mob.x, mob.y)
        return
    hit(mob, shot.power, len(shot.done) == 1)
    if shot.kind == "orb":          # đạn phép nổ lan: các quái đứng gần cũng bị đau
        add_effect("ring", shot.x, shot.y, 62, hero.data["color"])
        for other in mobs_near(shot.x, shot.y, 62):
            if other is not mob:
                hit(other, shot.power * 0.75, False)


# ---------- SÂN ----------

def build_floor(floor):
    # Rải đồ lên sân: vũng, đồ đặt sẵn giữa sân, tường và cụm cây, rồi cây cỏ lẻ (ô vuông 150, mỗi ô nhiều nhất
    # một món, xê dịch ngẫu nhiên cho tự nhiên).
    world["w"], world["h"] = floor["world"]
    for things in [props, solids, pools, patches]:
        things.clear()
    blocks.clear()
    mid_x, mid_y = world["w"] / 2, world["h"] / 2
    for i in range(floor["pools"][2]):
        scatter(pools, mid_x, mid_y)
    for i in range(world["w"] * world["h"] // 220000):
        patches.append([random_int(120, world["w"] - 120), random_int(100, world["h"] - 100)])
    for mark in floor["marks"]:
        add_prop(Prop(mark[0], mark[1], mark[2], mid_x + mark[3], mid_y + mark[4]))
    if floor["pools"][0] == "deco-pond":
        for pool in pools:
            add_prop(Prop("deco-lotus", 1.5, 0, pool[0] + random_int(-30, 30), pool[1] + random_int(-8, 24)))
    for pool in pools:                          # quanh vũng có lau sậy, nấm hoặc đá
        for i in range(3):
            angle = random_int(0, 628) / 100
            add_prop(Prop(floor["rim"], 2, 0, pool[0] + cos(angle) * 98, pool[1] + sin(angle) * 66 + 12))
    for row in floor["walls"]:
        for i in range(row[3]):
            build_wall(row, mid_x, mid_y)
    for row in floor["clumps"]:
        for i in range(row[3]):
            build_clump(row, mid_x, mid_y)
    names = []
    for row in floor["props"]:
        names.extend([row] * row[3])            # số cuối to thì tên đó nằm trong hộp nhiều lần, dễ bốc trúng
    for left in range(60, world["w"] - 100, 150):
        for top in range(80, world["h"] - 100, 150):
            x = left + random_int(0, 80)
            y = top + random_int(0, 80)
            row = names[random_int(0, len(names) - 1)]
            if random_int(1, 10) <= floor["thick"] and is_free(x, y, mid_x, mid_y):
                add_prop(Prop(row[0], row[1], row[2], x, y))
    plant_edge(floor["edge"])
    for i in range(14):
        add_box()


def build_wall(row, mid_x, mid_y):
    # Một bức tường: các món xếp sát nhau thành hàng thẳng, ngang, dọc hay chéo, có khi gấp khúc chữ L.
    # Khe giữa hai món hẹp hơn em, nên phải đi vòng. Thử vài chỗ, chỗ nào vướng thì bỏ.
    image, scale, solid, count, shortest, longest = row
    step = solid * 2 + 8
    turns = [[1, 0], [0, 1], [0.7, 0.7], [0.7, -0.7]]
    for attempt in range(12):
        length = random_int(shortest, longest)
        dx, dy = turns[random_int(0, 3)]
        x, y = random_int(200, world["w"] - 200), random_int(200, world["h"] - 200)
        bend = length + 1
        if random_int(1, 10) <= 4:
            bend = length // 2          # gấp khúc ở giữa: quay 90 độ
        spots = []
        for i in range(length):
            if i == bend:
                dx, dy = -dy, dx
            spots.append([x, y])
            x, y = x + dx * step, y + dy * step
        inside = all([150 < s[0] < world["w"] - 150 and 150 < s[1] < world["h"] - 150 for s in spots])
        if inside and all([is_free(s[0], s[1], mid_x, mid_y) for s in spots]):
            for s in spots:
                add_prop(Prop(image, scale, solid, s[0], s[1]))
            return


def build_clump(row, mid_x, mid_y):
    # Một cụm cây (đá) chen nhau: giữa cụm không đi qua được, quanh cụm vẫn có lối.
    images, scale, solid, count = row
    for attempt in range(12):
        x, y = random_int(220, world["w"] - 220), random_int(220, world["h"] - 220)
        if not is_free(x, y, mid_x, mid_y):
            continue
        add_prop(Prop(images[0], scale, solid, x, y))
        for i in range(random_int(4, 8)):
            angle = random_int(0, 628) / 100
            far = random_int(solid * 2, solid * 5)
            px, py = x + cos(angle) * far, y + sin(angle) * far
            if not any([abs(px - p[0]) < 120 and abs(py - p[1]) < 90 for p in pools]) and \
                    all([(p.x - px) ** 2 + (p.y - py) ** 2 >= (solid * 1.6) ** 2 for p in near_solids(px, py)]):
                add_prop(Prop(images[random_int(0, len(images) - 1)], scale, solid, px, py))
        return


def scatter(spots, mid_x, mid_y):
    # Tìm một chỗ xa giữa sân và xa các vũng đã có.
    for i in range(20):
        x = random_int(160, world["w"] - 160)
        y = random_int(140, world["h"] - 140)
        if abs(x - mid_x) + abs(y - mid_y) > 520 and all([abs(x - s[0]) + abs(y - s[1]) > 360 for s in spots]):
            spots.append([x, y])
            return


def is_free(x, y, mid_x, mid_y):
    # Giữa sân để trống cho em đứng lúc mới vào; không đặt đồ lên vũng hay sát món khác.
    if ((x - mid_x) ** 2 + (y - mid_y) ** 2) ** 0.5 < 260:
        return False
    if any([abs(x - p[0]) < 120 and abs(y - p[1]) < 90 for p in pools]):
        return False
    return not any([abs(x - p.x) < 60 and abs(y - p.y) < 60 for p in solids])


def add_prop(prop):
    # Món chắn đường thì ghi vào mọi ô vuông nó phủ lên, để tìm món ở gần cho nhanh.
    props.append(prop)
    if prop.solid == 0:
        return
    solids.append(prop)
    reach = prop.solid + 18
    for column in range(int((prop.x - reach) // CELL), int((prop.x + reach) // CELL) + 1):
        for line in range(int((prop.y - reach) // CELL), int((prop.y + reach) // CELL) + 1):
            if (column, line) not in blocks:
                blocks[(column, line)] = []
            blocks[(column, line)].append(prop)


def plant_edge(images):
    # Hàng cây (đá) bao quanh sân, để em thấy tới đâu là hết.
    for x in range(-40, world["w"] + 60, 62):
        add_prop(Prop(images[x // 62 % 2], 5, 0, x, 0))
        add_prop(Prop(images[x // 62 % 2], 5, 0, x + 30, world["h"] + 50))
    for y in range(50, world["h"] + 20, 62):
        add_prop(Prop(images[y // 62 % 2], 5, 0, -20, y))
        add_prop(Prop(images[y // 62 % 2], 5, 0, world["w"] + 20, y))


def add_box():
    # Thùng rơi chỗ trống, không lọt vào giữa cụm cây.
    if len(drops) >= 16:
        return
    for i in range(10):
        x, y = random_int(80, world["w"] - 80), random_int(100, world["h"] - 80)
        if not any([abs(p.x - x) < p.solid + 40 and abs(p.y - y) < p.solid + 40 for p in solids]):
            drops.append(Drop("box", x, y))
            return


# ---------- ĐỢT, ẢI, LÊN CẤP ----------

def start_game(number):
    global hero
    hero = Hero(HEROES[number])
    combos.clear()
    banners.clear()
    game["time"] = 0
    game["kills"] = 0
    game["last_gem"] = 0
    game["last_bite"] = 0
    game["xp_shown"] = 0
    start_floor(0)


def start_floor(number):
    for things in [mobs, shots, gems, drops, zones, effects]:
        things.clear()
    game["floor"] = number
    game["second"] = 0
    game["tick"] = 0
    game["boss_out"] = False
    game["floor_done"] = False
    game["pointing"] = False
    build_floor(FLOORS[number])
    hero.x = world["w"] / 2
    hero.y = world["h"] / 2
    hero.target = None
    hero.safe_end = game["time"] + SAFE * 2
    move_camera()
    announce("Ải " + str(number + 1) + ": " + FLOORS[number]["name"])
    play_music("happy")
    open_screen("play")


def current_wave():
    # Đợt cuối cùng đã tới giờ.
    return [wave for wave in FLOORS[game["floor"]]["waves"] if wave[0] <= game["second"]][-1]


def pick_kind(kinds):
    names = []
    for kind in kinds:
        names.extend([kind] * kinds[kind])
    return names[random_int(0, len(names) - 1)]


def run_waves():
    game["tick"] = game["tick"] + 1
    if game["tick"] % 60 == 0:
        game["second"] = game["second"] + 1
        every_second(FLOORS[game["floor"]])
    wave = current_wave()
    gap, least = wave[2], wave[3]
    if game["boss_out"]:            # có trùm thì quái con ra thưa đi
        gap, least = gap * 2, least // 3
    if game["tick"] % gap == 0 or (game["tick"] % 10 == 0 and len(mobs) < least):
        spawn_mob(pick_kind(wave[1]))


def every_second(floor):
    second = game["second"]
    if second == floor["length"]:
        game["boss_out"] = True
        spawn_mob(floor["boss"])
        announce("Trùm: " + MOBS[floor["boss"]]["boss"] + "!")
        play_sound("fall")
        play_music("adventure")
    if game["boss_out"]:
        return
    for swarm in floor["swarms"]:
        if swarm[0] == second:
            announce("Cả bầy kéo tới!")
            for i in range(swarm[2]):
                spawn_mob(swarm[1])
    for elite in floor["elites"]:
        if elite[0] == second:
            announce("Quái to giữ rương!")
            spawn_mob(elite[1], True)
    if second % 20 == 0:
        add_box()


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
        if game["floor"] + 1 < len(FLOORS):
            open_screen("next")
        else:
            open_screen("win")
            stop_music()
        play_sound("win")


def level_up():
    # Dư kinh nghiệm thì giữ lại. Đủ lên thêm cấp nữa thì khung sau lại vào đây.
    hero.xp = hero.xp - xp_needed()
    hero.level = hero.level + 1
    game["xp_shown"] = 0
    deal_cards()
    if len(cards) == 0:             # đã có hết mọi thẻ: hồi máu thay cho thẻ
        heal(15)
    else:
        open_screen("cards")
        play_sound("win")


def slots_used():
    return len([name for name in hero.skills if SKILLS[name]["branch"] != "common"])


def can_take(name):
    # Hết ô thì chỉ được nâng các skill đang có, nên phải chọn kỹ.
    if level_of(name) >= MAX_LEVEL:
        return False
    return level_of(name) > 0 or SKILLS[name]["branch"] == "common" or slots_used() < SLOTS


def deal_cards():
    cards.clear()
    pool = [name for name in SKILLS if can_take(name)]
    while len(pool) > 0 and len(cards) < 3:
        cards.append(pool.pop(random_int(0, len(pool) - 1)))    # rút ra khỏi pool nên 3 thẻ không trùng nhau


def take_card(name):
    hero.skills[name] = level_of(name) + 1
    add_effect("levelup", hero.x, hero.y + 16, 1.5)
    if name == "heart":
        hero.max_hp = hero.max_hp + 25
        heal(40)
    if name == "boots":
        hero.speed = hero.speed + 0.2
        hero.armor = hero.armor * 0.88
    if name == "magnet":
        hero.magnet = hero.magnet + 70
        hero.gem_bonus = hero.gem_bonus + 0.15
    if name == "muscle":
        hero.power = hero.power + 4
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
            heal(50)
    elif wants_next():              # win hoặc lose
        open_screen("hero")
        play_music("calm")


def update_play():
    game["time"] = game["time"] + 1
    read_pointer()
    move_hero()
    move_camera()
    run_waves()
    attack()
    use_skills()
    update_mobs()
    for zone in zones[:]:
        update_zone(zone)
    for shot in shots[:]:
        update_shot(shot)
    update_gems()
    update_drops()
    update_effects()
    bury_dead()
    for things in [shots, zones, gems, drops, effects]:
        remove_dead(things)
    # Thanh kinh nghiệm đuổi theo số thật cho mượt, và sáng lên một lúc khi nhặt ngọc.
    game["xp_shown"] = game["xp_shown"] + (min(1, hero.xp / xp_needed()) - game["xp_shown"]) * 0.2
    game["xp_glow"] = max(0, game["xp_glow"] - 1)
    if len(banners) > 0:
        banners[0][1] = banners[0][1] - 1
        if banners[0][1] <= 0:
            banners.pop(0)
    check_end()


def update_effects():
    for effect in effects:
        effect.age = effect.age + 1
        effect.alive = effect.age < effect.life
        if effect.kind == "levelup" or effect.kind == "heal":       # hai thứ này đi theo chân em
            effect.x, effect.y = hero.x, hero.y + 16


# ---------- VẼ ----------

def draw_sprite(name, x, y, scale, mirror=False):
    # Ảnh vuông 16 điểm, (x, y) là giữa ảnh, tính trên màn hình.
    draw_image("images/" + name + ".png", x - 8 * scale, y - 8 * scale, scale=scale, mirror=mirror)


def draw_ground():
    floor = FLOORS[game["floor"]]
    left, top = camera["x"], camera["y"]
    path = "images/" + floor["ground"] + ".png"
    for column in range(left // TILE, (left + WIDTH) // TILE + 1):
        for line in range(top // TILE, (top + HEIGHT) // TILE + 1):
            # Nhích 1 điểm cho hai miếng đè mép lên nhau, không hở đường chỉ.
            draw_image(path, column * TILE - left - 0.5, line * TILE - top - 0.5, scale=3.01)
    for patch in patches:
        if -120 < patch[0] - left < WIDTH + 120 and -80 < patch[1] - top < HEIGHT + 80:
            draw_image("images/" + floor["patch"] + ".png", patch[0] - left - 112, patch[1] - top - 77, scale=3.5)
    for pool in pools:
        if -110 < pool[0] - left < WIDTH + 110 and -80 < pool[1] - top < HEIGHT + 80:
            draw_image("images/" + floor["pools"][0] + ".png", pool[0] - left - 96, pool[1] - top - 66,
                       frame=game["time"] // 30 % 2, scale=3)
            if floor["pools"][0] in GLOWS:
                draw_glow(GLOWS[floor["pools"][0]], pool[0] - left, pool[1] - top, pool[0])
    draw_outside(floor["outside"])


def draw_outside(color):
    # Phần ngoài sân: tô tối.
    left, top = camera["x"], camera["y"]
    if left < 0:
        draw_rect(0, 0, -left, HEIGHT, color)
    if top < 0:
        draw_rect(0, 0, WIDTH, -top, color)
    if left + WIDTH > world["w"]:
        draw_rect(world["w"] - left, 0, left + WIDTH - world["w"], HEIGHT, color)
    if top + HEIGHT > world["h"]:
        draw_rect(0, world["h"] - top, WIDTH, top + HEIGHT - world["h"], color)


def draw_standing():
    # Cây và quái: ai đứng thấp hơn trên màn hình (y to hơn) thì vẽ sau, để che người đứng sau.
    # Em thì vẽ sau cùng, để không bao giờ bị cây che mất.
    left, top = camera["x"], camera["y"]
    rows = [(p.y, i, p) for i, p in enumerate(props)
            if -50 < p.x - left < WIDTH + 50 and -20 < p.y - top < HEIGHT + 90]
    rows.extend([(m.y + m.size, 1000 + i, m) for i, m in enumerate(mobs) if on_screen(m, 60)])
    rows.sort()
    for y, i, thing in rows:
        if i < 1000:
            draw_prop(thing, thing.x - left, thing.y - top)
        else:
            draw_mob(thing, thing.x - left, thing.y - top)
    draw_hero()


def draw_glow(glow, x, y, shift):
    # Quầng sáng phập phồng nhẹ. "shift" để mỗi quầng phập phồng một lúc khác nhau.
    size = glow[1] * (1 + sin(game["time"] * 0.05 + shift) * 0.04)
    draw_image("images/" + glow[0] + ".png", x - 32 * size, y - 32 * size, scale=size)


def draw_prop(prop, x, y):
    if prop.image in GLOWS:
        draw_glow(GLOWS[prop.image], x, y - 8 * prop.scale, prop.x)
    draw_image("images/" + prop.image + ".png", x - 8 * prop.scale, y - 15 * prop.scale, scale=prop.scale)


def draw_mob(mob, x, y):
    now = game["time"]
    age = now - mob.born
    if age < BIRTH:
        draw_circle(x, y, 4 + age / 3, "#ffffff66")      # bóng mờ báo trước: sắp có quái
        return
    half = 8 * mob.scale
    draw_rect(x - half * 0.6, y + half - 4, half * 1.2, 5, "#00000044")
    if mob.elite:
        draw_circle(x, y, half + 4, "#ffd84d55")
    if mob.slow_end > now:
        draw_circle(x, y, half, "#7fd8ff77")
    lift = (age + mob.beat) // 10 % 2 * 2         # nhún lên nhún xuống
    if mob.kind == "bat":
        lift = lift * 2 + 4
    if mob.kind == "boss1" and age % 150 > 90:
        lift = sin((age % 150 - 90) / 60 * pi) * 44
    draw_sprite(mob.data["image"], x, y - lift, mob.scale, mob.look != mob.data["faces"])
    if mob.flash_end > now + 2:
        draw_circle(x, y - lift, half * 0.8, "#ffffff99")
    if mob.stun_end > now:
        draw_sprite("skill-spark-1", x, y - half - 8, 1)
    elif mob.burn_end > now:
        draw_sprite("shot-fire", x, y - half - 8, 1)
    if mob.elite:
        draw_bar(x, y - half - 10, 46, mob.hp / mob.max_hp, "#ffd84d")
    if mob.kind == "boss3" and 90 < age % 230 < 145:        # vạch đỏ: trùm sắp húc theo hướng này, né đi
        draw_line(x, y, x + mob.dir_x * 300, y + mob.dir_y * 300, "#ff5050aa", 7)


def draw_bar(x, y, width, part, color):
    draw_rect(x - width / 2 - 1, y - 1, width + 2, 7, "#181824cc")
    draw_rect(x - width / 2, y, width * max(0, min(1, part)), 5, color)


def draw_shot(shot, x, y):
    if shot.kind == "arrow":
        draw_arrow(shot, x, y)
    elif shot.kind == "orb":
        draw_sprite("shot-spark", x, y, 1.75)
    elif shot.kind == "plasma":
        draw_sprite("shot-fire", x, y, 1.5)
    else:
        draw_circle(x, y, 8, "#1b1b28")
        draw_circle(x, y, 7, "#ff4f6d")
        draw_circle(x, y, 3, "#ffffff")


def draw_arrow(shot, x, y):
    if abs(shot.dir_y) < 0.15:          # bay ngang thì dùng ảnh. Trong ảnh, mũi tên chỉ sang trái.
        draw_sprite("shot-arrow", x, y, 1.5, shot.dir_x > 0)
        return
    back_x = x - shot.dir_x * 18
    back_y = y - shot.dir_y * 18
    draw_line(back_x, back_y, x, y, "#1b1b28", 5)
    draw_line(back_x, back_y, x, y, "#c98a5a", 2)
    draw_line(back_x, back_y, back_x + shot.dir_x * 5, back_y + shot.dir_y * 5, "#e05060", 4)
    draw_line(x - shot.dir_x * 3, y - shot.dir_y * 3, x, y, "#e8f0ff", 4)


def draw_zone(zone, x, y):
    if zone.kind == "flame":
        # Bùng lên (khung 0, 1), cháy (2 tới 5), rồi tàn (6 tới 8).
        frame = 2 + zone.life // 6 % 4
        if zone.life > 192:
            frame = (200 - zone.life) // 4
        elif zone.life < 15:
            frame = 8 - zone.life // 5
        draw_image("images/fx-fire.png", x - 24, y - 26, frame=frame)
    elif zone.kind == "trap":
        draw_sprite("skill-spark-4", x, y, 1.5)
    elif zone.kind == "hail":
        draw_circle(x, y, zone.r, "#7fd8ff44")
        draw_sprite("shot-ice", x, y - zone.life * 4, 2)
    else:
        draw_circle(x, y, zone.r, "#ff505055")
        draw_circle(x, y, max(0, zone.r - zone.life * 0.6), "#ff505066")


def draw_drop(drop, x, y):
    if drop.kind == "box":
        draw_rect(x - 15, y + 12, 30, 5, "#00000044")
        draw_sprite("deco-crate", x, y, 2)
        return
    image, scale = DROPS[drop.kind]
    lift = sin(game["time"] * 0.08 + drop.x) * 3
    draw_circle(x, y, 20, "#ffffff33")
    draw_sprite(image, x, y - lift, scale)


def draw_effect(effect, x, y):
    if effect.kind == "ring":
        draw_circle(x, y, effect.scale * min(1, 0.4 + effect.age / 20), effect.color + "30")
    elif effect.kind == "number":
        draw_text(effect.x2, x, y - effect.age * 0.6, effect.scale, effect.color)
    elif effect.kind == "bolt":
        end_x = effect.x2 - camera["x"]
        end_y = effect.y2 - camera["y"]
        mid_x = (x + end_x) / 2 + effect.age - 7
        mid_y = (y + end_y) / 2 - 8
        draw_line(x, y, mid_x, mid_y, effect.color, 3)
        draw_line(mid_x, mid_y, end_x, end_y, effect.color, 3)
    else:
        fx = FX[effect.kind]
        path = "images/fx-" + effect.kind + ".png"
        x = x - fx["width"] / 2 * effect.scale
        y = y - fx["foot"] * effect.scale
        frame = min(fx["frames"] - 1, effect.age // fx["hold"])
        draw_image(path, x, y, frame=frame, scale=effect.scale)
        if effect.kind == "slash":      # thêm nửa vòng bên kia
            draw_image(path, x, y, frame=frame, flip=True, scale=effect.scale, mirror=True)


def draw_hero():
    x = hero.x - camera["x"]
    y = hero.y - camera["y"]
    if hero.target is not None:
        draw_circle(hero.target[0] - camera["x"], hero.target[1] - camera["y"], 9, "#ffffff88")
    draw_rect(x - 11, y + 14, 22, 6, "#00000055")
    if hero.shield:
        draw_circle(x, y, 26, "#7fd8ff88")
    lift = 0
    if hero.moving:
        lift = game["time"] // 8 % 2 * 3
    if game["time"] >= hero.safe_end or game["time"] // 5 % 2 == 0:         # nhấp nháy khi vừa trúng đòn
        draw_sprite(hero.data["image"], x, y - lift, 2.5, hero.look != hero.data["faces"])


def draw_near_hero():
    # Vẽ sau cùng để cây không che: thanh máu, đốm lửa, mây.
    x = hero.x - camera["x"]
    y = hero.y - camera["y"]
    draw_bar(x, y + 26, 40, hero.hp / hero.max_hp, "#ff6b6b")
    for spot in ember_spots():
        draw_sprite("shot-fire", spot[0] - camera["x"], spot[1] - camera["y"], 1.75)
    if level_of("spark_cloud") > 0:
        draw_sprite("skill-spark-3", x, y - 48, 2)


def draw_gem(gem, x, y):
    # Ngọc nhỏ xanh dương, vừa xanh lá, to màu hồng: quầng màu phía sau, ngọc nhấp nhô.
    for tier in GEM_TIERS:
        if gem.value >= tier[0]:
            lift = sin(game["time"] * 0.1 + gem.x) * 2
            draw_circle(x, y - lift, 5 * tier[2], tier[1] + "55")
            draw_sprite("item-xp", x, y - lift, tier[2])
            return


def draw_air():
    # Không khí của mỗi ải: cánh hoa, sương và đom đóm, hay tàn lửa.
    kind = FLOORS[game["floor"]]["air"]
    t = game["time"]
    if kind == "mist":
        for i in range(9):
            x = (i * 283 + t * 0.25 - camera["x"]) % (WIDTH + 700) - 350
            draw_image("images/deco-glow-mist.png", x - 256, i * 197 % HEIGHT - 128 + sin(t * 0.01 + i) * 20, scale=8)
        draw_image("images/deco-dark-forest.png", 0, 0, scale=WIDTH / 96)
    for i in range(22):
        x = (i * 173 + sin(t * 0.02 + i) * 30 - camera["x"]) % WIDTH
        if kind == "petals":
            y = (i * 97 + t * 0.4 - camera["y"]) % HEIGHT
            draw_rect(x, y, 5, 4, "#ffd3e6cc")
        elif kind == "mist":
            y = (i * 97 + cos(t * 0.015 + i * 2) * 40 - camera["y"]) % HEIGHT
            draw_circle(x, y, 2 + sin(t * 0.06 + i) * 1.5, "#d8ff9acc")
        else:
            y = (i * 97 - t * 0.6 - camera["y"]) % HEIGHT
            draw_rect(x, y, 4, 4, "#ff9a4acc")
    if kind == "embers":                # hang tối ở mép màn hình
        draw_image("images/deco-dark-cave.png", 0, 0, scale=WIDTH / 96)


def draw_pointers():
    # Trùm và rương ở ngoài màn hình: mũi nhỏ ở mép chỉ về phía đó.
    for thing, image in [(m, m.data["image"]) for m in mobs if m.boss or m.elite] + \
            [(d, "item-chest") for d in drops if d.kind == "chest"]:
        if not on_screen(thing, -20):
            x = max(34 * U, min(WIDTH - 34 * U, thing.x - camera["x"]))
            y = max(90 * U, min(HEIGHT - 76 * U, thing.y - camera["y"]))
            draw_circle(x, y, 20 * U, "#181824aa")
            draw_sprite(image, x, y, 1.75 * U)


def draw_skill_icon(name, x, y, scale, level):
    # Ô có viền màu của nhánh, hình của skill, và vạch trắng cho biết mấy cấp.
    branch = BRANCHES[SKILLS[name]["branch"]]
    side = 16 * scale
    draw_rect(x, y, side + 4, side + 4, branch["color"])
    draw_rect(x + 2, y + 2, side, side, "#20202e")
    draw_image("images/" + SKILLS[name]["icon"] + ".png", x + 2, y + 2, scale=scale)
    draw_rect(x, y + side + 4, (side + 4) * level / MAX_LEVEL, 2 + scale, "#ffffff")


def clock_text(seconds):
    rest = seconds % 60
    if rest < 10:
        return str(seconds // 60) + ":0" + str(rest)
    return str(seconds // 60) + ":" + str(rest)


def draw_xp_bar():
    # Thanh kinh nghiệm chạy suốt mép trên: đầy thì lên cấp. Ghi rõ còn thiếu bao nhiêu.
    tall = 22 * U
    need = xp_needed()
    draw_rect(0, 0, WIDTH, tall + 6, "#0e0e18")
    draw_rect(3, 3, WIDTH - 6, tall, "#22304a")
    fill = (WIDTH - 6) * max(0, min(1, game["xp_shown"]))
    color = "#2fc9a8"
    if game["xp_glow"] > 0:
        color = "#7ff7dc"
    draw_rect(3, 3, fill, tall, color)
    draw_rect(3, 3, fill, tall * 0.35, "#ffffff33")         # vệt sáng cho thanh trông tròn
    for i in range(1, 10):                                   # vạch chia 10 phần
        draw_rect(3 + (WIDTH - 6) * i / 10, 3, 2, tall, "#0e0e1855")
    draw_text("Kinh nghiệm " + str(int(hero.xp)) + " / " + str(need), WIDTH / 2, 3 + tall / 2,
              20 * U, "#ffffff")


def draw_hud():
    floor = FLOORS[game["floor"]]
    draw_xp_bar()
    draw_text("Cấp " + str(hero.level), WIDTH - 60 * U, 46 * U, 30 * U, "#5ff0c8")
    draw_text("Hạ " + str(game["kills"]), WIDTH - 60 * U, 72 * U, 22 * U, "#e8ecff")
    draw_text("Ải " + str(game["floor"] + 1) + ": " + floor["name"], 104 * U, 44 * U, 24 * U)
    draw_image("images/item-heart.png", 18 * U, 58 * U, scale=1.5 * U)
    draw_rect(46 * U, 62 * U, 150 * U, 16 * U, "#181824cc")
    draw_rect(48 * U, 64 * U, 146 * U * hero.hp / hero.max_hp, 12 * U, "#ff6b6b")
    draw_text(str(round(hero.hp)) + "/" + str(hero.max_hp), 121 * U, 70 * U, 20 * U)
    if game["boss_out"]:
        for mob in mobs:
            if mob.boss:                # thanh máu trùm
                draw_text(mob.data["boss"], WIDTH / 2, 44 * U, 24 * U, "#ffb3b3")
                draw_rect(WIDTH / 2 - 182 * U, 56 * U, 364 * U, 16 * U, "#181824cc")
                draw_rect(WIDTH / 2 - 180 * U, 58 * U, 360 * U * max(0, mob.hp / mob.max_hp), 12 * U, "#ff5050")
    else:
        draw_text(clock_text(game["second"]), WIDTH / 2, 50 * U, 40 * U)
        draw_text("Trùm ra lúc " + clock_text(floor["length"]), WIDTH / 2, 78 * U, 18 * U, "#c8cce0")
    for i in range(len(combos)):
        draw_combo(i, COMBOS[combos[i]])
    x = 8 * U
    for name in hero.skills:
        draw_skill_icon(name, x, HEIGHT - 42 * U, 1.75 * U, hero.skills[name])
        x = x + 38 * U


def draw_combo(i, combo):
    # Phối hợp đã mở thì hiện tên mãi ở góc dưới phải. Vạch màu: cần những nhánh nào.
    x = WIDTH - (108 + i % 3 * 104) * U
    y = HEIGHT - (30 + i // 3 * 30) * U
    draw_rect(x, y, 100 * U, 24 * U, "#4a3560dd")
    width = 100 * U / len(combo["needs"])
    left = x
    for branch in combo["needs"]:
        draw_rect(left, y, width, 4 * U, BRANCHES[branch]["color"])
        left = left + width
    draw_text(combo["name"], x + 50 * U, y + 14 * U, 18 * U, "#ffd0f0")


def draw_play():
    left, top = camera["x"], camera["y"]
    draw_ground()
    for zone in zones:
        draw_zone(zone, zone.x - left, zone.y - top)
    for gem in gems:
        if on_screen(gem, 10):
            draw_gem(gem, gem.x - left, gem.y - top)
    for drop in drops:
        if on_screen(drop, 20):
            draw_drop(drop, drop.x - left, drop.y - top)
    draw_standing()
    for effect in effects:
        draw_effect(effect, effect.x - left, effect.y - top)
    for shot in shots:
        draw_shot(shot, shot.x - left, shot.y - top)
    draw_near_hero()
    draw_air()
    draw_pointers()
    draw_hud()
    if len(banners) > 0 and game["state"] == "play":
        draw_rect(WIDTH / 2 - 300 * U, 100 * U, 600 * U, 40 * U, "#101018bb")
        draw_text(banners[0][0], WIDTH / 2, 120 * U, 24 * U, "#ffe9a8")


def draw_row(i, color, dark):
    draw_rect(160 * U, row_top(i), 640 * U, 116 * U, color)
    draw_rect(163 * U, row_top(i) + 3 * U, 634 * U, 110 * U, dark)
    draw_text(str(i + 1), 190 * U, row_top(i) + 58 * U, 40 * U, color)


def draw_hero_choice():
    clear("#1d1b2c")
    draw_text("HẦM NGỌC", WIDTH / 2, 48 * U, 64 * U, "#5ff0c8")
    draw_text("Chọn nhân vật: phím 1, 2, 3 hoặc bấm vào", WIDTH / 2, 104 * U, 26 * U)
    for i in range(3):
        data = HEROES[i]
        draw_row(i, data["color"], "#4a4660")
        draw_sprite(data["image"], 275 * U, row_top(i) + (58 - game["clock"] // 20 % 2 * 4) * U, 5 * U,
                    data["faces"] == "left")
        draw_text(data["name"], 550 * U, row_top(i) + 38 * U, 38 * U, data["color"])
        draw_text(data["text"], 550 * U, row_top(i) + 80 * U, 26 * U)
    draw_text("Mũi tên / WASD để đi, hoặc giữ chuột (giữ tay) trên sân", WIDTH / 2, 524 * U, 22 * U, "#ffe9a8")


def draw_cards():
    draw_rect(0, 0, WIDTH, HEIGHT, "#101018cc")
    draw_text("Lên cấp " + str(hero.level) + "!", WIDTH / 2, 52 * U, 50 * U, "#5ff0c8")
    draw_text("Chọn 1 thẻ: phím 1, 2, 3 hoặc bấm vào", WIDTH / 2, 104 * U, 26 * U)
    draw_text("Ô skill: " + str(slots_used()) + "/" + str(SLOTS), 870 * U, 104 * U, 26 * U, "#ffe9a8")
    for i in range(len(cards)):
        draw_card(i, cards[i])


def draw_card(i, name):
    branch = BRANCHES[SKILLS[name]["branch"]]
    level = level_of(name) + 1
    y = row_top(i)
    draw_row(i, branch["color"], branch["dark"])
    draw_skill_icon(name, 218 * U, y + 20 * U, 4 * U, level)
    draw_text(SKILLS[name]["name"] + " - " + branch["name"] + " cấp " + str(level), 540 * U, y + 27 * U, 32 * U,
              branch["color"])
    draw_text(SKILLS[name]["text"][level - 1], 540 * U, y + 62 * U, 26 * U)
    unlock = combo_from(name)
    if unlock != "":
        draw_text("Mở phối hợp: " + unlock, 540 * U, y + 95 * U, 22 * U, "#ff9ad9")


def draw_message(image, title, line, color, after):
    draw_rect(220 * U, 120 * U, 520 * U, 290 * U, "#101018ee")
    draw_sprite(image, WIDTH / 2, 172 * U, 4 * U)
    draw_text(title, WIDTH / 2, 252 * U, 58 * U, color)
    draw_text(line, WIDTH / 2, 312 * U, 28 * U)
    draw_text("Bấm Space hoặc chạm để " + after, WIDTH / 2, 368 * U, 24 * U, "#b9c0d8")


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
        draw_message("item-heart", "Qua ải " + str(game["floor"] + 1) + "!", "Em được hồi 50 máu", "#5ff0c8", "đi tiếp")
    elif state == "win":
        draw_message("item-chest", "Em thắng rồi!", beaten, "#ffe14d", "chơi lại")
    elif state == "lose":
        draw_message(hero.data["image"], "Thua mất rồi!", beaten, "#ff8a8a", "chơi lại")
