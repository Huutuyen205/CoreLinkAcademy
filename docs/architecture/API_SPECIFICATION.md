# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (REST API SPECIFICATION)
**Dự án**: CoreLink Academy  
**Phiên bản API**: `/api/v1`  
**Tài liệu OpenAPI**: Đầy đủ tại `http://localhost:4000/api/docs`  

---

## 1. Quy Chuẩn Chung Của API

- **Định dạng dữ liệu**: Toàn bộ yêu cầu và phản hồi sử dụng định dạng JSON UTF-8.
- **Tiêu chuẩn mã lỗi**:
  - `200 OK`: Truy vấn hoặc xử lý thành công.
  - `201 Created`: Tạo mới tài nguyên thành công.
  - `400 Bad Request`: Dữ liệu đầu vào không hợp lệ (ValidationPipe / Zod Error).
  - `401 Unauthorized`: Chưa đăng nhập hoặc Access Token hết hạn.
  - `403 Forbidden`: Người dùng không có quyền (RBAC Policy Guard).
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `429 Too Many Requests`: Vượt quá tần suất cho phép (Rate Limit hoặc AI Budget Limit).
  - `500 Internal Server Error`: Lỗi máy chủ chưa được kiểm soát.

---

## 2. Danh Mục Các Endpoint Nhóm Nghiệp Vụ

### 2.1. Xác Thực & Phân Quyền (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Đăng nhập bằng Email/SĐT và mật khẩu. Trả về Access Token (15m) & gán Refresh Token vào HTTP-only cookie.
- `POST /api/v1/auth/refresh`: Cấp mới Access Token từ Refresh Token hợp lệ.
- `POST /api/v1/auth/logout`: Thu hồi Refresh Token trong CSDL và xóa cookie.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu cho tài khoản (bắt buộc khi `must_change_password = true`).
- `POST /api/v1/auth/consent`: Lưu vết chấp thuận xử lý dữ liệu theo Nghị định 13/2023/NĐ-CP.

### 2.2. Tuyển Sinh & Khảo Thí Công Khai (`/api/v1/public`)
- `GET /api/v1/public/programs`: Danh sách khóa học đang tuyển sinh.
- `POST /api/v1/public/register-trial`: Đăng ký học thử hoặc nhận tư vấn (ghi nhận Lead vào CRM).
- `GET /api/v1/public/placement-test/:token`: Lấy đề thi kiểm tra xếp lớp trực tuyến theo token.
- `POST /api/v1/public/placement-test/:token/submit`: Nộp bài thi xếp lớp, tự động chấm điểm và gợi ý trình độ CEFR.
- `GET /api/v1/public/branches`: Thông tin các cơ sở trung tâm.
- `GET /api/v1/public/blog` *(Mới)*: Lấy danh sách bài viết chia sẻ mẹo học tiếng Anh và tài nguyên miễn phí.

### 2.3. Trợ Lý Tuyển Sinh AI RAG (`/api/v1/ai-chatbot`)
- `POST /api/v1/ai-chatbot/chat`: Trò chuyện với Chatbot AI tuyển sinh. Sử dụng tìm kiếm tương đồng vector (RAG) đối chiếu tài liệu Knowledge Base đã duyệt.
- `GET /api/v1/ai-chatbot/kb`: (Admin) Quản lý danh mục tài liệu Knowledge Base.
- `POST /api/v1/ai-chatbot/kb`: (Admin) Đăng tải và sinh vector embedding cho tài liệu mới.

### 2.4. Đào Tạo, Lớp Học & Điểm Danh (`/api/v1/academic` & `/api/v1/attendance`)
- `GET /api/v1/academic/classes`: Danh sách lớp học và tình trạng sĩ số.
- `GET /api/v1/academic/sessions`: Lịch học các buổi theo phòng và giáo viên.
- `POST /api/v1/attendance/teacher-checkin`: Giáo viên check-in GPS (<150m) và tải ảnh lớp học để kích hoạt buổi học.
- `GET /api/v1/attendance/qr-code/:sessionId`: Lấy mã QR điểm danh động (HMAC SHA-256, xoay vòng 30 giây).
- `POST /api/v1/attendance/qr-checkin`: Học sinh quét mã QR để ghi nhận điểm danh.

### 2.5. Khảo Thí, Bài Tập & Chống Gian Lận (`/api/v1/assessment`)
- `GET /api/v1/assessment/questions`: Ngân hàng câu hỏi phân loại theo kỹ năng và cấp độ.
- `POST /api/v1/assessment/exams`: Tạo đề kiểm tra hoặc đề thi thử (hỗ trợ đảo ngẫu nhiên câu hỏi).
- `POST /api/v1/assessment/submit`: Nộp bài thi của học sinh, tự động kiểm tra số lần chuyển tab (`tab_switches`) để phát hiện gian lận.
- `GET /api/v1/assessment/results/:attemptId`: Xem bảng điểm, lời giải chi tiết và gợi ý cải thiện.

### 2.6. Chấm Bài Tự Luận AI & Báo Cáo Phụ Huynh (`/api/v1/ai-grading` & `/api/v1/parents`)
- `POST /api/v1/ai-grading/essay`: Gửi bài viết tự luận tới Claude 3.5 Sonnet để dự thảo điểm và nhận xét chi tiết.
- `POST /api/v1/ai-grading/approve`: Giáo viên chỉnh sửa và phê duyệt điểm số bài luận.
- `GET /api/v1/parents/overview`: Phụ huynh xem tổng quan học tập của các con.
- `GET /api/v1/parents/reports/monthly`: Xem báo cáo tháng đã được giáo viên phê duyệt.

### 2.7. Tài Chính, Học Phí & Lương Giáo Viên (`/api/v1/finance`)
- `GET /api/v1/finance/invoices`: Danh sách hóa đơn học phí của học sinh.
- `POST /api/v1/finance/pay-tuition`: Khởi tạo thanh toán trực tuyến qua mã VietQR / VNPay.
- `POST /api/v1/finance/webhook`: Nhận thông báo IPN từ cổng thanh toán, tự động gạch nợ hóa đơn.
- `GET /api/v1/finance/teacher-payroll`: Tính toán bảng lương giáo viên dựa trên số buổi dạy thực tế.

### 2.8. Học Tập Thích Ứng & AI Tutor Nâng Cao (`/api/v1/competency` & `/api/v1/ai`)
- `GET /api/v1/competency/radar`: Lấy chỉ số năng lực 4 kỹ năng của học sinh (CEFR & IELTS).
- `POST /api/v1/competency/ai-tutor`: Trò chuyện giải đáp bài học 1-kèm-1 với AI Tutor.
- `POST /api/v1/ai/speaking-analyze` *(Mới)*: Phân tích file ghi âm/văn bản nói của học sinh (độ lưu loát, phát âm IPA, từ vựng theo chuẩn CEFR).
- `POST /api/v1/ai/vocabulary-review` *(Mới)*: Lấy danh sách từ vựng cần ôn tập hôm nay theo thuật toán lặp lại ngắt quãng SM-2.
