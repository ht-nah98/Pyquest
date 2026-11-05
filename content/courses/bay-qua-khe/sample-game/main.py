# Bay Qua Khe — game mẫu cho Bài 0.
# Cuối khóa, em sẽ tự viết được một game như thế này.
# draw_bird và draw_pipe không có sẵn: chúng được viết ngay trong file này, từ draw_image của thư viện.

from pyquest import *


GRAVITY = 0.45      # mỗi khung hình chim rơi nhanh thêm bấy nhiêu
FLAP = -7.5         # bấm một lần: tốc độ thành số âm, tức là bay lên
GAP = 150           # khe giữa hai cột
PIPE_W = 52         # bề rộng thân cột (chỗ chạm vào là thua)
PIPE_H = 440        # chiều cao hình cột
PIPE_PAD = 12       # hình cột rộng 76: lá/đầu cột tràn ra 12 mỗi bên
SPACING = 220       # khoảng cách giữa hai cặp cột
SPEED = 2           # cột trượt sang trái bao nhiêu mỗi khung
GROUND_Y = 520      # mặt đất bắt đầu ở đây
BIRD_X = 80
BIRD_W = 44
BIRD_H = 40
HIT = 8             # chừa mép: đuôi và cánh mỏng không tính là va chạm
GROUND_W = 800      # dải đất dài 800, cuộn vòng

bird_y = 250
speed = 0
pipes = []          # mỗi cột: [x, đỉnh khe, đã tính điểm chưa]
score = 0
best = 0
state = "ready"     # ready → play → over
frame_no = 0
over_at = 0
was_down = False


def draw_bird(x, y, frame):
    draw_image("images/bird.png", x, y, frame)


def draw_pipe(x, gap_top):
    draw_image("images/pipe.png", x - PIPE_PAD, gap_top - PIPE_H, flip=True)
    draw_image("images/pipe.png", x - PIPE_PAD, gap_top + GAP)


def new_pipe(x):
    return [x, random_int(70, GROUND_Y - GAP - 70), False]


def reset():
    global bird_y, speed, pipes, score, state
    bird_y = 250
    speed = 0
    score = 0
    pipes = [new_pipe(460), new_pipe(460 + SPACING)]
    state = "ready"


def hits(pipe):
    x, gap_top = pipe[0], pipe[1]
    if BIRD_X + BIRD_W - HIT < x or BIRD_X + HIT > x + PIPE_W:
        return False
    return bird_y + HIT < gap_top or bird_y + BIRD_H - HIT > gap_top + GAP


def update():
    global bird_y, speed, score, best, state, frame_no, over_at, was_down
    frame_no += 1
    down = key_pressed()
    tap = down and not was_down
    was_down = down

    if state == "ready":
        bird_y = 250 + (frame_no // 10 % 2) * 4
        if tap:
            state = "play"
            speed = FLAP
            play_sound("flap")
            play_music("happy")
        return

    if state == "over":
        if tap and frame_no - over_at > 30:
            reset()
        return

    if tap:
        speed = FLAP
        play_sound("flap")
    speed = speed + GRAVITY
    bird_y = bird_y + speed

    for pipe in pipes:
        pipe[0] = pipe[0] - SPEED
        if not pipe[2] and pipe[0] + PIPE_W < BIRD_X:
            pipe[2] = True
            score = score + 1
            play_sound("point")
    if pipes[0][0] < -PIPE_W:
        pipes.pop(0)
        pipes.append(new_pipe(pipes[-1][0] + SPACING))

    crashed = bird_y + BIRD_H - HIT > GROUND_Y or bird_y < -BIRD_H
    for pipe in pipes:
        if hits(pipe):
            crashed = True
    if crashed:
        play_sound("hit")
        stop_music()
        state = "over"
        over_at = frame_no
        best = max(best, score)


def draw():
    draw_image("images/background.png", 0, 0)
    for pipe in pipes:
        draw_pipe(pipe[0], pipe[1])
    moved = frame_no if state != "over" else over_at
    ground_x = -(moved * SPEED % GROUND_W)
    draw_image("images/ground.png", ground_x, GROUND_Y)
    draw_image("images/ground.png", ground_x + GROUND_W, GROUND_Y)
    flap = frame_no // 5 % 3 if state != "over" else 1
    draw_bird(BIRD_X, bird_y, flap)
    draw_text(str(score), 200, 60, 56)
    if state == "ready":
        draw_text("Bấm Space hoặc chạm để bay", 200, 400, 28)
    if state == "over":
        draw_text("Thua rồi!", 200, 220, 48)
        draw_text("Kỷ lục: " + str(best), 200, 280, 32)
        draw_text("Bấm để chơi lại", 200, 330, 28)


reset()
