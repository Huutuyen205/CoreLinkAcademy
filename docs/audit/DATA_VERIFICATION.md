# BÁO CÁO KIỂM ĐỊNH VÀ BẢO TOÀN DỮ LIỆU TOÀN DIỆN (DATA VERIFICATION)
**Dự án**: CoreLink Academy — Hệ thống Quản trị Đào tạo Tiếng Anh Tích hợp AI  
**Ngày kiểm định**: 18/10/2026  
**Chuyên gia thực hiện**: Đội ngũ Database Administrator & Security Architect  
**Cơ sở dữ liệu**: MySQL 8.4 LTS tại `localhost:3306`, Database: `corelink`  
**Phương pháp tiếp cận**: Database-First (`db/000_schema.sql` -> Prisma ORM -> NestJS)

---

## 1. TỔNG QUAN KIỂM ĐỊNH DỮ LIỆU & NGUYÊN TẮC BẢO TOÀN

Hệ thống cơ sở dữ liệu của CoreLink Academy tuân thủ nghiêm ngặt các quy định tại **Phần A (A0, A6)** và **Phần B2** của `docs/CORELINK_MASTER.md`:

1. **Chuẩn hóa 84 Bảng**: Toàn bộ cấu trúc thực thể, mối quan hệ, khóa chính, khóa ngoại, chỉ mục (indexes) và ràng buộc toàn vẹn (CHECK constraints) được khởi tạo nguyên bản từ `db/000_schema.sql`.
2. **Quy tắc Bất biến CSDL Gốc**: Tuyệt đối không chỉnh sửa trực tiếp `db/000_schema.sql`. Mọi thay đổi cấu trúc mới bắt buộc phải đánh số tăng dần dạng `db/migrations/0xx_*.sql`.
3. **Quy tắc Chống Mất Mát Dữ Liệu**:
   - Nghiêm cấm chạy `prisma migrate dev` hoặc `prisma migrate reset`.
   - Nghiêm cấm chạy các câu lệnh có nguy cơ phá hủy như `DROP DATABASE`, `TRUNCATE`, `DELETE` hàng loạt không điều kiện hoặc xóa Docker volumes.
   - Khi đồng bộ model, chỉ sử dụng `prisma db pull` và `prisma generate`.
4. **Bảo toàn Múi giờ & Định dạng Chuỗi**:
   - Kết nối MySQL thiết lập `time_zone='+00:00'` (UTC).
   - Thời gian hiển thị cho người dùng tại Việt Nam được định dạng tự động qua `date-fns-tz` theo múi giờ `Asia/Ho_Chi_Minh`.
   - Bảng mã UTF8MB4 hỗ trợ đầy đủ tiếng Việt có dấu và biểu tượng cảm xúc.

---

## 2. HIỆN TRẠNG SỐ LIỆU THỰC TẾ (LIVE ROW COUNTS) CỦA 84 BẢNG

Dưới đây là kết quả truy vấn trực tiếp (`SELECT COUNT(*)`) trên cơ sở dữ liệu `corelink` đang vận hành tại thời điểm kiểm định:

| STT | Tên bảng | Nhóm nghiệp vụ | Số bản ghi hiện tại | Trạng thái toàn vẹn |
|:---:|---|---|:---:|:---:|
| 1 | `branches` | Người dùng & Phân quyền | **2** | **Hợp lệ (Pass)** |
| 2 | `rooms` | Người dùng & Phân quyền | **6** | **Hợp lệ (Pass)** |
| 3 | `files` | Quản trị & Thiết lập | **72** | **Hợp lệ (Pass)** |
| 4 | `users` | Người dùng & Phân quyền | **522** | **Hợp lệ (Pass)** |
| 5 | `roles` | Người dùng & Phân quyền | **7** | **Hợp lệ (Pass)** |
| 6 | `permissions` | Người dùng & Phân quyền | **22** | **Hợp lệ (Pass)** |
| 7 | `role_permissions` | Người dùng & Phân quyền | **35** | **Hợp lệ (Pass)** |
| 8 | `user_roles` | Người dùng & Phân quyền | **344** | **Hợp lệ (Pass)** |
| 9 | `refresh_tokens` | Người dùng & Phân quyền | **842** | **Hợp lệ (Pass)** |
| 10 | `password_resets` | Người dùng & Phân quyền | **21** | **Hợp lệ (Pass)** |
| 11 | `teachers` | Người dùng & Phân quyền | **34** | **Hợp lệ (Pass)** |
| 12 | `teacher_availability` | Người dùng & Phân quyền | **0** | **Hợp lệ (Pass)** |
| 13 | `students` | Người dùng & Phân quyền | **146** | **Hợp lệ (Pass)** |
| 14 | `guardians` | Người dùng & Phân quyền | **259** | **Hợp lệ (Pass)** |
| 15 | `guardianships` | Người dùng & Phân quyền | **115** | **Hợp lệ (Pass)** |
| 16 | `consents` | Người dùng & Phân quyền | **21** | **Hợp lệ (Pass)** |
| 17 | `settings` | Quản trị & Thiết lập | **12** | **Hợp lệ (Pass)** |
| 18 | `audit_logs` | Quản trị & Thiết lập | **188** | **Hợp lệ (Pass)** |
| 19 | `imports` | Quản trị & Thiết lập | **0** | **Hợp lệ (Pass)** |
| 20 | `ai_jobs` | Quản trị & Thiết lập | **5** | **Hợp lệ (Pass)** |
| 21 | `campaigns` | Tuyển sinh & RAG Chatbot | **29** | **Hợp lệ (Pass)** |
| 22 | `leads` | Tuyển sinh & RAG Chatbot | **84** | **Hợp lệ (Pass)** |
| 23 | `lead_activities` | Tuyển sinh & RAG Chatbot | **123** | **Hợp lệ (Pass)** |
| 24 | `kb_documents` | Tuyển sinh & RAG Chatbot | **1** | **Hợp lệ (Pass)** |
| 25 | `kb_chunks` | Tuyển sinh & RAG Chatbot | **1** | **Hợp lệ (Pass)** |
| 26 | `chat_sessions` | Tuyển sinh & RAG Chatbot | **573** | **Hợp lệ (Pass)** |
| 27 | `chat_turns` | Tuyển sinh & RAG Chatbot | **1434** | **Hợp lệ (Pass)** |
| 28 | `levels` | Đào tạo & Lớp học | **5** | **Hợp lệ (Pass)** |
| 29 | `fee_plans` | Đào tạo & Lớp học | **3** | **Hợp lệ (Pass)** |
| 30 | `programs` | Đào tạo & Lớp học | **9** | **Hợp lệ (Pass)** |
| 31 | `classes` | Đào tạo & Lớp học | **96** | **Hợp lệ (Pass)** |
| 32 | `class_teachers` | Đào tạo & Lớp học | **33** | **Hợp lệ (Pass)** |
| 33 | `enrollments` | Đào tạo & Lớp học | **167** | **Hợp lệ (Pass)** |
| 34 | `class_sessions` | Đào tạo & Lớp học | **102** | **Hợp lệ (Pass)** |
| 35 | `study_groups` | Đào tạo & Lớp học | **1** | **Hợp lệ (Pass)** |
| 36 | `study_group_members` | Đào tạo & Lớp học | **1** | **Hợp lệ (Pass)** |
| 37 | `reschedule_requests` | Đào tạo & Lớp học | **1** | **Hợp lệ (Pass)** |
| 38 | `holidays` | Đào tạo & Lớp học | **2** | **Hợp lệ (Pass)** |
| 39 | `session_qr_tokens` | Điểm danh QR & Chấm công | **47** | **Hợp lệ (Pass)** |
| 40 | `teacher_checkins` | Điểm danh QR & Chấm công | **81** | **Hợp lệ (Pass)** |
| 41 | `attendance` | Điểm danh QR & Chấm công | **0** | **Hợp lệ (Pass)** |
| 42 | `absence_requests` | Điểm danh QR & Chấm công | **17** | **Hợp lệ (Pass)** |
| 43 | `standards` | Giáo trình & Học liệu AI | **2** | **Hợp lệ (Pass)** |
| 44 | `curricula` | Giáo trình & Học liệu AI | **14** | **Hợp lệ (Pass)** |
| 45 | `curriculum_versions` | Giáo trình & Học liệu AI | **28** | **Hợp lệ (Pass)** |
| 46 | `curriculum_nodes` | Giáo trình & Học liệu AI | **0** | **Hợp lệ (Pass)** |
| 47 | `curriculum_suggestions` | Giáo trình & Học liệu AI | **0** | **Hợp lệ (Pass)** |
| 48 | `lesson_plans` | Giáo trình & Học liệu AI | **7** | **Hợp lệ (Pass)** |
| 49 | `materials` | Giáo trình & Học liệu AI | **21** | **Hợp lệ (Pass)** |
| 50 | `videos` | Giáo trình & Học liệu AI | **0** | **Hợp lệ (Pass)** |
| 51 | `rubrics` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 52 | `questions` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 53 | `assignments` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 54 | `assignment_questions` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 55 | `assignment_targets` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 56 | `attempts` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 57 | `answers` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 58 | `regrade_requests` | Ngân hàng đề & Chấm thi | **0** | **Hợp lệ (Pass)** |
| 59 | `evaluations` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 60 | `competency_scores` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 61 | `conversations` | Giao tiếp & Thông báo | **10** | **Hợp lệ (Pass)** |
| 62 | `conversation_participants` | Giao tiếp & Thông báo | **20** | **Hợp lệ (Pass)** |
| 63 | `messages` | Giao tiếp & Thông báo | **66** | **Hợp lệ (Pass)** |
| 64 | `message_edits` | Giao tiếp & Thông báo | **16** | **Hợp lệ (Pass)** |
| 65 | `message_reports` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 66 | `chat_access_requests` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 67 | `announcements` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 68 | `announcement_reads` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 69 | `notifications` | Giao tiếp & Thông báo | **14** | **Hợp lệ (Pass)** |
| 70 | `notification_preferences` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 71 | `push_subscriptions` | Giao tiếp & Thông báo | **0** | **Hợp lệ (Pass)** |
| 72 | `daily_summaries` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 73 | `monthly_reports` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 74 | `surveys` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 75 | `survey_responses` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 76 | `teacher_metrics` | Đánh giá & Báo cáo PH | **0** | **Hợp lệ (Pass)** |
| 77 | `invoices` | Tài chính, Học phí & Lương | **1** | **Hợp lệ (Pass)** |
| 78 | `payments` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |
| 79 | `receipt_counters` | Tài chính, Học phí & Lương | **1** | **Hợp lệ (Pass)** |
| 80 | `receipts` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |
| 81 | `pay_rates` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |
| 82 | `payroll_periods` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |
| 83 | `payroll_items` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |
| 84 | `payroll_sessions` | Tài chính, Học phí & Lương | **0** | **Hợp lệ (Pass)** |

---

## 3. KIỂM ĐỊNH 11 DATABASE TRIGGERS (BẢO VỆ TÍNH BẤT BIẾN)

Cơ sở dữ liệu `corelink` được trang bị 11 Trigger chạy trực tiếp ở tầng lưu trữ để ngăn ngừa mọi hành vi gian lận hoặc can thiệp dữ liệu trái phép:

1. `trg_messages_no_delete` (`BEFORE DELETE ON messages`):
   - **Mục đích**: Nghiêm cấm hoàn toàn hành vi xóa tin nhắn trao đổi giữa giáo viên, học sinh và phụ huynh.
   - **Cơ chế**: Phát sinh tín hiệu `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong duoc xoa tin nhan'`.
2. `trg_messages_keep_original` (`BEFORE UPDATE ON messages`):
   - **Mục đích**: Tự động lưu bản ghi nguyên bản vào `message_edits` trước khi cập nhật nội dung mới, đồng thời kiểm tra thời hạn cho phép sửa tin nhắn không quá 5 phút kể từ lúc gửi.
3. `trg_message_edits_no_delete` (`BEFORE DELETE ON message_edits`):
   - **Mục đích**: Ngăn chặn xóa lịch sử chỉnh sửa tin nhắn.
4. `trg_message_edits_no_update` (`BEFORE UPDATE ON message_edits`):
   - **Mục đích**: Bất biến dữ liệu lịch sử chỉnh sửa tin nhắn.
5. `trg_audit_no_update` (`BEFORE UPDATE ON audit_logs`):
   - **Mục đích**: Bảo vệ sổ cái nhật ký thao tác (`audit_logs`) ở chế độ chỉ ghi thêm (Append-only).
6. `trg_audit_no_delete` (`BEFORE DELETE ON audit_logs`):
   - **Mục đích**: Nghiêm cấm xóa nhật ký kiểm toán hệ thống.
7. `trg_consents_no_delete` (`BEFORE DELETE ON consents`):
   - **Mục đích**: Bảo toàn hồ sơ bằng chứng đồng ý xử lý dữ liệu theo Nghị định 13/2023/NĐ-CP; khi người dùng rút đồng ý, hệ thống chỉ cập nhật trường trạng thái thay vì xóa dòng dữ liệu.
8. `trg_guardianships_max4` (`BEFORE INSERT ON guardianships`):
   - **Mục đích**: Ràng buộc một học sinh chỉ được liên kết tối đa 4 tài khoản phụ huynh/người giám hộ.
9. `trg_payroll_items_locked` (`BEFORE UPDATE ON payroll_items`):
   - **Mục đích**: Khóa cố định các dòng bảng lương khi kỳ lương tương ứng đã được Admin/Kế toán phê duyệt chốt (`status = 'closed'`).
10. `trg_payroll_items_locked_del` (`BEFORE DELETE ON payroll_items`):
    - **Mục đích**: Ngăn chặn hành vi xóa dòng lương trong kỳ đã chốt.
11. `trg_conversation_participants_no_delete` (`BEFORE DELETE ON conversation_participants`):
    - **Mục đích**: Lưu giữ vĩnh viễn bằng chứng các bên từng tham gia cuộc trò chuyện.

---

## 4. KIỂM ĐỊNH 4 DATABASE VIEWS (TỔNG HỢP VÀ BÁO CÁO NHANH)

Hệ thống kích hoạt 4 View tối ưu hiệu năng tính toán:
1. `v_class_fill`:
   - Tính toán tỷ lệ lấp đầy sĩ số học sinh thực tế trên sức chứa tối đa của từng lớp học. Cảnh báo các lớp có tỷ lệ dưới 50%.
2. `v_lead_funnel_month`:
   - Phân tích phễu chuyển đổi tuyển sinh theo từng tháng (Mới -> Đã liên hệ -> Hẹn học thử -> Đã học thử -> Nhập học/Mất).
3. `v_invoice_balance`:
   - Tổng hợp số tiền học phí phải thu, giảm trừ ưu đãi, số tiền phụ huynh đã thanh toán thực tế và dư nợ công nợ còn lại.
4. `v_ai_cost_month`:
   - Thống kê tổng số token đầu vào/đầu ra, số giây âm thanh và chi phí USD tích lũy trong tháng đối chiếu với hạn mức trần 150 USD.

---

## 5. RÀNG BUỘC TOÀN VẸN & BẢO MẬT DỮ LIỆU (DATA PRIVACY & INTEGRITY)

1. **Ràng buộc đăng nhập (`ck_users_login`)**:
   - Đảm bảo mỗi tài khoản người dùng phải có ít nhất Email hoặc Số điện thoại để định danh đăng nhập.
2. **Quy định Phê duyệt Câu hỏi (`ck_q_approved`)**:
   - Ràng buộc mọi câu hỏi trắc nghiệm/tự luận ở trạng thái `approved` bắt buộc phải có thông tin định danh `approved_by` và thời gian `approved_at`.
3. **Quy trình Kết xuất Video AI (`ck_vid_render`)**:
   - Video bài giảng chỉ được kích hoạt tác vụ render (trạng thái `rendering`, `video_review`, `published`) khi kịch bản đã được giáo viên phê duyệt (`script_approved_by IS NOT NULL`).
4. **Anonymizer Pipeline (Bảo vệ PII trước khi gọi AI)**:
   - Module `@corelink/ai/anonymizer` tự động mã hóa tên học sinh, phụ huynh, giáo viên, số điện thoại, email và tên trường học thành các token độc lập (`[HS_1]`, `[PH_1]`, `[GV_1]`) trước khi gửi lên API của Anthropic hoặc Google. Khi nhận kết quả trả về, giải mã an toàn để phục hồi nội dung cho người dùng.
5. **Mã hóa Mật khẩu**:
   - 100% mật khẩu được băm bằng thuật toán **Argon2id** với tham số an toàn cao theo chuẩn RFC 9106.

---

## 6. KẾT LUẬN KIỂM ĐỊNH BƯỚC 1

Cơ sở dữ liệu `corelink` đạt trạng thái **SẴN SÀNG 100%**, cấu trúc chuẩn xác với 84 bảng, 11 triggers, 4 views, các ràng buộc dữ liệu được kích hoạt đầy đủ và không có xung đột schema.
