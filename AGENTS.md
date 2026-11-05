# AGENTS.md — PyQuest

Đây là điểm vào cho mọi AI agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Đọc hết file này trước khi làm
bất cứ việc gì.

## 1. Dự án là gì

**PyQuest** là nền tảng học **Python thật** cho học sinh **cấp 2**. Các bé đã học kéo thả (Scratch), giờ học viết code
từ con số 0 tới một sản phẩm hoàn chỉnh. Nền tảng **không dạy cắm đầu vào code**: dạy **cách làm ra một sản phẩm**.
Bé thấy lộ trình và quy trình trước (ý tưởng → thiết kế → chuẩn bị → code → thử → sửa), rồi mới làm từng phần. Trước khi
code phần nào, bé phải hiểu phần đó hoạt động ra sao.

- Người dùng: **3 học sinh cấp 2** và **1 huấn luyện viên (HLV)**, chủ repo. HLV đứng lớp, ngồi cạnh các bé.
- **Nhiều khóa / nhiều game.** Khóa đầu: **"Bay Qua Khe"**, game luồn khe kiểu Flappy Bird (tên và nhân vật là của
  mình). Sau đó: các game Python khác, vẽ hình, phân tích dữ liệu.
- **Một nội dung, hai chế độ:** **Trình chiếu** (HLV giảng trên lớp) và **Tự học** (bé tự học ở nhà).
- **Khối ⇄ code song song**, đồng bộ hai chiều. Bấm Chạy thì kết quả **thành hình**, không có log.
- Thiết bị: **laptop ≥1280×720** (chuột + bàn phím). **iPad nằm ngang ≥1080×730** để kéo khối, chơi thử, xem slide.
- Giao diện **tiếng Việt**, giọng học sinh cấp 2. Python và tên hàm thư viện **tiếng Anh**.
- Hiện **chạy local** trên laptop HLV, các bé vào qua LAN (`tools/coach-dev.sh`). Code ở GitHub
  `ht-nah98/Pyquest` (**public**: không commit khóa bí mật, mật khẩu, tên thật của bé). Supabase đang làm (đợt 2).
- Repo anh em: **CodeQuest** (`~/Desktop/CodeQuest`), game Blockly cho học sinh tiểu học. PyQuest chép **khuôn** của
  CodeQuest (docs, quy trình, các bài học ở §9), **không** chép code nghiệp vụ, **không** nối tài khoản.

## 2. Đọc gì trước (theo thứ tự)

1. `docs/README.md` — bản đồ tài liệu, tài liệu nào là **nguồn chuẩn** cho chủ đề nào
2. `docs/superpowers/specs/2026-11-04-pyquest-design.md` — bản thiết kế HLV đã duyệt
3. `docs/glossary.md` — thuật ngữ Việt ↔ code
4. `docs/architecture/overview.md` — kiến trúc, ranh giới package
5. `docs/pedagogy/lesson-rhythm.md` — nhịp 5 bước của một bài, hai chế độ
6. `docs/conventions/coding-standards.md`, `docs/conventions/content-authoring.md`
7. Đang làm theo kế hoạch: `docs/superpowers/plans/*.md` và `docs/roadmap/`

Và đọc **§9** của chính file này trước khi bắt tay vào việc mới.

## 3. Quy tắc vàng (không được phá)

1. **Package headless không đụng DOM.** `packages/*` chạy được trên Node thuần: không `window`, `document`, React.
   Lý do: chấm bài và `content:check` chạy trên Node.
2. **Chạy tất định.** Thư viện `pyquest` dùng `random.Random(seed)`; chấm bài dùng seed cố định; không `Math.random()`
   hay `Date.now()` trong runtime. Cùng code + cùng seed ⇒ cùng hình.
3. **Nội dung là dữ liệu.** Khóa, bài, slide, mục tiêu, kho hình nằm trong `content/` (JSON, kiểm bằng zod). Không
   hard-code nội dung bài học trong React.
4. **Mọi bài phải qua `npm run content:check`**: lời giải qua hết mục tiêu, code khởi đầu **chưa** qua, toolbox đủ khối,
   hình tồn tại.
5. **Bài nào cũng có bước Hiểu và bước Chơi thử** (`docs/pedagogy/lesson-rhythm.md`). Không có bài "nhảy thẳng vào code".
6. **Code bé viết là Python 3 thật.** Thư viện `pyquest` chỉ thêm lệnh vẽ; không chế cú pháp riêng.
7. **Code tiếng Anh, giao diện tiếng Việt.** Tên biến, hàm, file, commit, comment: tiếng Anh. Chữ cho bé: tiếng Việt có
   dấu, ngắn (mỗi slide ≤ 280 ký tự, mỗi slide một ý).
8. **Không thu dữ liệu cá nhân của trẻ** ngoài biệt danh, avatar, tiến độ và code bé viết. Không analytics bên thứ ba.
9. **Font pixel phải có tiếng Việt.** Chỉ VT323. Cấm Press Start 2P, Pixelify Sans, Silkscreen và mọi font không có bộ
   `vietnamese`.
10. **Không tự ý thêm dependency.** Thư viện mới cần ADR trong `docs/adr/`.
11. **Không dùng tên, hình, âm thanh của game có sẵn** (Flappy Bird…). Giữ cơ chế, đổi mọi thứ nhìn thấy được.

## 4. Bản đồ repo

```
apps/web/                 app React: hồ sơ, lộ trình khóa, trình chiếu/tự học, màn code, toàn màn hình
packages/content-schema/  schema zod: khóa / bài / slide / bước / mục tiêu / kho hình
packages/runtime/         chạy Python (Pyodide), thư viện pyquest, nhật ký lệnh vẽ, dịch lỗi
packages/blocks/          khối Blockly, khối → Python, Python → khối (qua ast)
packages/checker/         chấm mục tiêu bài (hàm thuần)
content/courses/          nội dung các khóa (JSON) + game mẫu
content/assets/library/   kho hình đã làm sạch + manifest.json
assets/prompts/           prompt sinh ảnh (AI viết, HLV sinh)
assets/raw/               ảnh gốc HLV sinh, trước khi làm sạch
tools/                    content-check, assets (làm sạch ảnh), coach-dev.sh
docs/                     toàn bộ tài liệu
```

## 5. Lệnh thường dùng

```bash
npm install                 # Node 22, npm workspaces (postinstall chép Pyodide + media Blockly vào public/)
npm run dev                 # web ở http://localhost:5173
npm run typecheck           # tsc -b
npm run lint                # eslint
npm run test                # vitest (headless, Pyodide chạy trên Node)
npm run content:check       # kiểm toàn bộ nội dung, chạy lời giải từng bài
npm run e2e                 # playwright (laptop 1280×720 + iPad 1080×730), server riêng cổng 5199
npm run build               # build production
npm run assets:clean        # làm sạch ảnh trong assets/raw → content/assets/library
PQ_HOST=1 tools/coach-dev.sh [ref]   # server cho lớp qua LAN, chạy từ bản chụp
```

## 6. Định nghĩa "xong"

- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run content:check` đều xanh.
- [ ] Logic mới trong package headless có unit test.
- [ ] Thay đổi có giao diện: có e2e đi qua đúng phần đã đổi, **chụp màn hình và mở ra xem** ở 1280×720 và iPad.
- [ ] **Nội dung bài mới: HLV đọc lại / dạy thử trước khi cho bé thấy.** AI không được tự đánh dấu mục này là xong.
- [ ] Chữ tiếng Việt có dấu, ngắn, đúng giọng (`docs/conventions/content-authoring.md`).
- [ ] Tài liệu liên quan đã cập nhật; đổi kiến trúc thì thêm ADR.
- [ ] Không `any`, `@ts-ignore`, `console.log` thừa.

Báo cáo kết quả **thật**: lệnh nào đỏ thì nói đỏ, kèm output. Bước nào chưa làm được thì nói rõ ở cuối báo cáo.

## 7. Quy trình theo loại việc

| Việc | Playbook |
|---|---|
| Viết / sửa một bài | `docs/conventions/content-authoring.md` |
| Thêm hình vào kho | `docs/playbooks/add-asset.md` |
| Cho lớp dùng qua LAN | `docs/architecture/deployment-ops.md` |
| Ghi một quyết định kiến trúc | `docs/adr/README.md` |

## 8. Khi không chắc chắn

- Câu hỏi **sản phẩm / cách dạy** (thứ tự bài, độ khó, câu chữ): xem spec và `docs/pedagogy/`. Không có thì **hỏi HLV**,
  đừng đoán.
- Câu hỏi **kỹ thuật thuần**: tự quyết theo `docs/conventions/coding-standards.md`, ghi lại trong commit / ADR.
- **Blockly**: https://docs.blockly.com và mã nguồn https://github.com/RaspberryPiFoundation/blockly.
- **Pyodide**: https://pyodide.org/en/stable/.
- Hai tài liệu mâu thuẫn: làm theo tài liệu **nguồn chuẩn** trong `docs/README.md`, rồi báo để sửa tài liệu kia.

## 9. Sai lầm đã xảy ra, đừng lặp lại

Các mục dưới đây đều **đã thật sự xảy ra ở CodeQuest** (ghi số mục gốc) và vẫn áp dụng cho PyQuest. Lỗi mới của PyQuest
thì thêm vào cuối, ghi ngày.

### 9.1. Hỏi trước khi làm việc khó lùi (CodeQuest §9.5, §9.29)
Ở CodeQuest, ba hướng làm bị bỏ **sau khi code đã viết xong**, vì người làm đoán ý thay vì hỏi. Một lần khác, tính năng
"thế giới 3D" được làm thành nút bên trong màn bài học, trong khi HLV muốn một thẻ riêng ở trang chọn khóa.
**Luật:** việc khó lùi (dời thư mục, đổi route, đổi schema, xóa tài liệu) thì hỏi HLV **trước**, đưa 2–3 phương án. Tính
năng mới thì hỏi cả **chỗ đặt** lẫn việc nó làm, có hình phác.

### 9.2. Đếm bằng lệnh rồi mới nói con số (CodeQuest §9.6)
Đã có lần báo "mọi đáp án đều có", trong khi thật ra chỉ có 48/155. **Luật:** mọi con số phải ra từ một lệnh đếm, và nên
có bộ chặn tự động. **Thử phá có chủ đích** để chắc bộ chặn còn bắt được lỗi.

### 9.3. Thêm tệp trong `content/` thì khởi động lại dev server (CodeQuest §9.7)
Vite chốt `import.meta.glob` lúc khởi động, nên bài mới sẽ báo "không tìm thấy" cho tới khi chạy lại `npm run dev`. Sửa
tệp đã có thì không cần.

### 9.4. Chạy đủ bộ kiểm rồi mới báo xanh (CodeQuest §9.8, §9.36)
Đã từng báo "e2e xanh" trong khi chỉ chạy một spec. **Luật:** đổi thứ dùng chung thì chạy **cả bộ**. Unit test và e2e
chạy **lần lượt**, không chạy cùng lúc. Test đỏ vì timeout thì xem `uptime`, chạy lại riêng tệp đó, và báo cả hai con số.

### 9.5. Thứ chưa xong không được để bé thấy (CodeQuest §9.10)
Bài chưa xong thì để `hidden: true`: bé thấy tên bài trên lộ trình nhưng không vào được. Chặn này phải có **trước** khi
cho lớp dùng.

### 9.6. Thêm tài sản thì đo lại dung lượng (CodeQuest §9.14, §9.27)
Ảnh 1,8 MB và JSON bài học từng đẩy gói tải lần đầu vượt ngân sách. **Luật:** sau `npm run build` thì đọc kích thước
gói; ảnh trong kho giữ cỡ pixel thật (nhỏ). Pyodide (~10 MB) phục vụ nội bộ, không nhét vào gói chính.

### 9.7. Báo cả phần chưa làm được (CodeQuest §9.16)
Mục nào của Định nghĩa xong chưa làm thì nói thẳng ở cuối báo cáo. Mục "HLV đọc lại / dạy thử" thì AI **không bao giờ**
được tự đánh dấu là xong.

### 9.8. Đừng chờ một giá trị chỉ sống vài khung hình (CodeQuest §9.17)
Một test e2e đỏ suốt ba lần, vì nó chờ một con số chỉ hiện trong vài khung hình. **Luật:** muốn kiểm các bước giữa chừng
thì **ghi lại** (MutationObserver, `e2e/helpers.ts`) rồi kiểm sau khi chạy xong. Test đỏ vì timeout thì **mở ảnh lúc
hỏng trước** khi nâng thời gian chờ.

### 9.9. HLV chơi thử trên bản chụp, không trên cây đang sửa (CodeQuest §9.22, §9.23)
Dev server của HLV từng nạp code đang sửa dở, làm mọi màn đều vỡ. **Luật:** server cho HLV và cho lớp **luôn** chạy từ
`tools/coach-dev.sh <ref>` (worktree tách rời). Không `git stash` khi dev server đang chạy. **Không bao giờ
`pkill -f vite`**.

### 9.10. Thứ phải nhìn cùng lúc thì nằm trên cùng một màn hình (CodeQuest §9.30)
Màn code phải nằm trọn trong 1280×720, **không cuộn trang**. Chụp kiểm ở 1280×720 **và** 1866×966 (màn của HLV), chụp
**sau khi chạy xong**.

### 9.11. Một chức năng có ở nhiều màn thì làm một component (CodeQuest §9.33)
Chức năng dùng chung (Chạy, Dừng, toàn màn hình, chép code…) là **một component**. Tài liệu có **bảng màn × nút**, thêm
màn mới thì thêm dòng vào bảng.

### 9.12. Lớp phủ trên Blockly phải cao hơn khay khối (CodeQuest §9.34)
Khay khối của Blockly có `z-index: 70`. Lớp phủ lên trình soạn thì dùng `z-[85]`, thấp hơn menu thả xuống của Blockly
(999). Test lớp phủ bằng `document.elementFromPoint` ở **mép** lớp phủ, rồi chụp ảnh.

### 9.13. Chỉ định dạng tệp mình sửa, đừng `cd` vào `content/` (CodeQuest §9.35)
Chạy prettier trên `git diff --name-only`, không chạy trên cả thư mục. Plugin OMC ghi thư mục `.omc/` vào thư mục đang
đứng, nên `cd content/...` sẽ làm `content:check` báo tệp lạ. Đọc `content/` bằng đường dẫn đầy đủ.

### 9.14. Đọc điều khoản trước khi đụng trang của người khác (CodeQuest §9.28)
Không chạy tự động (`curl` lặp, Playwright, CDP) trên trang bên thứ ba khi HLV chưa quyết. **Không bao giờ xin hay dán
mật khẩu** của bé vào chat.
