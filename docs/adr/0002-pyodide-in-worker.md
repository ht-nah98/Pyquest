# 0002. Python thật bằng Pyodide, chạy trong Web Worker

04/11/2026 · Chấp nhận

## Bối cảnh
Bé học Python thật (spec §4) trên trình duyệt, không cài gì. Code của bé có thể lặp vô hạn. Chấm bài và `content:check`
phải chạy trên Node.

## Quyết định
- **Pyodide 314.0.7** (CPython 3.14 trên WebAssembly, giấy phép MPL-2.0). Cùng một lớp `PyRunner`
  (`packages/runtime`) chạy trên Node (test, content:check) và trong Web Worker (trang).
- Thư viện `pyquest` và phần host là mã Python giữ trong chuỗi TS (`*.py.ts`), để Vite, Vitest và tsx nạp giống nhau.
- **Giới hạn:** trần số lệnh vẽ (`maxEvents`) và trần số dòng chạy (`sys.settrace`, mặc định 1 000 000). Thêm vào đó,
  nút Dừng `terminate()` worker rồi dựng worker mới.
- **Phục vụ nội bộ:** postinstall chép `node_modules/pyodide` vào `apps/web/public/pyodide/`, nên lớp học qua LAN không
  cần Internet. Không precache vào PWA.
- `print()` của bé hiện thành bong bóng thoại (sự kiện `say`), không ghi ra console.

## Hệ quả
- Lần đầu mở trang phải tải khoảng 10 MB (wasm + stdlib), từ lần sau trình duyệt dùng cache. Nút Chạy hiện
  "Đang chuẩn bị Python…" trong lúc chờ.
- `settrace` làm code chạy chậm hơn vài lần. Với bài cấp 2 thì không sao; game mode chạy 60 khung/giây, mỗi khung chỉ
  vài trăm dòng.
