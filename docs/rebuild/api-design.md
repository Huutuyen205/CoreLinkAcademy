# THIẾT KẾ GIAO DIỆN LẬP TRÌNH — CORELINK ACADEMY (API DESIGN)

**Tài liệu**: Đặc tả Chuẩn REST API v1 & WebSocket Gateway  
**Tiêu chuẩn định dạng**: RESTful JSON, RFC 7807 (Problem Details for HTTP APIs), OpenAPI 3.0  
**Phiên bản**: 2.0  

---

## 1. NGUYÊN TẮC THIẾT KẾ & QUY ƯỚC CHUNG

1. **Đường dẫn Tiền tố (Base Path)**: Tất cả các endpoint của dịch vụ được định tuyến qua tiền tố có phiên bản rõ ràng:
   ```
   https://domain.com/api/v1/{resource}
   ```
2. **Quy ước Đặt tên (Naming Conventions)**:
   - Danh từ số nhiều cho tài nguyên (VD: `/api/v1/classes`, `/api/v1/students`, `/api/v1/invoices`).
   - Query Parameters và Payload theo định dạng `camelCase` trong mã nguồn TypeScript/JSON; ánh xạ trực tiếp sang `snake_case` trong CSDL qua Prisma `@map`.
3. **Cơ chế Phân trang bằng Con trỏ (Cursor-Based Pagination)**:
   - Đối với các danh sách lớn (nhật ký, bài kiểm tra, tin nhắn):
     - `GET /api/v1/messages?cursor={message_id}&limit=50`
   - Response trả về cấu trúc chuẩn:
     ```json
     {
       "data": [...],
       "pageInfo": {
         "hasNextPage": true,
         "nextCursor": "uuid-next-element",
         "totalCount": 240
       }
     }
     ```
4. **Xử lý Lỗi Thống nhất theo Chuẩn RFC 7807**:
   - Mọi mã lỗi 4xx/5xx đều trả về định dạng Problem Details chuẩn mực:
     ```json
     {
       "type": "https://corelink.edu.vn/errors/conflict-schedule",
       "title": "Xung đột lịch học",
       "status": 409,
       "detail": "Phòng LAB 01 đã có lớp IELTS_A2 học vào khung giờ 18:00 - 19:30 thứ Hai.",
       "errors": [
         { "field": "roomId", "code": "ROOM_UNAVAILABLE" }
       ],
       "correlationId": "req-98fa-284920"
     }
     ```

---

## 2. DANH MỤC CÁC ENDPOINT CHÍNH THEO NHÓM MIỀN

### 2.1. Phân hệ Xác thực & Quyền hạn (Auth & Identity)
- `POST /api/v1/auth/login`: Đăng nhập bằng Email/SĐT/Mã học sinh và mật khẩu. Trả về thông tin người dùng và thiết lập HttpOnly Refresh Token Cookie.
- `POST /api/v1/auth/refresh`: Cấp lại Access Token 15 phút mới thông qua việc xoay vòng Refresh Token.
- `POST /api/v1/auth/logout`: Hủy bỏ phiên làm việc và thu hồi Refresh Token trong cơ sở dữ liệu.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu tài khoản (bắt buộc trong lần đầu đăng nhập bằng mật khẩu tạm).
- `POST /api/v1/auth/consent`: Lưu trữ thỏa thuận đồng ý xử lý dữ liệu cá nhân theo Nghị định 13.

### 2.2. Phân hệ Tuyển sinh & Tiếp thị (Admissions & Leads)
- `GET /api/v1/public/courses`: Danh sách các khóa học công khai trên trang chủ.
- `POST /api/v1/public/leads`: Tiếp nhận biểu mẫu đăng ký học thử / tư vấn trực tuyến (lưu UTM, nguồn tiếp thị).
- `GET /api/v1/leads`: [CRM Staff] Danh sách khách tiềm năng, lọc theo giai đoạn phễu.
- `PATCH /api/v1/leads/:id/status`: Cập nhật trạng thái chăm sóc khách hàng.
- `POST /api/v1/leads/:id/convert`: Chuyển đổi khách tiềm năng thành học viên chính thức trong 1 transaction.

### 2.3. Phân hệ Chatbot AI & Tri thức Tuyển sinh (AI Chatbot RAG)
- `POST /api/v1/ai-chatbot/query`: Gửi câu hỏi tư vấn từ khách thăm quan (xử lý RAG, Vector Search và phản hồi tức thời kèm nguồn trích dẫn).
- `GET /api/v1/admin/knowledge-base`: [Admin] Quản lý danh mục tài liệu tuyển sinh, duyệt và kích hoạt chunk embedding.

### 2.4. Phân hệ Quản lý Đào tạo (Academic & Scheduling)
- `GET /api/v1/academic/programs`: Danh mục chương trình đào tạo.
- `GET /api/v1/academic/classes`: Danh sách lớp học kèm tỷ lệ lấp đầy sĩ số.
- `POST /api/v1/academic/classes`: Tạo lớp học mới và tự động sinh danh sách buổi học (`class_sessions`).
- `POST /api/v1/academic/classes/check-conflicts`: Kiểm tra xung đột lịch học trước khi xếp lịch.
- `POST /api/v1/academic/classes/:id/enroll`: Ghi danh học sinh vào lớp học có kiểm tra sức chứa.

### 2.5. Phân hệ Điểm danh & Chuyên cần (Attendance)
- `GET /api/v1/attendance/qr-code/:sessionId`: Sinh mã QR động mã hóa HMAC-SHA256 (xoay 30 giây).
- `POST /api/v1/attendance/checkin-teacher`: Giáo viên gửi tọa độ GPS và ảnh chụp lớp để mở buổi học chính thức.
- `POST /api/v1/attendance/scan-student`: Học sinh quét mã QR để ghi nhận có mặt.
- `PATCH /api/v1/attendance/sessions/:sessionId/records`: [Giáo vụ] Điều chỉnh điểm danh thủ công kèm lý do và ghi nhận audit log.

### 2.6. Phân hệ Khảo thí & Bài thi (Assessment)
- `GET /api/v1/assessment/questions`: Ngân hàng câu hỏi phân tầng CEFR.
- `POST /api/v1/assessment/exams`: Tạo đề kiểm tra trực tuyến.
- `POST /api/v1/assessment/exams/:id/start`: Bắt đầu lượt làm bài thi (sinh phiên làm bài và kích hoạt đồng hồ).
- `POST /api/v1/assessment/attempts/:id/submit`: Nộp bài thi và nhận điểm trắc nghiệm tức thời.
- `POST /api/v1/ai-grading/essay`: [Giáo viên] Gửi bài viết tự luận tới AI để nhận phân tích ngữ pháp, từ vựng và gợi ý điểm.

### 2.7. Phân hệ Tài chính, Học phí & Lương (Finance & Payroll)
- `GET /api/v1/finance/invoices`: Danh sách hóa đơn học phí của học viên.
- `POST /api/v1/finance/payments`: Ghi nhận thu học phí (khóa dòng cấp biên nhận không trùng).
- `GET /api/v1/finance/payrolls`: Bảng tính lương giáo viên theo tháng.
- `POST /api/v1/finance/payrolls/:id/finalize`: Chốt kỳ lương giáo viên.

---

## 3. REAL-TIME WEBSOCKET GATEWAY

Hệ thống cung cấp Gateway Socket.IO tại `/socket.io` phục vụ truyền phát dữ liệu thời gian thực:
- `event:attendance:update`: Báo động chuyên cần ngay khi học sinh điểm danh thành công.
- `event:message:receive`: Nhận tin nhắn trao đổi 1-1 giữa giáo viên và phụ huynh.
- `event:notification:new`: Thông báo nhắc lịch học, kết quả điểm số hoặc hóa đơn học phí mới.
