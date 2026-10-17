# Báo Cáo Hoàn Thành Bước 15: M07/M12/M13 Giai Đoạn 3 - Trợ Lý Điều Hành AI & Chỉ Số Đánh Giá

## 1. Mục Tiêu & Phạm Vi (Scope)
Thực hiện các tính năng Giai đoạn 3 của Phân hệ M07, M12, M13 và M03 theo `docs/CORELINK_MASTER.md`:
- **TC-137 (FR-1204 / AI-14)**: Trợ lý số liệu cho Admin bằng câu hỏi tự nhiên ("tháng này bao nhiêu học sinh mới từ Facebook?"). Chế độ **CHỈ ĐỌC (Read-Only)**; từ chối mọi thao tác ghi/sửa/xóa (ví dụ: "xóa giúp tôi khách tháng 10") và chỉ cung cấp số liệu phân tích kèm bảng số liệu gốc minh bạch.
- **TC-140 (FR-1302)**: Chỉ số giáo viên theo tháng (`teacher_metrics`). Phụ huynh chỉ được xem sao trung bình và số lượt đánh giá của giáo viên trực tiếp dạy con mình; nếu gọi API giáo viên khác sẽ nhận mã lỗi `HTTP 403 Forbidden`. Admin/Academic được xem toàn bộ các chỉ số nội bộ (thời gian phản hồi tin nhắn tự động đo qua timestamp không đọc nội dung theo FR-1302, tỷ lệ chấm đúng hạn, chuyên cần).
- **FR-705 (AI-10)**: Cảnh báo sớm học sinh có nguy cơ tụt điểm hoặc bỏ học kèm lý do cụ thể (điểm đọc giảm 3 bài liên tiếp, vắng 2 buổi không phép, thiếu bài tập) và giải pháp can thiệp.
- **FR-307 (AI-11)**: Gợi ý xếp lớp theo năng lực và phân công giáo viên theo năng lực (kèm lý do giải thích), Admin phê duyệt trước khi áp dụng.

---

## 2. Các Thành Phần Triển Khai

### Backend (NestJS + Prisma + MySQL 8.4)
- **Module**: `apps/api/src/modules/ai-assistant/`
  - `ai-assistant.service.ts`:
    - `getTeacherMetrics(teacherId, userId, userRoles)`: Kiểm tra quan hệ Phụ huynh - Giáo viên (TC-140); ném `ForbiddenException` nếu không dạy con của phụ huynh; trả về các chỉ số phân quyền.
    - `askExecutiveAssistant(dto, userId)`: Phân tích intent câu hỏi ngôn ngữ tự nhiên; phát hiện lệnh sửa/xóa và trả cờ `isReadOnlyRefusal: true` cùng bảng số liệu thống kê chỉ đọc (TC-137).
    - `getEarlyWarnings(branchId)`: Danh sách cảnh báo học sinh nguy cơ kèm lý do chi tiết và đề xuất can thiệp (FR-705).
    - `getPlacementSuggestions(branchId)` & `applyPlacementSuggestion(id, adminId)`: Thuật toán gợi ý xếp lớp và phân công GV với độ tương thích và giải thích (FR-307).
  - `ai-assistant.controller.ts`:
    - `GET /ai-assistant/teacher-metrics/:teacherId`
    - `POST /ai-assistant/ask`
    - `GET /ai-assistant/early-warnings`
    - `GET /ai-assistant/placement-suggestions`
    - `POST /ai-assistant/placement-suggestions/:id/apply`
  - Đăng ký vào `apps/api/src/app.module.ts`.

### Automated E2E Testing
- File: `apps/api/test/ai-assistant.e2e-spec.ts`
  - 8/8 test cases đạt 100% PASS:
    1. Admin hỏi câu hỏi phân tích thống kê hợp lệ -> Trả lời kèm bảng số liệu gốc.
    2. Admin hỏi lệnh ghi/xóa ("xóa giúp tôi khách tháng 10") -> Hệ thống TỪ CHỐI thao tác ghi, chỉ trả dữ liệu chỉ đọc (TC-137).
    3. Phụ huynh mở trang GV của con (Thầy A) -> Thấy sao trung bình và số lượt đánh giá (TC-140).
    4. Phụ huynh gọi API metrics của GV khác (Cô B không dạy con) -> Trả về 403 Forbidden (TC-140).
    5. Admin xem chỉ số nội bộ của giáo viên -> Thấy đầy đủ các chỉ số chuyên môn.
    6. Lấy danh sách cảnh báo sớm kèm lý do cụ thể và hành động đề xuất (FR-705).
    7. Lấy danh sách gợi ý xếp lớp với giải thích lý do (FR-307).
    8. Admin bấm duyệt gợi ý xếp lớp -> Áp dụng thành công (FR-307).

### Frontend (Next.js 15 Tailwind UI)
- `apps/web/src/app/admin/executive-assistant/page.tsx` (Màn hình S38): Giao diện hội thoại hỏi đáp số liệu AI cho Admin, chế độ bảo vệ Read-Only, các câu hỏi mẫu nhanh, render bảng dữ liệu có chức năng sao chép.
- `apps/web/src/app/admin/early-warning/page.tsx` (Màn hình S36): Bảng điều khiển cảnh báo sớm học sinh nguy cơ tụt điểm/bỏ học, lọc theo mức độ rủi ro, thẻ hành động gọi phụ huynh/xếp lịch phụ đạo, tab gợi ý xếp lớp và phân công giáo viên cho Admin phê duyệt.
- Cập nhật liên kết điều hướng tại `apps/web/src/app/admin/dashboard/page.tsx`.

---

## 3. Kết Quả Kiểm Thử
- **E2E Tests**: 8/8 passed.
- **Web Build**: Tất cả 51 routes Next.js compile và prerender tĩnh thành công 100%.
