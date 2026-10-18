# TIÊU CHÍ NGHIỆM THU HỆ THỐNG — CORELINK ACADEMY (ACCEPTANCE CRITERIA)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Tác giả**: Product Manager & Lead QA Engineer  

---

## 1. TIÊU CHÍ NGHIỆM THU THEO PHÂN HỆ NGHIỆP VỤ

### 1.1. Website Công khai & Tiếp nhận Khách tiềm năng (Public & Admissions)
- [x] **AC-PUB-01**: Trang chủ tải nhanh dưới 2.5 giây, hiển thị đầy đủ thông điệp giá trị, lộ trình học và đội ngũ giảng viên có chứng chỉ quốc tế.
- [x] **AC-PUB-02**: Biểu mẫu đăng ký học thử tự động chuẩn hóa số điện thoại về `+84`, kiểm tra trùng lặp và lưu thành công vào bảng `leads` trong cơ sở dữ liệu.
- [x] **AC-PUB-03**: Chatbot tuyển sinh AI phản hồi chính xác thông tin học phí và lộ trình từ kho tài liệu đã duyệt, không bịa đặt và từ chối các câu hỏi ngoài phạm vi.
- [x] **AC-PUB-04**: Khách làm bài kiểm tra trình độ 3 phút nhận được kết quả dự kiến (A2/B1/B2/C1) và gợi ý khóa học tương ứng.

### 1.2. Xác thực & Phân quyền Bảo mật (Auth & RBAC)
- [x] **AC-AUTH-01**: Đăng nhập bằng Email/SĐT/Mã học sinh với mật khẩu được bảo vệ bởi thuật toán băm Argon2id.
- [x] **AC-AUTH-02**: Tự động khóa tài khoản 15 phút sau 5 lần đăng nhập thất bại liên tiếp.
- [x] **AC-AUTH-03**: Quản trị viên (Super Admin) bắt buộc phải xác thực 2 yếu tố (2FA TOTP) mới được cấp quyền truy cập.
- [x] **AC-AUTH-04**: Phân quyền 2 lớp ngăn chặn triệt để lỗ hổng IDOR: Giảng viên chỉ xem lớp mình dạy, Phụ huynh chỉ xem con mình, Học sinh chỉ xem dữ liệu cá nhân.

### 1.3. Quản lý Đào tạo, Lớp học & Thời khóa biểu (Academic)
- [x] **AC-ACAD-01**: Tạo lớp học tự động sinh danh sách buổi học cụ thể, tự động loại trừ các ngày nghỉ lễ quốc gia trong bảng `holidays`.
- [x] **AC-ACAD-02**: Thuật toán quét xung đột 3 chiều phát hiện và chặn việc trùng phòng học, trùng giáo viên hoặc trùng học viên; trả về mã lỗi 409 chi tiết.
- [x] **AC-ACAD-03**: Ghi danh học viên kiểm soát sĩ số nghiêm ngặt theo `classes.max_capacity`, từ chối ghi danh khi lớp học đã đủ chỗ.

### 1.4. Điểm danh & Chuyên cần (Attendance)
- [x] **AC-ATT-01**: Giáo viên mở lớp học trực tiếp bắt buộc chụp ảnh lớp và gửi tọa độ GPS trong bán kính 150m so với cơ sở mới xác thực buổi dạy thành công.
- [x] **AC-ATT-02**: Mã QR điểm danh mã hóa bằng chữ ký số HMAC-SHA256 đổi mới mỗi 30 giây; học sinh quét mã thành công được cập nhật trạng thái có mặt ngay lập tức.
- [x] **AC-ATT-03**: Tự động cảnh báo Giáo vụ khi học sinh có dấu hiệu vắng mặt không phép 2 buổi liên tiếp.

### 1.5. Khảo thí, Bài tập & Đánh giá (Assessment)
- [x] **AC-EXAM-01**: Ngân hàng câu hỏi phân loại chi tiết theo khung năng lực Cambridge/CEFR và độ khó.
- [x] **AC-EXAM-02**: Làm bài thi trắc nghiệm trực tuyến có đồng hồ đếm ngược, tự động nộp bài khi hết giờ và chấm điểm tức thời (< 2 giây).
- [x] **AC-EXAM-03**: Chấm bài tự luận có hỗ trợ của AI phân tích ngữ pháp, từ vựng và gợi ý điểm, nhưng điểm số cuối cùng bắt buộc phải do giảng viên phê duyệt.

### 1.6. Tài chính, Học phí & Lương Giảng viên (Finance)
- [x] **AC-FIN-01**: Lập hóa đơn và theo dõi dòng tiền thanh toán; cấp biên nhận thu tiền có số chứng từ tuần tự không trùng lặp qua khóa dòng bi quan.
- [x] **AC-FIN-02**: Tính lương giảng viên tự động chỉ dựa trên các buổi học đã được xác thực chuyên cần thành công; hỗ trợ giáo viên gửi phản hồi trước khi chốt kỳ lương.
- [x] **AC-FIN-03**: Mọi số liệu tiền tệ sử dụng kiểu số thực chính xác `Decimal(12, 2)`, không có sai số làm tròn.

### 1.7. Cổng Phụ huynh & Kết nối Gia đình (Parent Portal)
- [x] **AC-PAR-01**: Cổng phụ huynh tối ưu hóa trên điện thoại di động, hỗ trợ chuyển đổi mượt mà giữa các con.
- [x] **AC-PAR-02**: Bản tóm tắt học tập cá nhân hóa được tự động tổng hợp và gửi lúc 20:00 sau mỗi buổi học có hoạt động.
- [x] **AC-PAR-03**: Bảng tin lớp học một chiều chỉ cho phép giảng viên đăng thông báo; phụ huynh bấm xác nhận đã đọc tin.

---

## 2. TIÊU CHÍ KỸ THUẬT VÀ PHI CHỨC NĂNG (NFR ACCEPTANCE)
- [x] **NFR-01**: `pnpm --recursive typecheck` đạt 100% không có lỗi kiểu dữ liệu trên cả 5 dự án.
- [x] **NFR-02**: `pnpm --recursive build` hoàn tất sản sinh 55/55 routes tĩnh & động mà không có cảnh báo CSS.
- [x] **NFR-03**: Giao diện responsive mượt mà từ màn hình 360px, không bị cuộn ngang.
- [x] **NFR-04**: Không có bất kỳ thông tin mật khẩu, secret hay API key nào bị commit vào Git.
