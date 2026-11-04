# 0003. Khối ⇄ Python: Blockly sinh code, `ast` của Python dựng lại khối

04/11/2026 · Chấp nhận

## Bối cảnh
HLV muốn khối và code đồng bộ hai chiều. BlockMirror (Apache-2.0) làm được việc này, nhưng nó dựa trên Blockly 11 và
trình phân tích Skulpt, lần cập nhật cuối là 03/2025. PyQuest dùng Blockly 13 và đã có sẵn Python thật (Pyodide).

## Quyết định
- **Khối → code:** bộ sinh Python của Blockly, khối do mình định nghĩa (`packages/blocks`). Chữ trên khối tiếng Việt,
  code ra tiếng Anh. Thứ tự ưu tiên phép tính do mình tự tính, để `a + b + c` ra đúng như bé gõ.
- **Code → khối:** module `ast` của chính Python trong Pyodide (`packages/runtime/src/pyquest/toblocks.py.ts`) trả về
  cây JSON; `treeToState` chuyển cây đó thành JSON của Blockly.
- Câu lệnh chưa có khối thì thành **khối "code chữ"** (`pq_raw`), giữ nguyên từng ký tự. Biểu thức chưa có khối thì thành
  `pq_raw_expr`. Dòng chú thích `#` đứng riêng được giữ; câu lệnh có chú thích cuối dòng thì giữ nguyên cả câu.
- ~~Không tự thêm `from pyquest import *`: runtime đã nạp sẵn.~~ **Sửa 04/11/2026 sau câu hỏi của HLV** ("không
  thấy hàm draw_bird đâu?"): nạp ngầm là "phép màu" với học sinh và code chép ra ngoài không chạy. Nay runtime **không**
  nạp gì (như Python thật); mọi bài mở đầu bằng `from pyquest import *`, có khối riêng "📦 dùng thư viện pyquest"; thiếu
  dòng đó thì lỗi nói rõ cần thêm gì. Nút 📘 Thư viện liệt kê các lệnh (`content/reference/pyquest.json`).
  Thư viện nay chỉ giữ mảnh gốc; `draw_bird` do bé tự viết (ADR 0004).
- Khung code là nguồn chuẩn **trong lúc bé gõ**: gõ xong mới dựng lại khối, không viết lại chữ bé gõ. Bé sửa khối thì code
  mới được sinh lại.

## Hệ quả
- Không cần thêm thư viện nào (Skulpt, BlockMirror).
- Mỗi lần parse phải gọi vào worker Python (bất đồng bộ), nên trang chờ 600 ms sau phím cuối mới parse.
- Thêm khối mới = thêm định nghĩa trong `defs.ts`, generator trong `generator.ts`, và một nhánh trong `toblocks.py.ts`,
  kèm test round-trip.
