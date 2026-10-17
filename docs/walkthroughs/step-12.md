# TỔNG KẾT BƯỚC 12: AI CHẤM BÀI & BÁO CÁO PHỤ HUYNH (GĐ2)
*Mã bước: STEP-12 | Nhánh: `step-12-ai-grading` | Kết quả: Hoàn thành 100% | TC đạt: 5/5*

---

## 1. Kết quả thực hiện

### 1.1. Backend API (`apps/api/src/modules/ai-grading/`)
- **FR-607 / AI-06 (TC-092 & TC-093): AI chấm bài viết tay & bảo vệ ảnh mờ**:
  - `POST /api/v1/ai-grading/writing`:
    - Nếu ảnh bị mờ (`is_blurry: true`): Hệ thống phát hiện và từ chối chấm với mã lỗi `IMAGE_BLURRY_UNREADABLE`, tuyệt đối không gán điểm giả định hoặc suy đoán (TC-093).
    - Nếu ảnh rõ nét: OCR trích xuất văn bản, chấm 4 tiêu chí chuẩn IELTS/CEFR (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Accuracy), trích dẫn câu cụ thể làm bằng chứng cho từng tiêu chí, lưu `ai_points` và `ai_feedback` (TC-092).
  - `POST /api/v1/ai-grading/confirm/:answerId`: Giáo viên xem xét bản chữ nhận được, điều chỉnh và xác nhận điểm cuối cùng (`final_points`), tự động cập nhật độ lệch và điểm bài làm `attempts.final_score`.
- **Chấm bài nói (Speaking)**:
  - `POST /api/v1/ai-grading/speaking`: Nhận dạng giọng nói (Gemini Transcribe) và chấm theo 4 tiêu chí nói (Pronunciation, Fluency, Lexical, Grammar).
- **FR-704 / AI-09 (TC-102): Nhận xét AI thuần túy dựa trên dữ kiện**:
  - `POST /api/v1/ai-grading/evaluation-facts`: Tổng hợp nhận xét học tập dựa trên chuyên cần, điểm trung bình và tỷ lệ nộp bài tập. Nếu dữ kiện không có ghi chú về thái độ, AI tuyệt đối không suy diễn hoặc nhận xét về thái độ học sinh.
- **FR-803 (TC-107 & TC-108): Báo cáo tháng cho phụ huynh & Nhắc nhở duyệt**:
  - `POST /api/v1/ai-grading/monthly-reports/generate-batch`: Job ngày 28 tự động soạn nháp hàng loạt báo cáo tháng (`status = 'drafted'`) cho toàn bộ học sinh trong lớp.
  - `POST /api/v1/ai-grading/monthly-reports/approve-batch`: Giáo viên hiệu chỉnh và duyệt cả lớp trên 1 màn hình (`status = 'sent'`, `approved_by` được cập nhật, đáp ứng ràng buộc `ck_mrep_sent`).
  - `GET /api/v1/ai-grading/monthly-reports/reminder-check`: Tác vụ ngày 3 phát hiện báo cáo tháng chưa duyệt và gửi thông báo đôn đốc cho Giáo viên và Giáo vụ.
- **FR-906 / AI-13 (TC-120): Gợi ý trả lời tin nhắn phụ huynh từ AI**:
  - `POST /api/v1/ai-grading/suggest-reply`: Sinh bản nháp gợi ý trả lời tin nhắn phụ huynh (học phí, lịch học, tiến độ). Trả về cho frontend với cờ `automatically_sent: false`, tuyệt đối KHÔNG tự động gửi vào bảng `messages`.
- **Đo lường độ lệch điểm giữa AI và Giáo viên**:
  - `GET /api/v1/ai-grading/deviation`: Thống kê độ lệch trung bình (MAE) và tỷ lệ đồng thuận điểm số trong tháng.

### 1.2. Màn hình Frontend Next.js (3 Màn hình)
- **S28 (`apps/web/src/app/teacher/grading/ai-assist/page.tsx`)**: Màn hình trợ lý chấm bài viết và bài nói, giả lập ảnh mờ vs ảnh rõ nét, bảng phân tích 4 tiêu chí rubric kèm trích dẫn câu, thanh xác nhận điểm của giáo viên.
- **S27 (`apps/web/src/app/teacher/monthly-reports/page.tsx`)**: Màn hình duyệt báo cáo tháng hàng loạt cả lớp trên 1 màn hình, banner cảnh báo nhắc nhở ngày 3, nút duyệt cả lớp 1 chạm.
- **S22 (`apps/web/src/app/parent/monthly-reports/page.tsx`)**: Màn hình phụ huynh xem báo cáo tháng của con, xem các chỉ số học tập cốt lõi và gửi phản hồi đóng góp ý kiến cho trung tâm.

---

## 2. Kết quả kiểm thử (Test Automation)
- **Suite riêng BƯỚC 12 (`apps/api/test/ai-grading.e2e-spec.ts`)**: **10/10 tests PASS**.
- **Toàn bộ hệ thống (12 test suites e2e)**: **159/159 tests PASS (100%)**.
- **Biên dịch Frontend Web**: **46/46 Next.js routes compile sạch 100%**.

---

## 3. Danh sách Test Cases BƯỚC 12
| Mã TC | Yêu cầu nghiệp vụ | Kết quả |
|---|---|---|
| TC-093 | Ảnh mờ không đọc được: AI báo không đọc được, không gán điểm bừa | **ĐẠT** |
| TC-092 | AI chấm bài viết tay theo rubric, trích câu cụ thể, GV sửa và xác nhận điểm cuối | **ĐẠT** |
| TC-102 | Nhận xét AI không suy diễn điều ngoài dữ liệu (không nhắc thái độ nếu không có dữ kiện) | **ĐẠT** |
| TC-107 | Duyệt báo cáo tháng hàng loạt: Job soạn nháp ngày 28, GV duyệt cả lớp trên 1 màn hình | **ĐẠT** |
| TC-108 | Nhắc nhở khi còn báo cáo tháng chưa duyệt đến ngày 3 | **ĐẠT** |
| TC-120 | Gợi ý trả lời tin nhắn phụ huynh từ AI chỉ hiện bản nháp, tuyệt đối không tự gửi | **ĐẠT** |
