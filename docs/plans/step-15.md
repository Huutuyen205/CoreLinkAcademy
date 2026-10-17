# Kế Hoạch Triển Khai Bước 15: Trợ Lý Điều Hành AI & Chỉ Số Đánh Giá (GĐ3)

## 1. Mục Tiêu & Yêu Cầu Kỹ Thuật
- **Phân hệ**: M07 (Học sinh - cảnh báo sớm), M12 (Thống kê - Hỏi đáp tự nhiên), M13 (Khảo sát & Đánh giá giáo viên), M03 (Đào tạo - gợi ý xếp lớp/phân công GV).
- **Yêu cầu nghiệp vụ**:
  - **FR-1302 & TC-140**: Chỉ số giáo viên theo tháng (`teacher_metrics`): điểm khảo sát, chuyên cần lớp, tiến bộ học sinh, thời gian phản hồi tin nhắn (chỉ tính theo timestamp, tuyệt đối KHÔNG đọc nội dung), tỷ lệ chấm bài đúng hạn. Phụ huynh chỉ được xem điểm tổng hợp của giáo viên dạy con mình; nếu gọi API giáo viên khác phải trả về `HTTP 403 Forbidden`.
  - **FR-1204 & TC-137 (AI-14)**: Trợ lý số liệu cho Admin qua câu hỏi ngôn ngữ tự nhiên. Chế độ CHỈ ĐỌC (Read-only). Khi người dùng yêu cầu thao tác ghi/xóa (ví dụ: "xóa giúp tôi khách tháng 10"), hệ thống phải TỪ CHỐI thao tác ghi, chỉ trả về dữ liệu/số liệu thống kê kèm bảng số liệu gốc.
  - **FR-705 (AI-10)**: Cảnh báo sớm học sinh có nguy cơ tụt điểm hoặc bỏ học kèm lý do cụ thể (ví dụ: điểm đọc giảm 3 bài liên tiếp, vắng 2 buổi liền), gửi giáo viên và Giáo vụ hàng tuần.
  - **FR-307 (AI-11)**: Gợi ý xếp lớp theo năng lực và phân công giáo viên theo năng lực (kèm lý do giải thích), Admin phê duyệt trước khi áp dụng.

## 2. Thiết Kế Backend (`apps/api/src/modules/ai-assistant/`)
- `ai-assistant.service.ts`:
  - `computeTeacherMetrics(teacherId, month)`
  - `getTeacherMetrics(teacherId, requesterUserId, requesterRole)`: Kiểm tra quan hệ phụ huynh - giáo viên (TC-140); ném ForbiddenException nếu phụ huynh không có con học lớp của giáo viên này.
  - `askExecutiveAssistant(question, userRole)`: Phân tích intent. Nếu phát hiện lệnh sửa/xóa (TC-137), từ chối thực hiện thao tác ghi và trả lời giải thích kèm bảng số liệu chỉ đọc.
  - `getEarlyWarnings(branchId)`: Phát hiện học sinh tụt điểm / vắng nhiều (FR-705).
  - `getPlacementSuggestions(branchId)`: Gợi ý xếp lớp & giáo viên (FR-307).
  - `applyPlacementSuggestion(suggestionId, approvedBy)`
- `ai-assistant.controller.ts`:
  - `GET /ai-assistant/teacher-metrics/:teacherId`: Có RBAC & kiểm tra phụ huynh hợp lệ (TC-140).
  - `POST /ai-assistant/ask`: Trợ lý điều hành AI chỉ đọc (TC-137).
  - `GET /ai-assistant/early-warnings`: Danh sách cảnh báo sớm học sinh có nguy cơ.
  - `GET /ai-assistant/placement-suggestions`: Gợi ý xếp lớp & phân công GV.
  - `POST /ai-assistant/placement-suggestions/:id/apply`: Admin phê duyệt gợi ý.
- `ai-assistant.module.ts`: Đăng ký vào `app.module.ts`.

## 3. Automated E2E Test (`apps/api/test/ai-assistant.e2e-spec.ts`)
- Kiểm thử đầy đủ TC-137, TC-140, FR-705, FR-307.

## 4. Giao Diện Người Dùng (Next.js 15 Tailwind UI)
- `apps/web/src/app/admin/executive-assistant/page.tsx` (S38)
- `apps/web/src/app/admin/early-warning/page.tsx` (S36)
