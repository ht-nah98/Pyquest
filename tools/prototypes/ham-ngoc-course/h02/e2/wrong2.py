from pyquest import *

x = 300
y = 300
speed = 3


def update():
    global x, y
    if key_pressed("right"):
        x += speed
    if key_pressed("left"):
        x -= speed
    if key_pressed("up"):
        y -= speed
    if key_pressed("down"):
        y += speed
    if x < 0:
        x = 0
    if x > 600:
        x = 600
    if y < 0:
        y = 0
    if y > 600:
        y = 600


def draw():
    clear("#2b2438")
    draw_image("images/deco-torch.png", 100, 60, scale=3)
    draw_image("images/deco-torch.png", 452, 60, scale=3)
    draw_image("images/hero-knight.png", x - 24, y - 24, scale=3)
    draw_text("Kiếm sĩ", x, y - 36, 18)
