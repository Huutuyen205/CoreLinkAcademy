# KẾ HOẠCH BƯỚC 11: ĐÁNH GIÁ NĂNG LỰC & ÔN LUYỆN THÔNG MINH (GĐ2)
*Mã bước: STEP-11 | Nhánh: `step-11-competency` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
Triển khai BƯỚC 11 thuộc Giai đoạn 2 (GĐ2) theo đặc tả `CORELINK_MASTER.md`:
- **Nghiệp vụ M06 & M07 mở rộng (GĐ2)**: FR-602 (câu hỏi dạng nói, ghi âm <= 3 phút), FR-604 (AI tạo đề/câu hỏi có đáp án & giải thích, phải được giáo viên duyệt mới vào ngân hàng và mới được giao), FR-610 (Gợi ý bài bổ sung theo kỹ năng yếu từ câu đã duyệt), FR-611 (Gia sư AI giải thích từng bước, không lộ đáp án bài chưa nộp, từ chối chủ đề ngoài tiếng Anh), FR-612 (Chống gian lận xáo câu/đáp án & đếm rời tab), FR-613 (Đề cá nhân hóa theo band, tăng độ khó khi đúng >= 80%), FR-702 (Ghi điểm năng lực `competency_scores` truy về `source_attempt_id`, biểu đồ radar năng lực theo CEFR/YLE).
- **Test cases (7 TCs)**:
  1. `TC-091` (FR-604): AI tạo đề phải duyệt trước khi giao.
  2. `TC-094` (FR-602): Ghi âm bài nói tối đa 3 phút.
  3. `TC-095` (FR-610): Gợi ý bài bổ sung theo kỹ năng yếu từ các câu đã duyệt.
  4. `TC-096` (FR-611): Gia sư AI không đưa đáp án bài đang làm, từ chối chủ đề ngoài tiếng Anh.
  5. `TC-097` (FR-612): Ghi nhận số lần rời tab khi làm bài thi trực tuyến.
  6. `TC-101` (FR-702): Điểm năng lực `competency_scores` truy xuất được bài test nguồn (`source_attempt_id`).
  7. `FR-613 / AI-07`: Cá nhân hóa đề ôn luyện thông minh, tự động tăng độ khó khi đạt >= 80%.
- **3 Màn hình**:
  - `apps/web/src/app/student/tutor/page.tsx` (S17 - Gia sư AI học sinh)
  - `apps/web/src/app/student/competency/page.tsx` (S18 - Biểu đồ radar năng lực học sinh)
  - `apps/web/src/app/teacher/ai-generator/page.tsx` (S30 - Tạo đề & duyệt đề AI của giáo viên)

---

## 2. Thiết kế Kỹ thuật (Tech Lead)

### 2.1. Backend (`apps/api/src/modules/assessment` & `apps/api/src/modules/competency`)
- **Speaking Questions & Recordings (FR-602, TC-094)**:
  - Hỗ trợ lưu trữ file ghi âm phát âm / câu hỏi nói (MIME audio/webm, audio/mp4, audio/wav).
  - Giới hạn thời lượng tối đa 180 giây (3 phút).
- **AI Question Generation & Review (FR-604, TC-091)**:
  - Sinh câu hỏi tự động với đầy đủ nội dung, đáp án đúng và lời giải thích chi tiết.
  - Trạng thái mặc định: `pending_review` (chưa duyệt).
  - Không thể đưa vào assignment / đề thi nếu chưa được giáo viên duyệt (`status != 'approved'`).
  - Khi giáo viên duyệt (`POST /assessment/questions/:id/approve`), câu hỏi chuyển sang `approved` và được thêm vào ngân hàng.
- **Adaptive Practice & Weak Skill Suggestions (FR-610, FR-613, TC-095)**:
  - Phân tích 3 bài làm gần nhất của học sinh. Nếu điểm của một kỹ năng (Nghe, Nói, Đọc, Viết) dưới 50%, hệ thống tự động lọc ra các câu hỏi đã duyệt (`status = 'approved'`) thuộc kỹ năng đó để tạo bài luyện bổ sung.
  - Tự động điều chỉnh độ khó: nếu học sinh đạt >= 80% câu đúng, bài luyện kế tiếp sẽ tự động tăng cấp độ khó (ví dụ từ A1 lên A2).
- **AI Study Tutor (FR-611, TC-096)**:
  - Endpoint `POST /competency/tutor/chat`:
    - Nếu câu hỏi liên quan đến bài tập đang mở/chưa nộp (`status = 'in_progress'`), AI từ chối đưa đáp án trực tiếp và chỉ hướng dẫn phương pháp giải từng bước.
    - Nếu câu hỏi không liên quan đến học tiếng Anh (toán học, chính trị, v.v.), AI từ chối lịch sự và nhắc nhở quay lại môn tiếng Anh.
- **Tab Leave Detection (FR-612, TC-097)**:
  - Bổ sung trường `tab_leave_count` trong attempt metadata/table.
  - Cập nhật số lần chuyển tab trong quá trình làm bài và trả về cho giáo viên khi chấm bài.
- **Competency Radar & Source Tracking (FR-702, TC-101)**:
  - Quản lý bảng `competency_scores`: lưu trữ `student_id`, `framework` (CEFR/YLE), `skill` (listening, reading, speaking, writing), `score`, `source_attempt_id`.
  - API trả về chi tiết bài test nguồn khi người dùng click vào điểm từng nhánh radar.

### 2.2. Frontend (3 Màn hình)
- S17 (`apps/web/src/app/student/tutor/page.tsx`): Giao diện trò chuyện cùng Gia sư AI thông minh, giải thích từng bước, gợi ý bài ôn tập theo kỹ năng yếu.
- S18 (`apps/web/src/app/student/competency/page.tsx`): Biểu đồ radar 4-6 kỹ năng năng lực chuẩn CEFR/Cambridge, bấm vào từng kỹ năng hiển thị lịch sử và liên kết tới bài test gốc.
- S30 (`apps/web/src/app/teacher/ai-generator/page.tsx`): Bộ công cụ cho giáo viên sinh đề thi bằng AI theo chủ đề/độ khó, xem trước đáp án & lời giải, nút duyệt câu hỏi vào ngân hàng trước khi giao cho lớp.
