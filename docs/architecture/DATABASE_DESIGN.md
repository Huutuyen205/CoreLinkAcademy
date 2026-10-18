# THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN DOANH NGHIỆP (DATABASE DESIGN SPECIFICATION)
**Dự án**: CoreLink Academy  
**Công nghệ**: MySQL 8.4 Enterprise / Prisma ORM (Database-First)  
**Quy mô**: 48 Bảng chuẩn hóa 3NF, phân tách theo 6 phân hệ nghiệp vụ.

---

## 1. Phân Nhóm 48 Bảng Dữ Liệu Theo Nghiệp Vụ

### 1.1. Phân Hệ Người Dùng, Chi Nhánh & Bảo Mật (8 bảng)
1. `branches`: Danh mục cơ sở trung tâm (tên, địa chỉ, tọa độ GPS lat/lng, bán kính check-in).
2. `users`: Bảng người dùng gốc (email, phone, username, mật khẩu mã hóa Argon2id, trạng thái, số lần đăng nhập sai, thời gian khóa).
3. `roles`: Danh mục vai trò (`admin`, `academic`, `consultant`, `accountant`, `teacher`, `guardian`, `student`).
4. `permissions`: Danh mục quyền hạn chi tiết theo chuẩn REST/Action.
5. `user_roles`: Bảng liên kết đa-đa giữa người dùng và vai trò.
6. `role_permissions`: Bảng liên kết quyền hạn của từng vai trò.
7. `refresh_tokens`: Lưu trữ phiên đăng nhập và thu hồi token khi đăng xuất.
8. `consents`: Bản ghi đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.

### 1.2. Phân Hệ Đào Tạo, Lớp Học & Điểm Danh (10 bảng)
9. `levels`: Cấp độ đào tạo chuẩn hóa (Mầm non, Tiểu học, THCS, THPT, Đại học/Đi làm).
10. `programs`: Khóa học đào tạo (Starters, Movers, Flyers, IELTS 5.5, IELTS 6.5, IELTS 7.5+).
11. `fee_plans`: Biểu phí niêm yết (theo buổi, theo tháng, theo khóa, số buổi đi kèm).
12. `rooms`: Phòng học tại cơ sở kèm sức chứa tối đa.
13. `classes`: Lớp học đang mở, thời gian bắt đầu, kết thúc, lịch lặp lại (recurrence).
14. `class_sessions`: Các buổi học cụ thể theo lịch, giảng viên đứng lớp, phòng học.
15. `class_teachers`: Phân công giáo viên (chính/trợ giảng) theo thời gian.
16. `enrollments`: Học viên ghi danh vào lớp, trạng thái (`active`, `transferred`, `paused`, `stopped`, `completed`).
17. `teacher_checkins`: Điểm danh GPS của giáo viên (tọa độ GPS, khoảng cách bán kính, ảnh chụp lớp).
18. `attendance_records`: Bản ghi điểm danh học viên từng buổi (có mặt, đi muộn, có phép, không phép, mã QR đối chiếu).

### 1.3. Phân Hệ Khảo Thí & Đánh Giá Năng Lực (9 bảng)
19. `question_tags`: Thẻ phân loại câu hỏi (kỹ năng, cấp độ khó, chủ đề ngữ pháp).
20. `questions`: Ngân hàng câu hỏi trắc nghiệm, điền từ, đọc hiểu, tự luận.
21. `question_options`: Các phương án trả lời kèm chỉ báo đúng/sai và giải thích đáp án.
22. `exams`: Đề kiểm tra, đề thi định kỳ, thời gian làm bài, cấu hình đảo đề.
23. `exam_questions`: Danh sách câu hỏi thuộc đề thi kèm điểm số.
24. `exam_attempts`: Lượt làm bài thi của học sinh, thời gian bắt đầu, nộp bài, số lần vi phạm chuyển tab.
25. `exam_answers`: Câu trả lời chi tiết của học sinh cho từng câu.
26. `essay_submissions`: Bài viết tự luận chờ chấm điểm.
27. `grades`: Điểm số chính thức của học sinh, nhận xét của giáo viên.

### 1.4. Phân Hệ Học Sinh, Phụ Huynh & Báo Cáo (7 bảng)
28. `students`: Thông tin hồ sơ học sinh, cờ tài khoản trẻ em (`is_young_account`).
29. `guardians`: Hồ sơ phụ huynh, mã giới thiệu nhận thưởng (`referral_code`).
30. `guardianships`: Quan hệ học sinh - phụ huynh (bố, mẹ, người giám hộ) kèm quyền nhận tin/xem điểm.
31. `daily_summaries`: Nhật ký tóm tắt buổi học gửi tự động cho phụ huynh lúc 20:00.
32. `monthly_reports`: Báo cáo tháng do AI dự thảo, giáo viên duyệt trước ngày 3.
33. `competencies`: Khung năng lực chuẩn (CEFR A1–C1, Cambridge YLE, IELTS 4 kỹ năng).
34. `student_competencies`: Điểm đánh giá năng lực hiện tại của từng học sinh theo radar chart.

### 1.5. Phân Hệ Trí Tuệ Nhân Tạo (AI) & Giáo Trình Số (9 bảng)
35. `kb_documents`: Tài liệu kho tri thức tuyển sinh (học phí, khóa học, chính sách) có trạng thái duyệt (`approved`).
36. `kb_chunks`: Các đoạn văn bản đã chia nhỏ kèm vector embedding 768 chiều.
37. `ai_usage_logs`: Nhật ký chi phí gọi mô hình AI (tokens, chi phí USD, provider, user).
38. `ai_tutor_sessions`: Phiên trò chuyện học tập 1-1 giữa học sinh và AI Tutor.
39. `curriculum_modules`: Học phần giáo trình điện tử.
40. `curriculum_lessons`: Bài học chi tiết kèm học liệu đa phương tiện (video, audio, text).
41. `curriculum_suggestions`: Đề xuất nội dung bổ sung giáo trình do AI sinh ra.
42. `curriculum_videos`: Video bài giảng sinh tự động (ràng buộc DB `ck_vid_render` bắt buộc phải duyệt kịch bản trước khi render).
43. `early_warning_signals`: Cảnh báo nguy cơ học sinh bỏ học do AI phân tích.

### 1.6. Phân Hệ Tài Chính, Truyền Thông & Tuyển Sinh (5 bảng)
44. `tuition_invoices`: Hóa đơn học phí, hạn thanh toán, số tiền VNĐ.
45. `payments`: Bản ghi thanh toán (tiền mặt, chuyển khoản, VietQR, VNPay webhook).
46. `teacher_payrolls`: Bảng tính lương giáo viên dựa trên số giờ dạy và KPI thực tế.
47. `surveys` & `survey_responses`: Khảo sát chất lượng dịch vụ và tính điểm NPS.
48. `leads`, `placement_tests`, `campaigns`, `webhooks_log`: Tiếp nhận leads tuyển sinh, lưu bài test đầu vào và nhật ký tích hợp webhook.

---

## 2. Nguyên Tắc Thiết Kế Cơ Sở Dữ Liệu Bắt Buộc

1. **Bảo toàn nguyên tắc Database-First**: Tuyệt đối không chỉnh sửa trực tiếp file nguồn `db/000_schema.sql` để bảo đảm tính tương thích với hệ thống MySQL 8.4 hiện hành.
2. **Khóa Ngoại & Tính Toàn Vẹn**: Toàn bộ quan hệ cha - con đều có khóa ngoại (`FOREIGN KEY`) với chính sách hạn chế xóa lan truyền (`ON DELETE RESTRICT`) đối với dữ liệu lịch sử tài chính, điểm số và điểm danh.
3. **Mã Hóa & Bảo Mật Dữ Liệu**: Mật khẩu mã hóa bằng hàm băm một chiều `Argon2id`, token QR và link khảo sát sử dụng mã xác thực thông điệp `HMAC-SHA256`.
