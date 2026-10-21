# P-03 — Cổng giáo viên

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Giáo viên — điện thoại khi đứng lớp, máy tính khi soạn/chấm |
| Mục tiêu | Điểm danh ≤ 30 giây (GOAL-003); giao, chấm, công bố bài |
| FR | FR-022, 023, 026..028, 031..034 · UC-007, 008, 010, 016, 018 |

## 1. Điều hướng
Tổng quan · Lịch dạy · Lớp của tôi — sidebar ≥ 1024px; thanh đáy 3 mục ở điện thoại.

## 2. Phạm vi dữ liệu
- **GV chính** (`classes.teacherId = me`): toàn bộ lớp — học sinh, buổi, điểm danh, bài tập, bảng điểm.
- **GV dạy thay** (buổi có `teacherId = me`): chỉ buổi mình dạy (xem + điểm danh); không thấy bài tập/bảng điểm.
- Lớp khác → 404.

## 3. Màn hình

### SCREEN-024 Tổng quan `/giao-vien`
| Thẻ | Nội dung | Hành động |
|---|---|---|
| Buổi dạy hôm nay | Giờ · lớp · khóa · phòng; "Đã hủy" nếu hủy | "Điểm danh"; "Lịch tuần" |
| Bài chờ chấm (tổng) | ≤ 20 bài cũ nhất: HS · bài · lớp · thời điểm nộp | Bấm tên HS → chấm |
| Cảnh báo vắng | HS vắng không phép 2 buổi liên tiếp lớp mình | Liên kết lớp |

### SCREEN-025 Lịch dạy `/giao-vien/lich`
WeekSchedule; bấm buổi không hủy → điểm danh.

### SCREEN-026 Lớp của tôi
Thẻ lớp: mã, trạng thái, khóa, lịch, số HS, phòng.

### SCREEN-027 Chi tiết lớp `/giao-vien/lop/[id]`
- Cảnh báo vắng (nếu có).
- Học sinh (đang học/bảo lưu/hoàn thành); Buổi học (cuộn trong khung) + "Điểm danh".
- (GV chính) Bài tập: tên, hạn, số câu, "n bài chờ chấm", trạng thái, "Đã công bố"; "Tạo bài tập".
- (GV chính) Bảng điểm HS × bài: "—" / "Chờ chấm" / điểm; cuộn ngang trong khung.

### SCREEN-028 Điểm danh `/giao-vien/buoi/[id]`
- Header: "Điểm danh lớp X — buổi n", ngày, giờ, phòng, khóa, trạng thái.
- Trong khung (30' trước → 24h sau): danh sách đánh số; 4 nút lớn Có mặt (mặc định) / Muộn / Vắng / Có phép; ghi chú; "Lưu điểm danh" dính đáy.
- Ngoài khung: chỉ xem + "Bạn chỉ xem được; liên hệ giáo vụ nếu cần sửa."
- Buổi hủy: Alert lý do, không form.

### SCREEN-029 Tạo bài `/giao-vien/bai-tap/moi?lop=`
Tên*, Hướng dẫn, Hạn nộp (giờ VN, mặc định +7 ngày 21:00), Cho phép nộp muộn → "Tạo bài (nháp)".

### SCREEN-030 Soạn / giao / công bố `/giao-vien/bai-tap/[id]`
| Khối | Nháp | Đã giao / Đã đóng |
|---|---|---|
| Câu hỏi | Danh sách (đáp án đúng in đậm "(đúng)"), "Sửa hoặc xóa", "Thêm câu hỏi" | Chỉ xem + "Bài đã giao nên không sửa được câu hỏi." |
| Giao bài | "Giao bài cho lớp" (xác nhận) | "Đóng bài" / "Mở lại bài"; "Bài nộp (n)"; "Công bố kết quả" (xác nhận) + "Còn N bài chưa chấm…" |
| Thông tin bài | Sửa tên, hướng dẫn, hạn, nộp muộn | Như trên (hạn mới phải ở tương lai) |

### SCREEN-031 Bài nộp
Bảng HS: trạng thái ("Chưa mở bài", "Đang làm", "Chờ chấm", "Đã chấm", "Nộp muộn"), nộp lúc, điểm, "Chấm bài"/"Xem / sửa điểm".

### SCREEN-032 Chấm bài `/giao-vien/bai-nop/[id]`
Từng câu: tối đa, tự chấm, nội dung, bài làm, đáp án; ô điểm (tự luận bắt buộc; khách quan tùy chọn, bước 0,25, nhận "7,5"), nhận xét câu; nhận xét chung → "Lưu điểm". Đã công bố → cảnh báo "Mọi thay đổi điểm sẽ được ghi vào nhật ký."

## 4. Hành trình
1. Sáng: Tổng quan → buổi hôm nay.
2. Đầu giờ: "Điểm danh" → chỉnh em vắng → Lưu.
3. Tối: Lớp → "Tạo bài tập" → thêm câu → "Giao bài cho lớp".
4. Sau hạn: "Bài chờ chấm" → chấm → "Công bố kết quả".

## 5. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Quên điểm danh quá 24h | Chỉ xem; giáo vụ sửa có lý do |
| Mở lớp của GV khác qua URL | 404 |
| Công bố khi còn bài chưa chấm | Cho phép; bài đó hiện "Đang chờ chấm" cho HS tới khi chấm (D15) |
| Sửa câu hỏi sau khi giao | Không có form; gửi trực tiếp → "Chỉ sửa câu hỏi khi bài còn ở trạng thái nháp." |
| Nhập điểm 6,1 cho câu 6 điểm | "Điểm phải từ 0 đến 6." |

## 6. Kiểm thử
TC-019, 022..031, 035, 042; TC-UAT-05, 07, 09, 10, 13.
