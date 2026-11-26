# 0014. Chấm "Giống hình mẫu" theo % và nút 🔑 Đáp án

26/11/2026 · Chấp nhận (HLV duyệt thiết kế 26/11)

## Bối cảnh

HLV dùng tài khoản học sinh làm bài vẽ đàn chim. Vẽ gần đúng vẫn không qua, và không có lối sang bài tập sau. Mục
tiêu `matches` (40 bài tập) đòi tranh **trùng tuyệt đối** với lời giải: lệch 1 điểm ảnh hay vẽ thêm một hình là
trượt, mà bé không biết mình sai bao nhiêu.
Thiết kế: `superpowers/specs/2026-11-26-lesson-likeness-and-answer-design.md`.

## Quyết định

**Chấm theo %**
- `matches` qua khi `matchScore ≥ MATCH_PASS` (90).
- `rasterize()` (`packages/checker`) vẽ khung hình cuối lên lưới ô 4 × 4 điểm ảnh. Nó chạy bằng code TS thuần, không
  canvas, nên `content:check` trên Node và trang web chấm như nhau.
- Hình trong kho là một khối đúng cỡ, "màu" là tên hình, khung hình và chiều lật. Cỡ hình lấy từ manifest
  (`CheckExtra.sprites`).

**So hai lưới**
- `likeness()` so hai lưới. Lệch ≤ 2 ô (8 điểm ảnh) vẫn tính là trúng. Hình chiếm 85 điểm, màu trời 15.
- Ở bài học, **mỗi màu tính riêng rồi lấy trung bình**. Nhờ vậy chi tiết nhỏ mang ý chính của bài (8 chấm đỏ/đen
  trong Bài 10) không bị một khung to lấn át. Trước khi đổi, code khởi đầu của bài đó được 97%.
- Tranh được so như **nhìn thấy**: hình vẽ sau che hình vẽ trước.
- Xưởng vẽ dùng cùng `likeness()` với ô là điểm ảnh canvas, màu so theo RGB, và không tính theo màu.

**Trên màn code**
- Sau mỗi lần ▶, thẻ 🎯 hiện "👀 Giống mẫu N% · cần 90%".
- Sau 5 lần ▶ chưa qua (HLV thấy ngay), cạnh ▶ Chạy có nút 🔑. Nút mở ngăn 🔑 Đáp án ở cột phải: code lời giải chỉ
  đọc, không có nút chép.

## Hệ quả

- Lệch vài điểm ảnh thì qua. Thiếu một hình, sai chỗ xa hay sai màu thì trượt.
- Vẽ thêm trời hoặc mây **vẫn trượt**: HLV không chọn "cho vẽ thêm trang trí".
- Đổi một con số nhỏ (lệch dưới 8 điểm ảnh) có thể vẫn qua. HLV chấp nhận cái giá này khi chọn chấm theo %.
- Các test "khác 1 điểm ảnh là trượt" của `matches` được thay bằng các ví dụ ở §4 của spec.
- Không lưu việc bé đã mở đáp án.
