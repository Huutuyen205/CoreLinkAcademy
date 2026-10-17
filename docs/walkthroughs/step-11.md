# TỔNG KẾT BƯỚC 11: ĐÁNH GIÁ NĂNG LỰC & ÔN LUYỆN THÔNG MINH (GĐ2)
*Mã bước: STEP-11 | Nhánh: `step-11-competency` | Kết quả: Hoàn thành 100% | TC đạt: 7/7*

---

## 1. Kết quả thực hiện

### 1.1. Backend API (`apps/api/src/modules/competency/`)
- **FR-604 / TC-091: AI tạo đề & câu hỏi, kiểm soát quy trình phê duyệt**:
  - `POST /api/v1/competency/ai-questions/generate`: AI sinh câu hỏi trắc nghiệm có đầy đủ stem, options, đáp án đúng và giải thích chi tiết. Trạng thái mặc định là `draft`, không thể giao cho học sinh.
  - `POST /api/v1/competency/ai-questions/:id/approve`: Giáo viên kiểm duyệt nội dung, chuyển trạng thái sang `approved`, ghi nhận `approved_by` theo đúng ràng buộc `ck_q_approved` và đưa vào ngân hàng đề thi chính thức.
- **FR-602 / TC-094: Ghi âm câu hỏi nói giới hạn 3 phút (180 giây)**:
  - `POST /api/v1/competency/speaking-answers`: Học sinh ghi âm câu trả lời nói, nếu thời lượng ghi âm vượt quá 180s (3 phút) hệ thống tự động chốt chặn và lưu lại tối đa 180s.
- **FR-610 / TC-095: Gợi ý bài ôn luyện kỹ năng yếu từ ngân hàng câu hỏi ĐÃ DUYỆT**:
  - `GET /api/v1/competency/weak-skills/:studentId`: Phân tích kết quả các bài kiểm tra gần nhất của học sinh, nhận diện kỹ năng yếu (< 50%) và chỉ gợi ý các câu hỏi có trạng thái `approved`, tuyệt đối không lấy câu `draft`.
- **FR-611 / TC-096: Gia sư AI thông minh kiểm soát nội dung**:
  - `POST /api/v1/competency/tutor/chat`:
    - Nếu học sinh xin đáp án khi bài kiểm tra chưa nộp / đang mở: AI từ chối đưa đáp án trực tiếp, hướng dẫn phương pháp suy luận từng bước (step-by-step reasoning).
    - Nếu học sinh hỏi các chủ đề ngoài môn tiếng Anh (toán học, vật lý, chính trị, bitcoin): AI từ chối lịch sự và hướng dẫn quay lại môn tiếng Anh.
    - Trả lời thân thiện, giải thích ngữ pháp và từ vựng chi tiết.
- **FR-612 / TC-097: Chống gian lận - Ghi nhận số lần rời tab khi thi**:
  - `POST /api/v1/competency/attempts/:id/tab-leave`: Đếm và cập nhật số lần chuyển tab của học sinh trong bảng `attempts` (`tab_leaves`).
- **FR-702 / TC-101: Điểm năng lực & Biểu đồ radar truy xuất test nguồn**:
  - `POST /api/v1/competency/scores`: Ghi nhận điểm năng lực vào bảng `competency_scores` gắn trực tiếp với `source_attempt_id`.
  - `GET /api/v1/competency/radar/:studentId`: Trả về điểm năng lực 6 kỹ năng (Nghe, Nói, Đọc, Viết, Ngữ pháp, Từ vựng) kèm bài test nguồn gốc.
- **FR-613: Cá nhân hóa độ khó thích ứng (Adaptive Difficulty)**:
  - `GET /api/v1/competency/adaptive-difficulty/:studentId`: Tự động nâng cấp độ khó (ví dụ Tier 2 -> Tier 3) khi học sinh đạt tỷ lệ làm đúng từ 80% trở lên ở bài thi trước.

### 1.2. Màn hình Frontend Next.js (3 Màn hình)
- **S17 (`apps/web/src/app/student/tutor/page.tsx`)**: Giao diện Gia sư AI tương tác cao, hướng dẫn từng bước, bộ đếm ghi âm tối đa 3 phút tự động dừng, chip gợi ý ôn tập theo kỹ năng yếu.
- **S18 (`apps/web/src/app/student/competency/page.tsx`)**: Biểu đồ radar đa giác 6 kỹ năng chuẩn CEFR/Cambridge, drill-down click xem chi tiết bài test nguồn gốc, lịch sử rời tab, đánh giá độ khó thích ứng.
- **S30 (`apps/web/src/app/teacher/ai-generator/page.tsx`)**: Bộ công cụ AI sinh câu hỏi trắc nghiệm/bài nói theo chủ đề và độ khó, xem trước đáp án & giải thích, hàng đợi kiểm duyệt câu hỏi vào ngân hàng.

---

## 2. Kết quả kiểm thử (Test Automation)
- **Suite riêng BƯỚC 11 (`apps/api/test/competency.e2e-spec.ts`)**: **13/13 tests PASS**.
- **Toàn bộ hệ thống (11 test suites e2e)**: **149/149 tests PASS (100%)**.
- **Biên dịch Frontend Web**: **43/43 Next.js routes compile sạch 100%**.

---

## 3. Danh sách Test Cases BƯỚC 11
| Mã TC | Yêu cầu nghiệp vụ | Kết quả |
|---|---|---|
| TC-091 | AI tạo đề có đáp án/giải thích, trạng thái draft, phải được GV duyệt mới vào ngân hàng | **ĐẠT** |
| TC-094 | Ghi âm câu hỏi nói tối đa 3 phút (180 giây), tự động chốt chặn thời lượng | **ĐẠT** |
| TC-095 | Gợi ý bài luyện tập theo kỹ năng yếu (< 50%) từ ngân hàng câu hỏi ĐÃ DUYỆT | **ĐẠT** |
| TC-096 | Gia sư AI không đưa đáp án bài đang làm, từ chối chủ đề ngoài tiếng Anh | **ĐẠT** |
| TC-097 | Chống gian lận: Ghi nhận số lần rời tab khi học sinh làm bài trực tuyến | **ĐẠT** |
| TC-101 | Điểm năng lực competency_scores truy xuất được bài test nguồn gốc | **ĐẠT** |
| FR-613 | Cá nhân hóa độ khó thích ứng, tự động tăng độ khó khi đạt >= 80% | **ĐẠT** |
