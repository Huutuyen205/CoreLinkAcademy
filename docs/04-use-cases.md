# 04 — Use cases (Pha 1)

Dự án nhỏ nên gộp các use case vào một file. Mỗi UC tham chiếu FR và test.

## UC-001 Đăng ký học thử
- **Actor:** Khách · **FR:** FR-004, FR-005 · **TC:** TC-001..TC-004
- **Tiền điều kiện:** có ít nhất một môn.
- **Luồng chính:** 1) Khách mở `/dang-ky-hoc-thu` (hoặc nút trên trang khóa học, khóa được điền sẵn). 2) Nhập thông tin, tích đồng ý. 3) Gửi. 4) Hệ thống kiểm tra rate limit, honeypot, validate, chuẩn hóa SĐT. 5) Không có lead mở trùng SĐT → tạo lead NEW + hoạt động CREATED. 6) Hiển thị màn hình cảm ơn.
- **Luồng phụ 5a:** có lead đang mở (khác ENROLLED/LOST) trùng SĐT → thêm hoạt động RESUBMITTED với nội dung mới, không tạo lead.
- **Ngoại lệ:** dữ liệu sai → báo lỗi từng ô; quá rate limit → thông báo thử lại sau; honeypot → báo thành công giả, không lưu.
- **Hậu điều kiện:** lead xuất hiện trong danh sách Staff.

## UC-002 Xử lý lead
- **Actor:** Staff/Admin · **FR:** FR-006..FR-008 · **TC:** TC-005, TC-006
- **Luồng chính:** mở danh sách → lọc → mở lead → thêm ghi chú / đổi trạng thái (BR-010).
- **Ngoại lệ:** chuyển trạng thái không hợp lệ → từ chối; LOST không có lý do → từ chối.

## UC-003 Chuyển lead thành học viên
- **Actor:** Staff/Admin · **FR:** FR-009, FR-019 · **TC:** TC-007, TC-008
- **Tiền điều kiện:** lead không ở ENROLLED/LOST.
- **Luồng chính:** 1) Bấm "Chuyển thành học viên". 2) Xác nhận tên học sinh, khối, tên phụ huynh, SĐT, email; tùy chọn chọn lớp. 3) Hệ thống trong một transaction: tạo user STUDENT (mã HS tự sinh, mật khẩu tạm), tìm PARENT theo SĐT hoặc tạo mới (mật khẩu tạm), tạo guardianship, ghi danh lớp nếu chọn (áp BR-020..BR-022), lead → ENROLLED, hoạt động CONVERTED, audit. 4) Hiển thị mật khẩu tạm **một lần** để Staff gửi cho phụ huynh.
- **Ngoại lệ:** SĐT đã thuộc tài khoản không phải PARENT → báo lỗi, không lưu gì; lớp đầy/trùng lịch → báo lỗi, không lưu gì.

## UC-004 Đăng nhập
- **Actor:** mọi người dùng · **FR:** FR-010..FR-012 · **TC:** TC-009..TC-012
- **Luồng chính:** nhập email hoặc SĐT + mật khẩu → đúng → tạo phiên → chuyển tới dashboard theo vai trò (hoặc màn hình đổi mật khẩu nếu `mustChangePassword`).
- **Ngoại lệ:** sai → tăng bộ đếm, thông báo chung "Thông tin đăng nhập không đúng"; lần sai thứ 5 → khóa 15 phút; tài khoản DISABLED → từ chối.

## UC-005 Mở lớp
- **Actor:** Staff/Admin · **FR:** FR-017, FR-018 · **TC:** TC-013..TC-015
- **Luồng chính:** chọn khóa, giáo viên, phòng, ngày bắt đầu, thứ, giờ, số buổi, sĩ số → hệ thống sinh danh sách buổi → kiểm tra trùng giáo viên/phòng → lưu lớp + buổi trong một transaction.
- **Ngoại lệ:** trùng lịch → hiển thị danh sách xung đột, không lưu; giờ kết thúc ≤ giờ bắt đầu → lỗi validate.

## UC-006 Ghi danh
- **Actor:** Staff/Admin · **FR:** FR-019, FR-020 · **TC:** TC-016..TC-018
- **Ngoại lệ:** lớp đầy, đã ghi danh, trùng lịch học sinh, lớp COMPLETED/CANCELLED → từ chối có lý do.

## UC-007 Điểm danh buổi học
- **Actor:** Giáo viên (trong khung), Staff/Admin (ngoài khung) · **FR:** FR-023, FR-024 · **TC:** TC-019..TC-022
- **Luồng chính:** mở buổi → danh sách học sinh ACTIVE, mặc định "có mặt" → chỉnh từng em → lưu (upsert theo `sessionId+studentId`) → buổi chuyển COMPLETED nếu đã qua giờ kết thúc.
- **Ngoại lệ:** giáo viên ngoài khung → chỉ xem; Staff sửa ngoài khung thiếu lý do → từ chối; buổi CANCELLED → không điểm danh.

## UC-008 Tạo và giao bài tập
- **Actor:** Giáo viên · **FR:** FR-027, FR-028 · **TC:** TC-023..TC-025
- **Luồng chính:** tạo bài DRAFT cho lớp mình → thêm câu hỏi → xuất bản (PUBLISHED).
- **Ngoại lệ:** xuất bản bài chưa có câu hỏi hoặc hạn nộp ở quá khứ → từ chối; sửa câu hỏi khi không còn DRAFT → từ chối.

## UC-009 Làm và nộp bài
- **Actor:** Học sinh · **FR:** FR-029, FR-030 · **TC:** TC-026..TC-029
- **Luồng chính:** mở bài → hệ thống tạo submission IN_PROGRESS → trả lời, lưu nháp → nộp → khóa bài, tự chấm câu khách quan, status SUBMITTED (hoặc GRADED nếu không có tự luận).
- **Ngoại lệ:** nộp lần 2 → từ chối; quá hạn và không cho nộp muộn → từ chối; không còn ghi danh ACTIVE → không mở được.

## UC-010 Chấm và công bố
- **Actor:** Giáo viên · **FR:** FR-031..FR-033 · **TC:** TC-030..TC-033
- **Luồng chính:** mở danh sách bài nộp → chấm từng câu tự luận + nhận xét → lưu (GRADED) → bấm "Công bố kết quả" → học sinh/phụ huynh thấy điểm và đáp án.
- **Ngoại lệ:** điểm > tối đa hoặc âm → lỗi; sửa điểm sau công bố → ghi audit.

## UC-011 Phụ huynh theo dõi con
- **Actor:** Phụ huynh · **FR:** FR-022, FR-025, FR-033, FR-034 · **TC:** TC-034, TC-035
- **Luồng chính:** đăng nhập → chọn con → xem lịch tuần, chuyên cần, điểm đã công bố.
- **Ngoại lệ:** truy cập ID học sinh không liên kết → 404.

## UC-012 Quản trị người dùng
- **Actor:** Admin · **FR:** FR-013, FR-014 · **TC:** TC-036..TC-038
- **Ngoại lệ:** email/SĐT trùng → lỗi; liên kết phụ huynh thứ 5 → lỗi; Admin tự khóa → lỗi.
