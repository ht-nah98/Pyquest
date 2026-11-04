# Bay Qua Khe — game mẫu cho Bài 0.
# Cuối khóa, em sẽ tự viết được một game như thế này.

GRAVITY = 0.45      # mỗi khung hình chim rơi nhanh thêm bấy nhiêu
FLAP = -7.5         # bấm một lần: tốc độ thành số âm, tức là bay lên
GAP = 150           # khe giữa hai cột
PIPE_W = 52         # bề rộng một cột
PIPE_H = 320        # chiều cao hình cột
SPACING = 220       # khoảng cách giữa hai cặp cột
SPEED = 2           # cột trượt sang trái bao nhiêu mỗi khung
GROUND_Y = 520      # mặt đất bắt đầu ở đây
BIRD_X = 80
BIRD_W = 32
BIRD_H = 24

bird_y = 250
speed = 0
pipes = []          # mỗi cột: [x, đỉnh khe, đã tính điểm chưa]
score = 0
best = 0
state = "ready"     # ready → play → over
frame_no = 0
over_at = 0
was_down = False


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
    if BIRD_X + BIRD_W - 4 < x or BIRD_X + 4 > x + PIPE_W:
        return False
    return bird_y + 4 < gap_top or bird_y + BIRD_H - 4 > gap_top + GAP


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
        return

    if state == "over":
        if tap and frame_no - over_at > 30:
            reset()
        return

    if tap:
        speed = FLAP
    speed = speed + GRAVITY
    bird_y = bird_y + speed

    for pipe in pipes:
        pipe[0] = pipe[0] - SPEED
        if not pipe[2] and pipe[0] + PIPE_W < BIRD_X:
            pipe[2] = True
            score = score + 1
    if pipes[0][0] < -PIPE_W:
        pipes.pop(0)
        pipes.append(new_pipe(pipes[-1][0] + SPACING))

    crashed = bird_y + BIRD_H > GROUND_Y or bird_y < -BIRD_H
    for pipe in pipes:
        if hits(pipe):
            crashed = True
    if crashed:
        state = "over"
        over_at = frame_no
        best = max(best, score)


def draw():
    draw_sprite("background", 0, 0)
    for pipe in pipes:
        draw_sprite("pipe", pipe[0], pipe[1] - PIPE_H, flip=True)
        draw_sprite("pipe", pipe[0], pipe[1] + GAP)
    ground_x = -(frame_no * SPEED % 400) if state != "over" else -(over_at * SPEED % 400)
    draw_sprite("ground", ground_x, GROUND_Y)
    draw_sprite("ground", ground_x + 400, GROUND_Y)
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
