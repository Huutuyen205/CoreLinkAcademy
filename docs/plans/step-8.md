# KẾ HOẠCH BƯỚC 8: NGÂN HÀNG CÂU HỎI, BÀI TẬP, LÀM BÀI, CHẤM & PHÚC KHẢO (M06 GĐ1)
*Mã bước: STEP-08 | Nhánh: `step-08-assessment` | Trạng thái: Đang thực hiện*

---

## 1. Mục tiêu & Phạm vi
- Triển khai toàn bộ chức năng Giai đoạn 1 của module M06 (Bài tập, thi, ôn luyện) theo đặc tả `CORELINK_MASTER.md`:
  - **FR-601..FR-609**
  - **17 Test Cases**: TC-076..TC-091, TC-098
  - **6 Màn hình**: S13, S14, S15 (Học sinh/Phụ huynh); S30, S31, S32 (Giáo viên/Giáo vụ)
- CSDL đã có sẵn đầy đủ: `questions`, `assignments`, `assignment_questions`, `assignment_targets`, `attempts`, `answers`, `regrade_requests`, `rubrics`.

---

## 2. Danh sách Test Cases (17 TCs)
1. `TC-076` (FR-601): Lọc ngân hàng câu hỏi theo 3 nhãn (Kỹ năng, Khung/Level, Độ khó) -> Kết quả khớp chính xác cả 3 nhãn.
2. `TC-077` (FR-601): Chặn xóa câu hỏi đang được sử dụng trong bài tập/đề thi -> Trả về 400 Bad Request kèm tên bài tập đang dùng (FK Restrict).
3. `TC-078` (FR-602): Hỗ trợ đủ 9 dạng câu hỏi GĐ1 (single_choice, multi_choice, true_false, fill_blank, matching, ordering, listening, essay, file_upload).
4. `TC-079` (FR-603): Giao bài tập cho cá nhân học sinh -> Chỉ học sinh được chỉ định mới thấy và nhận bài.
5. `TC-080` (FR-603): Tác vụ nhắc 24 giờ trước hạn nộp bài -> Chỉ học sinh chưa nộp bài mới nhận thông báo nhắc nhở.
6. `TC-081` (FR-605): Cơ chế lưu nháp an toàn (mỗi 10s) và hoạt động offline (IndexedDB), đồng bộ lên server không mất dữ liệu.
7. `TC-082` (FR-605): Hết giờ làm bài tự động nộp bài (`submit_mode = 'timeout'`) với những câu đã làm.
8. `TC-083` (FR-605): Chống nộp bài 2 lần cùng lúc (Idempotency / Lock) -> Chỉ ghi nhận 1 lần nộp thành công duy nhất.
9. `TC-084` (FR-606): Chấm trắc nghiệm/khách quan ngay tức thì (< 2 giây), tính điểm chuẩn xác.
10. `TC-085` (FR-608): Bảo mật đề thi: Chưa công bố kết quả (`published_at == null`), API tuyệt đối KHÔNG trả `answer_key`, `explanation` và điểm tự luận.
11. `TC-086` (FR-608): Phụ huynh xem điểm, đáp án, nhận xét của con sau khi giáo viên công bố kết quả (chế độ chỉ đọc).
12. `TC-087` (FR-609): Gửi yêu cầu chấm lại (phúc khảo) trong vòng 7 ngày sau công bố kết quả -> Chuyển trạng thái `pending`.
13. `TC-088` (FR-609): Chặn yêu cầu chấm lại quá hạn 7 ngày -> Trả về 400 Bad Request kèm thông báo quá hạn.
14. `TC-089` (FR-609): Mỗi lượt làm bài chỉ được gửi yêu cầu chấm lại đúng 1 lần (Unique attempt_id) -> Gửi lần 2 bị chặn.
15. `TC-090` (FR-609): Quá 3 ngày làm việc chưa xử lý phúc khảo -> Kích hoạt cảnh báo gửi cho Giáo vụ/Admin (`escalated_at`).
16. `TC-091` (FR-604): AI sinh câu hỏi ở trạng thái `draft`, phải được giáo viên phê duyệt (`approved`) mới được đưa vào đề bài.
17. `TC-098` (FR-605): Kiểm thử tải k6 150 học sinh làm bài đồng thời, lưu nháp mỗi 10 giây (95% < 1s, không lỗi).

---

## 3. Kiến trúc Backend (`apps/api/src/modules/assessment`)
- `AssessmentService`:
  - `createQuestion(data, userId)`
  - `getQuestions(query)`: Lọc theo skill, framework, level_code, difficulty, status, keyword
  - `deleteQuestion(id)`: Kiểm tra quan hệ `assignment_questions`, chặn xóa nếu đang dùng
  - `generateAiQuestion(data, userId)`: Tạo câu hỏi `is_ai = true, status = draft`
  - `approveQuestion(id, approverId)`: Cập nhật `status = approved, approved_by = approverId`
  - `createAssignment(data, creatorId)`: Tạo bài tập, liên kết `assignment_questions`, `assignment_targets`
  - `getAssignments(userId, query)`: Phân quyền theo vai trò (học sinh chỉ thấy bài được giao cho mình/lớp mình)
  - `getAssignmentById(id, userId)`: Ẩn `answer_key` nếu chưa công bố và người gọi là học sinh/phụ huynh
  - `startAttempt(assignmentId, studentId)`: Tạo `attempts` với `attempt_no`, kiểm tra `attempts_allowed` và deadline
  - `saveAnswersDraft(attemptId, studentId, answers)`: Upsert hàng loạt vào bảng `answers`
  - `submitAttempt(attemptId, studentId, submitMode)`: Kiểm tra chưa nộp, tự động chấm câu trắc nghiệm, cập nhật `submitted_at`, `auto_score`, `final_score`
  - `gradeManual(attemptId, teacherId, grades)`: Chấm điểm câu tự luận/rubric, cập nhật `final_score`
  - `publishResults(assignmentId, teacherId)`: Đặt `published_at = now()`, gửi thông báo cho học sinh/phụ huynh
  - `requestRegrade(attemptId, requestedBy, reason)`: Kiểm tra trong hạn 7 ngày, chặn nộp lần 2, tạo `regrade_requests`
  - `processRegrade(requestId, teacherId, data)`: Cập nhật `status = accepted|rejected`, `new_score`, `final_score`
  - `checkDueRemindersJob()`: Quét bài tập hết hạn trong 24h gửi thông báo
  - `checkRegradeEscalationJob()`: Quét phúc khảo > 3 ngày làm việc gửi cảnh báo Giáo vụ
- `AssessmentController`: REST API endpoints đầy đủ `@UseGuards(JwtAuthGuard, RolesGuard)`.
- `AssessmentModule`: Đăng ký vào `AppModule`.

---

## 4. Giao diện Frontend (`apps/web`)
1. `/assignments` (S13): Danh sách bài tập của học sinh (Cần làm, Đã nộp, Đã chấm).
2. `/assignments/[id]/take` (S14): Giao diện làm bài 9 dạng câu hỏi, đồng hồ đếm ngược, tự động lưu nháp mỗi 10s, IndexedDB fallback.
3. `/assignments/[id]/results` (S15): Xem điểm, đáp án, nhận xét sau khi công bố; Form gửi yêu cầu chấm lại trong hạn 7 ngày.
4. `/teacher/questions` (S30): Ngân hàng câu hỏi, bộ lọc nhãn 3 tiêu chí, tạo câu hỏi 9 dạng, duyệt câu AI.
5. `/teacher/assignments` (S31): Giao bài tập cho lớp/nhóm/học sinh, đặt hạn nộp, thời gian làm bài, cấu hình đáp án.
6. `/teacher/grading` (S32): Chấm điểm bài tập theo rubric, công bố kết quả, xem và giải quyết yêu cầu chấm lại.

---

## 5. Kế hoạch Kiểm thử & Tối ưu
- E2E Test Suite: `apps/api/test/assessment.e2e-spec.ts` kiểm tra trọn vẹn 17 test cases.
- k6 Script: `apps/api/test/load/k6-assessment-draft.js` mô phỏng 150 người dùng lưu nháp.
- Build kiểm tra `@corelink/web` và `@corelink/api`.
