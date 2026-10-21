# P-05 — Cổng phụ huynh

| Mục | Giá trị |
|---|---|
| Phiên bản | 1.0 (2026-10-21) · Owner: BA + Designer (trợ lý) · Approver: chủ dự án |
| Người dùng | Phụ huynh có con đang học; điện thoại |
| Mục tiêu | Xem lịch, chuyên cần, điểm của từng con mà không cần hỏi GV (GOAL-004) |
| FR | FR-022, 025, 033, 034 · UC-011 |

## 1. Điều hướng
Một mục "Theo dõi con" (`/phu-huynh`). Chỉ đọc — không có thao tác ghi nào.

## 2. Màn hình SCREEN-038 `/phu-huynh?con=&tuan=`
| Khối | Nội dung |
|---|---|
| Lời chào | "Xin chào, <tên>" — "Lịch học, chuyên cần và điểm đã công bố của con." |
| Chọn con (khi > 1) | Nút viên thuốc theo tên, con đang chọn đánh dấu |
| Tên con | Họ tên · lớp n |
| Lịch tuần | Buổi của con, GV, phòng, nhãn "Đã hủy"; chuyển tuần giữ con đang chọn |
| Chuyên cần | "Chuyên cần: X%", tỷ lệ từng lớp, 10 buổi gần nhất |
| Điểm đã công bố | Bài đã công bố **và** đã chấm: tên, lớp, thời điểm công bố, nộp muộn, điểm/tối đa, nhận xét chung |

Rỗng: chưa liên kết con → "Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ giáo vụ của học viện."; tuần trống, chưa điểm danh, chưa có kết quả → thông điệp riêng từng thẻ.

## 3. Hành trình
Nhận mật khẩu tạm từ giáo vụ → đăng nhập bằng SĐT → đổi mật khẩu → `/phu-huynh` → chọn con → xem.

## 4. Tình huống biên
| Tình huống | Hành vi |
|---|---|
| Sửa `?con=` thành HS khác | 404 |
| Con bị khóa tài khoản | Không còn trong danh sách con |
| Bài đã công bố nhưng con chưa được chấm | Không hiện trong "Điểm đã công bố" |
| Mở `/hoc-sinh` | Chuyển về `/phu-huynh` |

## 5. Dữ liệu và quyền
Chỉ con có liên kết trong `guardianships` (`linkedStudentIds`); chỉ đọc.

## 6. Kiểm thử
TC-034; TC-UAT-11, 13.
