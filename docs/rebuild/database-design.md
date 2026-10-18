# THIẾT KẾ CƠ SỞ DỮ LIỆU — CORELINK ACADEMY (DATABASE DESIGN)

**Tài liệu**: Kiến trúc & Thiết kế CSDL Chuẩn 84 Bảng  
**Hệ quản trị CSDL**: MySQL 8.4 LTS  
**Chiến lược**: Database-First (Không sửa đổi `db/000_schema.sql` trực tiếp, kiểm soát migration tăng dần)  
**Phiên bản**: 2.0  

---

## 1. NGUYÊN TẮC BẢO TOÀN VÀ TIÊU CHUẨN THIẾT KẾ

1. **Chuẩn hóa dữ liệu 3NF**: Toàn bộ 84 bảng được chuẩn hóa dạng chuẩn 3 (3rd Normal Form), đảm bảo không dư thừa dữ liệu và duy trì tính toàn vẹn quan hệ qua Foreign Key constraints (`ON DELETE NO ACTION / CASCADE` được chỉ định rõ ràng).
2. **Khóa chính và Mã định danh (UUID & Composite Keys)**: Sử dụng chuỗi định danh UUID `CHAR(36)` hoặc `BIGINT UNSIGNED` tự tăng khi cần tối ưu hiệu năng ghi.
3. **Mã hóa và An toàn Dữ liệu (UTF8MB4 & Strict Timezone)**:
   - Toàn bộ cơ sở dữ liệu sử dụng bảng mã `utf8mb4_unicode_ci` hỗ trợ đầy đủ tiếng Việt có dấu và biểu tượng cảm xúc.
   - Toàn bộ thời gian lưu trữ ở định dạng chuẩn UTC (`time_zone='+00:00'`); hiển thị cho người dùng qua múi giờ `Asia/Ho_Chi_Minh`.
4. **Quy tắc Bất Biến (Immutability)**:
   - Các bảng tài chính (`payments`, `receipt_counters`, `audit_logs`) không hỗ trợ xóa cứng.
   - Tin nhắn trao đổi (`messages`) được bảo vệ bởi trigger cơ sở dữ liệu: Không có thao tác xóa; chỉ cho phép cập nhật nội dung trong vòng 5 phút kể từ thời điểm gửi.

---

## 2. PHÂN NHÓM 84 BẢNG DỮ LIỆU THEO TỪNG MIỀN NGHIỆP VỤ (DOMAINS)

### Nhóm 1: Nhận dạng, Người dùng & Phân quyền (12 Bảng)
- `users`: Thông tin tài khoản trung tâm, mã băm mật khẩu Argon2id, trạng thái hoạt động, khóa tạm thời.
- `roles`, `user_roles`, `role_permissions`, `permissions`: Quản lý vai trò và danh mục đặc quyền RBAC.
- `refresh_tokens`: Lưu trữ mã băm token làm mới xoay vòng hỗ trợ đăng xuất từ xa trên mọi thiết bị.
- `consents`: Bản ghi đồng ý xử lý dữ liệu trẻ em và chính sách riêng tư theo Nghị định 13/2023/NĐ-CP.
- `audit_logs`: Nhật ký kiểm toán mọi hành động nhạy cảm (phân quyền, sửa điểm, hủy buổi, hoàn phí).
- `branches`, `rooms`: Danh mục cơ sở trung tâm, tọa độ GPS địa lý, bán kính cho phép điểm danh và phòng học.

### Nhóm 2: Hồ sơ Đào tạo & Quan hệ Học thuật (14 Bảng)
- `students`: Hồ sơ học sinh, mã học sinh duy nhất, ngày sinh, cờ tài khoản nhỏ tuổi (`is_young_account`).
- `guardians`, `guardianships`: Hồ sơ phụ huynh, mối quan hệ (Bố, Mẹ, Người giám hộ), giới hạn tối đa 4 phụ huynh/học sinh, phân quyền chi tiết (`can_view_results`, `can_message`, `receives_fee_notice`).
- `teachers`, `teacher_profiles`: Hồ sơ giảng viên, bằng cấp, chứng chỉ quốc tế (IELTS/TESOL), đơn giá giờ dạy.
- `programs`, `courses`, `classes`: Phân cấp chương trình đào tạo, khóa học, thông tin lớp học (sĩ số tối đa, trạng thái).
- `class_teachers`: Phân công giáo viên chủ nhiệm và giáo viên bộ môn giảng dạy theo lớp.
- `enrollments`: Bản ghi học viên đăng ký vào lớp, theo dõi trạng thái bảo lưu hoặc thôi học.

### Nhóm 3: Thời khóa biểu, Lịch học & Điểm danh (12 Bảng)
- `class_sessions`: Danh sách từng buổi học cụ thể sinh từ quy tắc lặp lại, giáo viên thực dạy, phòng học thực tế.
- `attendance_records`: Trạng thái chuyên cần của học sinh (Có mặt, Đi muộn, Vắng có phép, Vắng không phép).
- `teacher_checkins`: Bằng chứng mở buổi học của giáo viên (tọa độ GPS, ảnh lớp chụp tại chỗ, thời gian).
- `absence_requests`: Đơn xin nghỉ học trực tuyến do phụ huynh gửi trước giờ vào lớp.
- `holidays`: Danh mục ngày nghỉ lễ toàn quốc và lịch nghỉ đột xuất phục vụ thuật toán sinh lịch tránh trùng.

### Nhóm 4: Tuyển sinh, Khách hàng Tiềm năng & Chatbot RAG (10 Bảng)
- `leads`, `lead_activities`: Hồ sơ khách tiềm năng, nguồn tiếp thị (UTM, Facebook, Người quen giới thiệu), lịch sử chăm sóc.
- `placement_tests`, `placement_test_results`: Phiếu đăng ký và kết quả kiểm tra năng lực đầu vào trực tuyến.
- `campaigns`: Chiến dịch tiếp thị tuyển sinh, ngân sách, mã giảm giá và tỷ lệ chuyển đổi.
- `kb_documents`, `kb_chunks`: Kho kiến thức tuyển sinh được phê duyệt, đoạn tri thức văn bản và vector nhúng 768 chiều.
- `chat_sessions`, `chat_turns`: Lịch sử đối thoại giữa khách thăm quan và Chatbot AI.

### Nhóm 5: Khảo thí, Bài tập & Đánh giá Năng lực (14 Bảng)
- `questions`, `question_tags`: Ngân hàng câu hỏi phân loại theo kỹ năng, độ khó và khung chuẩn Cambridge/CEFR.
- `exams`, `exam_questions`: Đề kiểm tra, cấu hình thời gian làm bài, tỷ lệ câu hỏi trắc nghiệm/tự luận.
- `exam_attempts`, `exam_answers`: Lượt làm bài thi của học sinh, câu trả lời, mốc thời gian nộp bài, điểm số.
- `essay_submissions`, `ai_grading_results`: Bài làm tự luận, nhận xét ngữ pháp và từ vựng từ AI, điểm số do giáo viên duyệt.
- `competency_frameworks`, `student_competencies`: Khung năng lực chuẩn và điểm số radar 4 kỹ năng của từng học viên.

### Nhóm 6: Tài chính, Học phí, Lương & Báo cáo (12 Bảng)
- `fee_plans`: Bảng giá học phí chuẩn và các chính sách ưu đãi áp dụng theo đợt.
- `tuition_invoices`: Hóa đơn học phí phải thu của học viên theo kỳ học.
- `payments`: Giao dịch thu học phí thực tế (chuyển khoản, tiền mặt, cổng thanh toán).
- `receipt_counters`: Cơ chế đếm số biên nhận liên tục đảm bảo tính duy nhất và không bị trùng lặp số hóa đơn.
- `teacher_payrolls`, `payroll_sessions`: Bảng thanh toán lương giáo viên theo tháng dựa trên các buổi học đã xác thực.
- `daily_summaries`, `monthly_reports`: Bản tóm tắt học tập hằng ngày và báo cáo tiến bộ tháng cho phụ huynh.

### Nhóm 7: Tương tác, Bản tin & Nhật ký Hoạt động (10 Bảng)
- `conversations`, `messages`: Hệ thống trao đổi 1-1 an toàn giữa giáo viên và phụ huynh.
- `class_announcements`, `announcement_reads`: Bảng tin lớp học một chiều và danh sách phụ huynh đã đọc tin.
- `notifications`, `web_push_subscriptions`: Trung tâm thông báo đẩy và thiết bị nhận tin.
- `surveys`, `survey_responses`: Phiếu khảo sát độ hài lòng của phụ huynh (NPS) ẩn danh qua mã băm token.
- `ai_jobs`: Nhật ký theo dõi toàn bộ yêu cầu gọi AI (chi phí token, thời gian xử lý, nhà cung cấp).

---

## 3. CƠ CHẾ RÀNG BUỘC TOÀN VẸN VÀ KHÓA DÒNG GIAO DỊCH (CONCURRENCY CONTROL)

1. **Khóa dòng bi quan (Pessimistic Locking `SELECT ... FOR UPDATE`)**:
   - Áp dụng khi cấp phát số biên nhận thanh toán trong bảng `receipt_counters`:
     ```sql
     SELECT last_number FROM receipt_counters WHERE branch_id = ? AND fiscal_year = ? FOR UPDATE;
     ```
   - Đảm bảo 2 nhân viên thu ngân xuất hóa đơn cùng lúc không bao giờ bị trùng lặp số chứng từ.
2. **Kiểm tra Sĩ số Lớp học Trước khi Ghi danh**:
   - Kiểm tra ràng buộc sĩ số hiện tại so với `classes.max_capacity` trong một giao dịch cơ sở dữ liệu đơn nhất có khóa dòng lớp học để ngăn chặn vượt quá sức chứa phòng.
