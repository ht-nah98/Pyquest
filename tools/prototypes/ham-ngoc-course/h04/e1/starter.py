from pyquest import *

mobs = []
mobs.append({"image": "mob-slime", "x": 100, "y": 200})
mobs.append({"image": "mob-bat", "x": 300, "y": 200})
mobs.append({"image": "mob-mushroom", "x": 500, "y": 200})


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


clear("#2b2438")
# Em viết tiếp ở đây
