from pyquest import *


def draw_person(person):
    draw_image("images/" + person["image"] + ".png", person["x"] - 24, person["y"] - 24, scale=3)
    draw_text(person["name"], person["x"], person["y"] - 40)
    draw_text("Máu: " + str(person["hp"]), person["x"], person["y"] + 44)


clear("#2b2438")
knight = {"name": "Kiếm sĩ", "image": "hero-knight", "x": 180, "y": 300, "hp": 5}
draw_person(knight)
# Em viết tiếp ở đây
