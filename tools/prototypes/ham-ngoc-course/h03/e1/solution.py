from pyquest import *


def draw_person(person):
    draw_image(person["image"], person["x"] - 24, person["y"] - 24, scale=3)
    draw_text(person["name"], person["x"], person["y"] - 40)
    draw_text("Máu: " + str(person["hp"]), person["x"], person["y"] + 44)


clear("#2b2438")
knight = {"name": "Kiếm sĩ", "image": "images/hero-knight.png", "x": 180, "y": 300, "hp": 5}
draw_person(knight)
mage = {"name": "Pháp sư", "image": "images/hero-mage.png", "x": 420, "y": 300, "hp": 3}
mage["hp"] += 2
draw_person(mage)
