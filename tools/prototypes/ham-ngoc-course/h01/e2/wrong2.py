from pyquest import *

x = 300
y = 300


def update():
    pass


def draw():
    clear("#2b2438")
    draw_image("images/deco-torch.png", 100, 60, scale=3)
    draw_image("images/deco-torch.png", 452, 60, scale=3)
    draw_image("images/hero-knight.png", x - 24, y - 24, scale=3)
