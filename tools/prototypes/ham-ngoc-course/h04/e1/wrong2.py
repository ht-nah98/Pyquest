from pyquest import *

mobs = []
mobs.append({"image": "mob-slime", "x": 100, "y": 200})
mobs.append({"image": "mob-bat", "x": 300, "y": 200})
mobs.append({"image": "mob-mushroom", "x": 500, "y": 200})


def draw_thing(image, x, y, size):
    draw_image("images/" + image + ".png", x - 8 * size, y - 8 * size, scale=size)


clear("#2b2438")
mobs.append({"image": "mob-ghost", "x": 200, "y": 400})
mobs.append({"image": "mob-golem", "x": 400, "y": 400})
mob = mobs[0]
draw_thing(mob["image"], mob["x"], mob["y"], 4)
