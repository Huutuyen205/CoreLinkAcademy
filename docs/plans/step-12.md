# KẾ HOẠCH BƯỚC 12: AI CHẤM BÀI & BÁO CÁO THÁNG PHỤ HUYNH (GĐ2)
*Mã bước: STEP-12 | Nhánh: `step-12-ai-grading` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
Triển khai BƯỚC 12 thuộc Giai đoạn 2 (GĐ2) theo đặc tả `CORELINK_MASTER.md`:
- **Nghiệp vụ M06, M07, M08, M09 mở rộng (GĐ2)**:
  - FR-607 / AI-06 (TC-092, TC-093): AI chấm bài viết tay từ ảnh và bài viết gõ theo rubric từng tiêu chí, trích câu cụ thể; ảnh mờ từ chối chấm, không bịa điểm; lưu điểm AI và điểm giáo viên xác nhận.
  - Chấm bài nói qua chuyển giọng nói thành văn bản (Gemini Transcribe) và chấm theo rubric nói.
  - FR-704 / AI-09 (TC-102): Nhận xét AI dựa trên dữ kiện, không suy diễn điều ngoài dữ liệu (ví dụ không có ghi chú thái độ thì không bịa ra nhận xét thái độ; giáo viên phải duyệt).
  - FR-803 (TC-107, TC-108): Báo cáo tháng cho phụ huynh (job ngày 28 soạn nháp hàng loạt, giáo viên duyệt cả lớp trên 1 màn hình, phụ huynh phản hồi, nhắc nhở ngày 3 nếu chưa duyệt).
  - FR-906 / AI-13 (TC-120): Gợi ý trả lời tin nhắn phụ huynh từ AI, chỉ hiện khi giáo viên bấm "Gợi ý", không bao giờ tự gửi.
  - Báo cáo đo độ lệch điểm AI so với giáo viên theo tháng.
- **Test cases (5 TCs trọng tâm + mở rộng)**:
  1. `TC-092 & TC-093` (FR-607): AI chấm bài viết tự động theo rubric, ảnh mờ báo lỗi không đọc được, lưu điểm AI và điểm giáo viên duyệt.
  2. `TC-102` (FR-704): Nhận xét AI chỉ dựa trên sự kiện có thật (điểm số, chuyên cần), không suy diễn thái độ.
  3. `TC-107` (FR-803): Soạn nháp báo cáo tháng hàng loạt và giáo viên duyệt cả lớp trên 1 màn hình.
  4. `TC-108` (FR-803): Tác vụ nhắc nhở ngày 3 khi còn báo cáo tháng chưa duyệt.
  5. `TC-120` (FR-906): Gợi ý trả lời tin nhắn từ AI không bao giờ tự động gửi.
  6. Đo lường độ lệch điểm giữa AI và Giáo viên (Monthly Score Divergence).
- **Màn hình Frontend**:
  - `apps/web/src/app/teacher/grading/ai-assist/page.tsx` (AI chấm bài viết tay & nói, xem ảnh gốc, bảng tiêu chí rubric, sửa và chốt điểm).
  - `apps/web/src/app/teacher/monthly-reports/page.tsx` (Duyệt báo cáo tháng hàng loạt cả lớp).
  - `apps/web/src/app/parent/monthly-reports/page.tsx` (Phụ huynh xem báo cáo tháng và gửi phản hồi).

---

## 2. Thiết kế Kỹ thuật (Tech Lead)

### 2.1. Backend Module `apps/api/src/modules/ai-grading/`
- `AiGradingService`:
  - `gradeWritingEssay(dto)`:
    - Kiểm tra ảnh bài viết: nếu cờ `is_blurry: true` hoặc chất lượng ảnh mờ dưới ngưỡng -> ném lỗi hoặc trả kết quả `is_unreadable: true, message: 'Ảnh mờ không đọc được, vui lòng chụp lại rõ nét'` (TC-093).
    - OCR văn bản: trích xuất nội dung bài viết.
    - Đánh giá theo 4 tiêu chí rubric IELTS/CEFR (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Accuracy).
    - Trích xuất dẫn chứng cụ thể từ bài viết của học sinh trong feedback.
    - Lưu vào `answers` với `ai_points` và `ai_feedback` (TC-092).
  - `confirmTeacherGrade(answerId, dto)`:
    - Giáo viên chỉnh sửa hoặc xác nhận điểm: lưu `final_points`, ghi nhận độ lệch `deviation = |final_points - ai_points|`.
  - `generateAiStudentEvaluation(studentId, facts)`:
    - Tạo nhận xét học tập dựa DUY NHẤT trên các dữ kiện thực tế được cung cấp (`attendance_rate`, `test_average`, `homework_done`).
    - Nếu không có dữ liệu thái độ (`attitude` không được ghi chú), nhận xét hoàn toàn KHÔNG suy diễn hoặc nhắc đến thái độ học sinh (TC-102).
  - `generateMonthlyReportsBatch(classId, month)`:
    - Quét toàn bộ học sinh trong lớp, tổng hợp số liệu tháng và tạo bản ghi `monthly_reports` trạng thái `drafted` (TC-107).
  - `approveMonthlyReportsBatch(dto, teacherId)`:
    - Giáo viên chỉnh sửa nội dung từng em và duyệt hàng loạt: cập nhật `status = 'approved'`, `approved_by = teacherId`, `approved_at = new Date()`, chuyển sang gửi phụ huynh `sent_at` (TC-107).
  - `checkPendingMonthlyReportsReminder(month)`:
    - Quét các báo cáo tháng còn ở trạng thái `drafted` sau ngày 3 của tháng tiếp theo. Tạo thông báo nhắc nhở gửi cho giáo viên và giáo vụ (TC-108).
  - `suggestMessageReply(dto)`:
    - Tạo văn bản nháp gợi ý trả lời tin nhắn của phụ huynh. Trả về cho frontend, KHÔNG thực hiện lưu hoặc gửi vào bảng `messages` (TC-120).
  - `getMonthlyGradingDeviation(branchId, month)`:
    - Thống kê độ lệch điểm giữa AI và Giáo viên.

---
