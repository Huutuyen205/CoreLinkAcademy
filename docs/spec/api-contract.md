# HỢP ĐỒNG GIAO TIẾP DỊCH VỤ — CORELINK ACADEMY (API CONTRACT)

**Dự án**: CoreLink Academy  
**Tiêu chuẩn áp dụng**: RESTful API v1, RFC 7807 (Problem Details), OpenAPI 3.0  
**Phiên bản**: 2.0  
**Tác giả**: Backend & Solution Architect  

---

## 1. QUY ƯỚC CHUNG & TIÊU CHUẨN ĐỊNH DẠNG

1. **Base URL**: `https://api.corelink.edu.vn/api/v1` (Môi trường local: `http://localhost:4000/api/v1`).
2. **Cơ chế Phân trang bằng Con trỏ (Cursor Pagination)**:
   - Request: `GET /resource?limit=20&cursor=uuid-item`
   - Response:
     ```json
     {
       "data": [...],
       "pageInfo": {
         "hasNextPage": true,
         "nextCursor": "uuid-next-item",
         "totalCount": 150
       }
     }
     ```
3. **Cấu trúc Lỗi Chuẩn RFC 7807**:
   ```json
   {
     "type": "https://corelink.edu.vn/errors/conflict-schedule",
     "title": "Xung đột lịch học",
     "status": 409,
     "detail": "Phòng LAB 01 đã có lịch giảng dạy vào khung giờ này.",
     "errors": [
       { "field": "roomId", "code": "ROOM_UNAVAILABLE" }
     ],
     "correlationId": "req-89fb-10294"
   }
   ```

---

## 2. DANH MỤC CÁC ENDPOINT CHI TIẾT THEO DOMAIN

### 2.1. Phân hệ Xác thực & Quyền hạn (Authentication)
- `POST /api/v1/auth/login`:
  - Request: `{ "identifier": "admin@corelink.edu.vn", "password": "String" }`
  - Response: `{ "accessToken": "jwt", "user": { "id": "uuid", "role": "SUPER_ADMIN" } }` + Set-Cookie: `refreshToken` (HttpOnly).
- `POST /api/v1/auth/refresh`:
  - Lấy `refreshToken` từ cookie, xoay vòng token và trả về `accessToken` 15 phút mới.
- `POST /api/v1/auth/logout`:
  - Xóa Refresh Token trong CSDL và dọn sạch cookie client.
- `POST /api/v1/auth/consent`:
  - Request: `{ "scope": "data_processing", "isAgreed": true }`

### 2.2. Phân hệ Tuyển sinh & Leads (Admissions & CRM)
- `POST /api/v1/public/leads`:
  - Request: `{ "fullName": "String", "phone": "0912345678", "programCode": "IELTS-65", "notes": "String", "consentDataProcessing": true }`
  - Response: `{ "success": true, "leadId": "uuid", "message": "Đăng ký thành công" }`
- `GET /api/v1/leads`:
  - Quyền: `ADMISSIONS`, `SUPER_ADMIN`.
  - Query: `?status=NEW&search=Nguyen`
- `POST /api/v1/leads/:id/convert`:
  - Quyền: `ADMISSIONS`, `SUPER_ADMIN`.
  - Request: `{ "classId": "uuid", "feePlanId": "uuid", "depositAmount": 2000000 }`
  - Response: `{ "studentId": "uuid", "enrollmentId": "uuid", "invoiceId": "uuid" }`

### 2.3. Phân hệ Chatbot AI (Admissions AI RAG)
- `POST /api/v1/ai-chatbot/query`:
  - Request: `{ "query": "Học phí khóa IELTS 6.5 là bao nhiêu?", "sessionId": "optional-uuid" }`
  - Response: `{ "answer": "String", "citedDocs": ["IELTS-Policy-2026"], "leadCaptureSuggested": false }`

### 2.4. Phân hệ Quản lý Đào tạo (Academic & Scheduling)
- `GET /api/v1/academic/classes`:
  - Danh sách lớp học kèm tỷ lệ lấp đầy sĩ số hiện tại.
- `POST /api/v1/academic/classes`:
  - Request: `{ "programId": "uuid", "name": "IELTS-A1", "maxCapacity": 12, "schedule": { "days": [1, 3, 5], "time": "18:00-19:30" } }`
  - Tự động sinh `class_sessions` và kiểm tra va chạm ngày nghỉ trong `holidays`.
- `POST /api/v1/academic/classes/check-conflicts`:
  - Request: `{ "teacherId": "uuid", "roomId": "uuid", "timeSlots": [...] }`
  - Response: `{ "hasConflict": false, "conflicts": [] }`

### 2.5. Phân hệ Điểm danh & Chuyên cần (Attendance)
- `GET /api/v1/attendance/qr-code/:sessionId`:
  - Quyền: `TEACHER`, `ACADEMIC`.
  - Response: `{ "qrToken": "hmac-sha256-jwt", "expiresIn": 30 }`
- `POST /api/v1/attendance/checkin-teacher`:
  - Quyền: `TEACHER`.
  - Request: `{ "sessionId": "uuid", "latitude": 21.0285, "longitude": 105.8542, "photoUrl": "minio-url" }`
  - Response: `{ "verified": true, "sessionStatus": "IN_PROGRESS" }`
- `POST /api/v1/attendance/scan-student`:
  - Quyền: `STUDENT`.
  - Request: `{ "qrToken": "hmac-string" }`
  - Response: `{ "recorded": true, "status": "PRESENT" }`

### 2.6. Phân hệ Khảo thí & Chấm thi (Assessment)
- `POST /api/v1/assessment/exams/:id/start`:
  - Quyền: `STUDENT`.
  - Response: Đề thi đã xáo trộn câu hỏi và các lựa chọn; không chứa `answer_key`.
- `POST /api/v1/assessment/attempts/:id/submit`:
  - Quyền: `STUDENT`.
  - Request: `{ "answers": [{ "questionId": "uuid", "selectedOption": 1 }] }`
  - Response: `{ "totalScore": 8.5, "passed": true, "completedAt": "UTC" }`

### 2.7. Phân hệ Tài chính & Học phí (Finance)
- `POST /api/v1/finance/payments`:
  - Quyền: `ACCOUNTANT`, `SUPER_ADMIN`.
  - Request: `{ "invoiceId": "uuid", "amount": 5000000, "method": "BANK_TRANSFER", "ref": "VNPAY-8910" }`
  - Response: `{ "receiptNumber": "REC-2026-0001", "remainingBalance": 0 }`
