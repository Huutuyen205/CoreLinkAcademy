# ĐẶC TẢ YÊU CẦU SẢN PHẨM — CORELINK ACADEMY (PRODUCT REQUIREMENTS)

**Dự án**: Nền tảng Quản trị & Đào tạo Tiếng Anh Chuẩn Quốc Tế Tích hợp AI  
**Phiên bản**: 2.0  
**Tác giả**: Product Management & Business Analysis Team  

---

## 1. MỤC TIÊU SẢN PHẨM & PHẠM VI HỆ THỐNG

### 1.1. Tầm nhìn Sản phẩm
Xây dựng một hệ thống phần mềm hoàn chỉnh (End-to-End Operating System) phục vụ toàn bộ các hoạt động tuyển sinh, quản lý đào tạo, khảo thí học thuật, tài chính và kết nối gia đình cho trung tâm tiếng Anh CoreLink Academy.

### 1.2. Các Nhóm Tác Nhân (User Personas & Actors)
1. **Khách vãng lai (Public Visitor)**: Tìm hiểu thông tin, làm bài test đầu vào, đăng ký học thử.
2. **Nhân viên Tuyển sinh / Tư vấn (Admissions Consultant)**: Tiếp nhận lead, gọi điện tư vấn, xếp lịch test, chuyển đổi thành học viên chính thức.
3. **Quản lý Học thuật / Giáo vụ (Academic Manager)**: Tạo lớp, xếp thời khóa biểu, kiểm tra xung đột phòng/giáo viên, duyệt đơn xin nghỉ/bảo lưu.
4. **Giảng viên (Teacher)**: Mở buổi học bằng QR + GPS, điểm danh, giao bài tập, chấm bài thi (hỗ trợ bởi AI), gửi nhận xét buổi học.
5. **Học viên (Student)**: Xem lịch học, làm bài thi online, luyện phát âm cùng AI Speaking Coach, ôn từ vựng lặp lại ngắt quãng.
6. **Phụ huynh (Parent / Guardian)**: Nhận thông báo điểm danh tức thời, xem bản tóm tắt học tập lúc 20:00, xem bảng điểm, thanh toán học phí qua VietQR.
7. **Kế toán (Accountant)**: Lập hóa đơn, theo dõi công nợ, xuất biên nhận chống trùng lặp, tính lương buổi dạy cho giáo viên.
8. **Giám đốc / Quản trị viên (Super Admin / Center Director)**: Xem dashboard báo cáo toàn diện, kiểm soát chi phí AI, cấu hình chi nhánh và phân quyền.

---

## 2. USER STORIES & TIÊU CHÍ CHẤP NHẬN (GIVEN / WHEN / THEN)

### US-01: Đăng ký tư vấn và học thử từ Website công khai
- **Là**: Phụ huynh / Khách hàng tiềm năng
- **Tôi muốn**: Điền biểu mẫu đăng ký học thử với số điện thoại và chương trình học mong muốn
- **Để**: Nhận được liên hệ tư vấn lộ trình và xếp lịch học thử miễn phí
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given*: Khách hàng đang ở trang chủ hoặc trang chi tiết khóa học.
  - *When*: Khách hàng nhập họ tên, số điện thoại hợp lệ (chuẩn hóa về định dạng `+84`), chọn khóa học và nhấn "Xác Nhận Đăng Ký".
  - *Then*: Hệ thống kiểm tra trùng lặp trong bảng `leads`, lưu thông tin kèm nguồn tiếp thị (UTM tags) vào CSDL, hiển thị thông báo cảm ơn và tự động thông báo cho nhân viên tư vấn trong vòng 1 phút.

### US-02: Điểm danh buổi học bằng mã QR động & Định vị GPS
- **Là**: Giáo viên đứng lớp
- **Tôi muốn**: Mở lớp học tại cơ sở bằng việc xác thực vị trí GPS và ảnh chụp lớp, sau đó chiếu mã QR động cho học sinh quét
- **Để**: Xác nhận buổi dạy thực tế làm căn cứ tính lương và ghi nhận chuyên cần chính xác
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given*: Giáo viên đăng nhập tài khoản và đến phòng học của lớp được phân công.
  - *When*: Giáo viên nhấn "Mở Buổi Học", chụp ảnh lớp và gửi tọa độ GPS nằm trong bán kính 150m so với cơ sở.
  - *Then*: Hệ thống tạo bản ghi `teacher_checkins`, sinh mã QR động mã hóa HMAC-SHA256 đổi mới mỗi 30 giây. Khi học sinh quét mã QR hợp lệ, hệ thống cập nhật trạng thái có mặt và gửi thông báo tới phụ huynh.

### US-03: Chuyển đổi Lead thành Học viên trong một Giao dịch
- **Là**: Nhân viên tuyển sinh
- **Tôi muốn**: Chuyển trạng thái khách tiềm năng đã nộp học phí sang học viên chính thức
- **Để**: Tự động tạo hồ sơ học viên, tạo tài khoản người dùng và ghi danh vào lớp
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given*: Lead ở trạng thái `OFFER_SENT` và đã xác nhận thanh toán học phí ban đầu.
  - *When*: Nhân viên nhấn "Chuyển thành Học viên" và chọn lớp học còn chỗ trống.
  - *Then*: Trong một Prisma Transaction duy nhất: Hệ thống tạo tài khoản User, bản ghi `students`, `guardians`, `guardianships`, `enrollments` và `tuition_invoices`. Nếu lớp học đã đầy sĩ số (`max_capacity`), giao dịch tự động rollback và báo lỗi 409 Conflict.

### US-04: Bản tóm tắt học tập tự động lúc 20:00 hằng ngày
- **Là**: Phụ huynh học sinh
- **Tôi muốn**: Nhận được bản tóm tắt học tập của con vào 20:00 sau mỗi buổi học
- **Để**: Nắm rõ con đã học kiến thức gì, nhận xét của giáo viên và bài tập cần làm
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given*: Học sinh đã tham gia buổi học và giáo viên đã nhập nhận xét buổi học.
  - *When*: Đến 20:00 hằng ngày, background worker kích hoạt job tổng hợp `daily_summaries`.
  - *Then*: Hệ thống trích xuất dữ kiện chuyên cần, điểm kiểm tra từ vựng, tóm tắt bài học và nhận xét của giáo viên, gửi thông báo in-app và hiển thị trên Cổng phụ huynh. Nếu ngày đó con không có lịch học, không gửi thông báo rác.

---

## 3. CÁC MỤC TIÊU NGOÀI PHẠM VI (NON-GOALS)

1. **Không phát triển ứng dụng di động Native độc lập**:
   - Hiện tại ưu tiên website responsive chuẩn mực (hoạt động hoàn hảo từ màn hình 360px) kết hợp Progressive Web App (PWA). Không xây dựng app native iOS/Android riêng khi chưa có yêu cầu phát hành App Store.
2. **Không tự động tích hợp cổng thanh toán quốc tế (Stripe/PayPal)**:
   - Hệ thống tập trung tối ưu hóa thanh toán chuyển khoản nội địa qua VietQR và VNPay.
3. **Không xây dựng phân hệ quản trị tập đoàn cổ phần**:
   - Chỉ tập trung vào phân hệ đào tạo, học thuật, quản trị trung tâm và tài chính học phí thực tế.
