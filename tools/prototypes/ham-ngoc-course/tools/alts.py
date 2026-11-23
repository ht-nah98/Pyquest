"""Other correct solutions (edits on the solution), which every goal must accept. Read by build.ex()."""

ORDER_MOVE = [("    move_hero()\n    move_mobs()\n", "    move_mobs()\n    move_hero()\n")]
ALTS = {
    "h05-e1": [
        ("elif cho chiều dọc", [('    if thing["y"] > target["y"]:\n        thing["y"] -= speed', '    elif thing["y"] > target["y"]:\n        thing["y"] -= speed')]),
        ("dọc trước, viết = thay -=", [('        thing["y"] -= speed', '        thing["y"] = thing["y"] - speed')])],
    "h05-e2": [
        ("if/else, so >=", [("    if value < 300:\n        return 580\n    return 20\n", "    if value >= 300:\n        return 20\n    else:\n        return 580\n")]),
        ("hai if lồng nhau", [("    if tick % 50 == 0 and len(mobs) < 14:\n        spawn_mob()\n", "    if len(mobs) < 14:\n        if tick % 50 == 0:\n            spawn_mob()\n")])],
    "h06-e1": [
        ("một dòng return", [('    dx = abs(a["x"] - b["x"])\n    dy = abs(a["y"] - b["y"])\n    return dx + dy\n', '    return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])\n')]),
        ("trừ ngược chiều, near(hero, mob)", [('abs(a["x"] - b["x"])', 'abs(b["x"] - a["x"])'), ("near(mob, hero, 36)", "near(hero, mob, 36)")]),
        ("không gọi near, so <=", [("        if near(mob, hero, 36):", "        if distance(hero, mob) <= 36:")]),
        ("quái đi trước", ORDER_MOVE)],
    "h06-e2": [
        ("if/else, không return sớm", [("        safe -= 1\n        return\n", "        safe = safe - 1\n        return\n")]),
        ("trừ safe ở cuối bằng elif", [('    if safe > 0:\n        safe -= 1\n        return\n    for mob in mobs:\n        if near(mob, hero, 36):\n', '    if safe > 0:\n        safe -= 1\n    for mob in mobs:\n        if safe == 0 and near(mob, hero, 36):\n')]),
        ("gán safe trước khi trừ máu", [('            hero["hp"] -= 1\n            safe = 60\n', '            safe = 60\n            hero["hp"] = hero["hp"] - 1\n')])],
    "h07-e1": [
        ("so <=", [("distance(mob, hero) < distance(best, hero)", "distance(mob, hero) <= distance(best, hero)")]),
        ("nhớ cả khoảng cách", [('    best = mobs[0]\n    for mob in mobs:\n        if distance(mob, hero) < distance(best, hero):\n            best = mob\n', '    best = mobs[0]\n    record = 9999\n    for mob in mobs:\n        far = distance(hero, mob)\n        if far < record:\n            record = far\n            best = mob\n')]),
        ("đi bằng số thứ tự, bắt đầu từ con cuối", [('    best = mobs[0]\n    for mob in mobs:\n        if distance(mob, hero) < distance(best, hero):\n            best = mob\n', '    best = mobs[len(mobs) - 1]\n    for i in range(len(mobs)):\n        if distance(mobs[i], hero) < distance(best, hero):\n            best = mobs[i]\n')])],
    "h08-e1": [
        ("so < 1", [("if wait <= 0:", "if wait < 1:")]),
        ("kiểm trước rồi mới trừ", [("    wait -= 1\n    if wait <= 0:\n        shots", "    if wait <= 0:\n        shots"), ("        wait = 30\n", "        wait = 30\n    wait -= 1\n")])],
    "h08-e2": [
        ("nhân trước chia sau", [('(target["x"] - hero["x"]) / far * 8', '8 * (target["x"] - hero["x"]) / far')]),
        ("đặt tên dx, dy", [('    vx = (target["x"] - hero["x"]) / far * 8\n', '    dx = target["x"] - hero["x"]\n    vx = dx * 8 / far\n')])],
    "h09-e1": [
        ("if <= 0 trước", [('        if mob["hp"] > 0:\n            alive.append(mob)\n        else:\n            kills += 1\n', '        if mob["hp"] <= 0:\n            kills += 1\n        else:\n            alive.append(mob)\n')]),
        ("đếm bằng phép trừ", [('        else:\n            kills += 1\n    mobs = alive\n', '    kills += len(mobs) - len(alive)\n    mobs = alive\n')])],
    "h09-e2": [
        ("hai if lồng nhau", [('        if shot["live"] and near(shot, hero, hero["reach"]):\n            kept.append(shot)\n', '        if shot["live"]:\n            if near(shot, hero, hero["reach"]):\n                kept.append(shot)\n')]),
        ("distance thay near", [('near(shot, hero, hero["reach"])', 'distance(hero, shot) <= hero["reach"]')])],
    "h10-e1": [
        ("if not near", [("        if near(gem, hero, 40):\n            xp += 1\n        else:\n            kept.append(gem)\n", "        if not near(gem, hero, 40):\n            kept.append(gem)\n        else:\n            xp += 1\n")]),
        ("rơi ngọc trước khi đếm", [('            kills += 1\n            gems.append({"x": mob["x"], "y": mob["y"]})\n', '            gems.append({"x": mob["x"], "y": mob["y"]})\n            kills += 1\n')])],
    "h10-e2": [
        ("hút sau khi xét nhặt", [("        if near(gem, hero, 150):\n            step_to(gem, hero, 6)\n        if near(gem, hero, 40):\n            xp += 1\n        else:\n            kept.append(gem)\n", "        if near(gem, hero, 40):\n            xp += 1\n        else:\n            if near(gem, hero, 150):\n                step_to(gem, hero, 6)\n            kept.append(gem)\n")]),
        ("so <= 150", [("near(gem, hero, 150)", "distance(gem, hero) <= 150")]),
        ("vẽ thanh bằng phép khác", [("600 * xp / need()", "xp / need() * 600")])],
    "h10-e3": [
        ("so > và trừ một", [("if xp >= need():", "if xp > need() - 1:")]),
        ("cộng hai lần", [("return 2 + level * 2", "return level + level + 2")]),
        ("while thay if", [("if xp >= need():", "while xp >= need():")])],
    "h11-e1": [
        ("viết đủ ba màn", [('    elif key_pressed("space"):\n        start_game()\n', '    elif screen == "title" or screen == "over":\n        if key_pressed("space"):\n            start_game()\n')]),
        ("hỏi khác play trước", [('    if screen == "play":\n        update_play()\n    elif key_pressed("space"):\n        start_game()\n', '    if screen != "play":\n        if key_pressed("space"):\n            start_game()\n    else:\n        update_play()\n')])],
    "h11-e2": [
        ("hai if lồng nhau", [('        if let_go and key_pressed("space"):\n            screen = "play"\n', '        if key_pressed("space"):\n            if let_go:\n                screen = "play"\n')]),
        ("so let_go == True", [("if let_go and", "if let_go == True and")])],
    "h12-e1": [
        ("thứ tự dòng khác", [('SKILLS.append({"name": "Tay Chớp: bắn nhanh", "branch": "spark", "icon": 1, "what": "fast", "add": 5})\n', ""), ('"what": "cloud", "add": 3})\n', '"what": "cloud", "add": 3})\nSKILLS.append({"name": "Tay Chớp: bắn nhanh", "branch": "spark", "icon": 1, "what": "fast", "add": 5})\n')]),
        ("tên khác", [("Mây Giông: sét đánh", "Mây Sấm: ầm ầm")])],
    "h12-e2": [
        ("while và not in", [('    pool = []\n    for skill in SKILLS:\n        pool.append(skill)\n    for i in range(3):\n        pick = pool[random_int(0, len(pool) - 1)]\n        cards.append(pick)\n        pool.remove(pick)\n', '    while len(cards) < 3:\n        pick = SKILLS[random_int(0, len(SKILLS) - 1)]\n        if pick not in cards:\n            cards.append(pick)\n')]),
        ("remove trước append", [("        cards.append(pick)\n        pool.remove(pick)\n", "        pool.remove(pick)\n        cards.append(pick)\n")]),
        ("chép bằng số thứ tự, bốc từ cuối", [("    for skill in SKILLS:\n        pool.append(skill)\n", "    for i in range(len(SKILLS)):\n        pool.append(SKILLS[len(SKILLS) - 1 - i])\n")])],
    "h13-e1": [
        ("elif", [('    if key_pressed("2"):', '    elif key_pressed("2"):')]),
        ("thứ tự ngược", [('    if key_pressed("1"):\n        number = 1\n', ""), ('        number = 3\n', '        number = 3\n    if key_pressed("1"):\n        number = 1\n')])],
    "h13-e2": [
        ("if khác", [("    fresh = number\n    if number == held:\n        fresh = 0\n", "    fresh = 0\n    if number != held:\n        fresh = number\n")])],
    "h13-e3": [
        ("so >= và <=", [("mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120", "mouse_y() >= 180 + i * 120 and mouse_y() <= 280 + i * 120")]),
        ("ba chữ if", [("        for i in range(3):\n            if mouse_y() > 180 + i * 120 and mouse_y() < 280 + i * 120:\n                fresh = i + 1\n", "        if mouse_y() > 180 and mouse_y() < 280:\n            fresh = 1\n        if mouse_y() > 300 and mouse_y() < 400:\n            fresh = 2\n        if mouse_y() > 420 and mouse_y() < 520:\n            fresh = 3\n")])],
    "h14-e1": [
        ("sét trước, vòng sau", [('    if bonus["ring"] > 0 and tick % 60 == 0:\n        blast(hero, 130, bonus["ring"])\n', ""), ('        strike(mobs[random_int(0, len(mobs) - 1)], bonus["cloud"])\n', '        strike(mobs[random_int(0, len(mobs) - 1)], bonus["cloud"])\n    if bonus["ring"] > 0 and tick % 60 == 0:\n        blast(hero, 130, bonus["ring"])\n')]),
        ("if lồng nhau, biến target", [('    if bonus["cloud"] > 0 and tick % 60 == 30:\n        strike(mobs[random_int(0, len(mobs) - 1)], bonus["cloud"])\n', '    if tick % 60 == 30:\n        if bonus["cloud"] >= 1:\n            target = mobs[random_int(0, len(mobs) - 1)]\n            strike(target, bonus["cloud"])\n')]),
        ("viết = thay +=", [('bonus[skill["what"]] += skill["add"]', 'bonus[skill["what"]] = bonus[skill["what"]] + skill["add"]')]),
        ("bốc thăm thêm một lần (số ngẫu nhiên lệch)", [('    if bonus["cloud"] > 0 and', '    lucky = random_int(0, 9)\n    if bonus["cloud"] > 0 and')])],
    "h14-e2": [
        ("đi bằng số thứ tự", [("    for skill in owned:\n        if skill[\"branch\"] == branch:", "    for i in range(len(owned)):\n        skill = owned[i]\n        if branch == skill[\"branch\"]:")]),
        ("gom vào danh sách", [("    total = 0\n    for skill in owned:\n        if skill[\"branch\"] == branch:\n            total += 1\n    return total\n", "    found = []\n    for skill in owned:\n        if skill[\"branch\"] == branch:\n            found.append(skill)\n    return len(found)\n")])],
    "h14-e3": [
        ("if / return True", [("    return count_branch(branch) >= 2\n", "    if count_branch(branch) > 1:\n        return True\n    return False\n")]),
        ("trừ máu thẳng trong hurt", [('        amount += 3\n', '        mob["hp"] -= 3\n')]),
        ("nhân, if lồng nhau", [('    if has_combo("ice") and mob["slow"] > 0:\n        amount += 3\n', '    if mob["slow"] > 0:\n        if has_combo("ice"):\n            amount = amount + 3\n')]),
        ("nổ lan trước khi hạ cờ", [('                shot["live"] = False\n                if has_combo("fire"):\n                    splash(shot)\n', '                if has_combo("fire"):\n                    splash(shot)\n                shot["live"] = False\n')])],
    "h15-e1": [
        ("golem viết trước dơi", [('MOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}\n', ""), ('"size": 3, "xp": 3}\n', '"size": 3, "xp": 3}\nMOBS["bat"] = {"image": "mob-bat", "hp": 2, "speed": 2, "size": 2, "xp": 1}\n')]),
        ("chép bằng for", [('    mob["hp"] = row["hp"]\n    mob["speed"] = row["speed"]\n    mob["size"] = row["size"]\n    mob["xp"] = row["xp"]\n', '    for key in row:\n        mob[key] = row[key]\n')]),
        ("chép theo thứ tự khác", [('    mob["hp"] = row["hp"]\n', ""), ('    mob["xp"] = row["xp"]\n', '    mob["xp"] = row["xp"]\n    mob["hp"] = row["hp"]\n')])],
    "h15-e2": [
        ("hai if rời", [("    elif len(mobs) == 0:\n        next_wave()\n", "    if left == 0 and len(mobs) == 0:\n        next_wave()\n")]),
        ("xét hết quái trước", [('    if left > 0:\n        if tick % row["gap"] == 0:\n            spawn_next(row)\n            left -= 1\n    elif len(mobs) == 0:\n        next_wave()\n', '    if left == 0 and len(mobs) == 0:\n        next_wave()\n    elif left > 0 and tick % row["gap"] == 0:\n        spawn_next(row)\n        left -= 1\n')]),
        ("chạy ở cuối update_play", [("    run_wave()\n    move_hero()\n", "    move_hero()\n"), ("    take_gems()\n    check_hits()\n", "    take_gems()\n    run_wave()\n    check_hits()\n")])],
    "h15-e3": [
        ("every lớn hơn count vẫn một trùm", [('"lead": "boss", "every": 3, "count": 3', '"lead": "boss", "every": 4, "count": 4')])],
    "h16-e1": [
        ("chép từng ngăn", [("    for key in row:\n        hero[key] = row[key]\n", '    hero["name"] = row["name"]\n    hero["image"] = row["image"]\n    hero["hp"] = row["hp"]\n    hero["speed"] = row["speed"]\n    hero["reach"] = row["reach"]\n    hero["power"] = row["power"]\n')])],
    "h16-e2": [
        ("biến pick", [("            start_game(HEROES[number - 1])\n", "            pick = HEROES[number - 1]\n            start_game(pick)\n")]),
        ("chữ khác", [('"Máu " + str(row["hp"]) + ", tầm " + str(row["reach"])', '"Máu: " + str(row["hp"])')]),
        ("đổi số của kiếm sĩ", [('"hp": 8, "speed": 3, "reach": 200', '"hp": 9, "speed": 3, "reach": 250')])],
    "h17-e1": [
        ("so >= 1", [('        if thing["hp"] > 0:', '        if thing["hp"] >= 1:')]),
        ("bớt hp trước, living trước khi đổi frame", [('        effect["frame"] += 0.5\n        effect["hp"] -= 1\n', '        effect["hp"] = effect["hp"] - 1\n        effect["frame"] = effect["frame"] + 0.5\n')])],
    "h17-e2": [
        ("nhạc khác", [('play_music("adventure")', 'play_music("calm")')]),
        ("tiếng đặt ở đầu take_card", [('    picks -= 1\n    play_sound("click")\n', '    play_sound("click")\n    picks -= 1\n')])],
    "h18-e1": [
        ("đặt tên khác", [("Giày Gió: chạy nhanh", "Giày Bay: vèo")])],
    "h18-e2": [
        ("so ngược", [("if kills > record:", "if record < kills:")]),
        ("so >=", [("if kills > record:", "if kills >= record:")]),
        ("tắt nhạc trước", [("    if kills > record:\n        record = kills\n    stop_music()\n", "    stop_music()\n    if kills > record:\n        record = kills\n")])],
    "h18-e3": [
        ("chữ ký khác, tim lệch", [('"Em làm game này!"', '"Cáo Lửa 12 tuổi"'), ('"item-heart", 150, 575', '"item-heart", 160, 580')])],
}
