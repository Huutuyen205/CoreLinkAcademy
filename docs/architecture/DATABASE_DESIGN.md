# THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN DOANH NGHIỆP (DATABASE DESIGN SPECIFICATION)
**Dự án**: CoreLink Academy  
**Công nghệ**: MySQL 8.4 Enterprise / Prisma ORM (Database-First)  
**Quy mô**: 84 Bảng chuẩn hóa 3NF, 11 Triggers bảo vệ tính toàn vẹn, 4 Views tổng hợp thời gian thực.

---

## 1. Phân Nhóm 84 Bảng Dữ Liệu Theo 10 Phân Hệ Nghiệp Vụ

### 1.1. Phân Hệ Người Dùng, Chi Nhánh & Bảo Mật (15 bảng)
1. `branches`: Danh mục cơ sở trung tâm (tên, địa chỉ, tọa độ GPS lat/lng, bán kính check-in).
2. `rooms`: Phòng học tại cơ sở kèm sức chứa tối đa.
3. `files`: Quản lý siêu dữ liệu tệp đính kèm (storage_key, loại MIME, dung lượng, bản quyền, thời hạn lưu).
4. `users`: Bảng người dùng gốc (email, phone, username, mật khẩu mã hóa Argon2id, trạng thái, số lần đăng nhập sai, thời gian khóa).
5. `roles`: Danh mục vai trò (`admin`, `academic`, `consultant`, `accountant`, `teacher`, `guardian`, `student`).
6. `permissions`: Danh mục quyền hạn chi tiết theo chuẩn REST/Action.
7. `role_permissions`: Bảng liên kết quyền hạn của từng vai trò.
8. `user_roles`: Bảng liên kết đa-đa giữa người dùng và vai trò.
9. `refresh_tokens`: Lưu trữ phiên đăng nhập và thu hồi token khi đăng xuất (hỗ trợ xoay vòng refresh token).
10. `password_resets`: Mã đặt lại mật khẩu một lần (hết hạn 30 phút).
11. `teachers`: Hồ sơ giáo viên, chuyên môn, chứng chỉ, nơi công tác khác, tiểu sử công khai.
12. `teacher_availability`: Lịch rảnh trong tuần của giáo viên phục vụ xếp lịch và phân công dạy thay.
13. `students`: Hồ sơ học viên, mã học sinh, trường đang học, cờ tài khoản trẻ em (`is_young_account`).
14. `guardians`: Hồ sơ phụ huynh, mã giới thiệu nhận thưởng (`referral_code`).
15. `guardianships`: Quan hệ học sinh - phụ huynh (bố, mẹ, người giám hộ) kèm 3 cờ phân quyền riêng biệt (`can_view_results`, `can_message`, `receives_fee_notice`). Ràng buộc tối đa 4 phụ huynh/học sinh qua trigger.

### 1.2. Phân Hệ Tuyển Sinh, CRM & RAG Chatbot (7 bảng)
16. `campaigns`: Chiến dịch marketing theo mùa, ngân sách, mã ưu đãi, kênh truyền thông.
17. `leads`: Khách tiềm năng tuyển sinh, thông tin phụ huynh, học sinh, trạng thái phễu kéo thả.
18. `lead_activities`: Lịch sử tương tác với khách (cuộc gọi, hẹn học thử, ghi chú tư vấn).
19. `kb_documents`: Kho tri thức tuyển sinh đã duyệt (`approved`), tiêu chuẩn chất lượng.
20. `kb_chunks`: Các đoạn văn bản đã chia nhỏ kèm vector embedding 768 chiều phục vụ RAG cosine search.
21. `chat_sessions`: Phiên trò chuyện tư vấn tuyển sinh 24/7 của khách vãng lai.
22. `chat_turns`: Lượt hỏi đáp của chatbot, trích dẫn đoạn nguồn (`cited_chunk_ids`) và phản hồi SSE.

### 1.3. Phân Hệ Đào Tạo, Lớp Học & Phòng Học (10 bảng)
23. `levels`: Cấp độ đào tạo chuẩn hóa (Mầm non, Tiểu học, THCS, THPT, Luyện thi IELTS).
24. `fee_plans`: Biểu phí niêm yết (theo buổi, theo tháng, theo khóa, số buổi đi kèm).
25. `programs`: Khóa học đào tạo kèm chuẩn đầu ra và liên kết khung chương trình GDPT.
26. `classes`: Lớp học đang mở, thời gian bắt đầu, kết thúc, lịch lặp lại (recurrence).
27. `class_teachers`: Phân công giáo viên chủ nhiệm và trợ giảng theo khoảng thời gian.
28. `enrollments`: Học viên ghi danh vào lớp, trạng thái (`active`, `transferred`, `paused`, `stopped`, `completed`).
29. `class_sessions`: Các buổi học cụ thể theo lịch, giảng viên đứng lớp, phòng học, mã link Meet/Zoom.
30. `study_groups`: Nhóm học tập riêng biệt trong lớp học phục vụ giao bài tập phân hóa.
31. `study_group_members`: Thành viên học sinh thuộc nhóm học tập.
32. `reschedule_requests`: Đơn đề xuất đổi lịch buổi học của giáo viên chờ Giáo vụ duyệt.

### 1.4. Phân Hệ Điểm Danh QR & Chấm Công (4 bảng)
33. `session_qr_tokens`: Mã QR động sinh cho từng buổi học có ký số HMAC-SHA256 chống làm giả.
34. `teacher_checkins`: Điểm danh GPS của giáo viên (tọa độ GPS, khoảng cách bán kính, ảnh chụp lớp).
35. `attendance`: Bản ghi điểm danh học viên từng buổi (có mặt, đi muộn, có phép, không phép).
36. `absence_requests`: Đơn xin nghỉ học trước buổi của học sinh/phụ huynh.

### 1.5. Phân Hệ Giáo Trình, Học Liệu & Video AI (8 bảng)
37. `standards`: Chuẩn năng lực ngôn ngữ quốc tế (CEFR, Cambridge YLE, GDPT 2018).
38. `curricula`: Giáo trình điện tử khung của trung tâm.
39. `curriculum_versions`: Quản lý các phiên bản cập nhật của giáo trình.
40. `curriculum_nodes`: Cây cấu trúc chương, bài, mục tiêu học tập, trích dẫn trang nguồn.
41. `curriculum_suggestions`: Đề xuất bổ sung nội dung bài học do AI phân tích khoảng trống kiến thức.
42. `lesson_plans`: Kế hoạch bài dạy (giáo án) chuẩn và giáo án cá nhân của giáo viên.
43. `materials`: Tài liệu học tập (phiếu bài tập, slide, từ vựng, hình minh họa) đính kèm bài học.
44. `videos`: Video bài giảng AI (ràng buộc `ck_vid_render` bắt buộc phải duyệt kịch bản trước khi render).

### 1.6. Phân Hệ Ngân Hàng Câu Hỏi, Đề Thi & Chấm Điểm (8 bảng)
45. `rubrics`: Tiêu chí chấm điểm chi tiết cho bài thi viết và nói (Task Achievement, Lexical, Grammar, Coherence).
46. `questions`: Ngân hàng câu hỏi trắc nghiệm, điền từ, đọc hiểu, tự luận, ghi âm giọng nói.
47. `assignments`: Bài tập, bài thi giao cho lớp hoặc học sinh kèm hạn nộp và cấu hình công bố đáp án.
48. `assignment_questions`: Danh sách câu hỏi trong bài tập kèm điểm số tương ứng.
49. `assignment_targets`: Đối tượng được giao bài (cả lớp, nhóm học tập hoặc học sinh cá nhân).
50. `attempts`: Lượt làm bài thi trực tuyến, ghi nhận thời gian, tự động nộp khi hết giờ, phát hiện rời tab.
51. `answers`: Câu trả lời của học sinh, kết quả chấm tự động, điểm AI đề xuất và nhận xét.
52. `regrade_requests`: Yêu cầu chấm phúc khảo bài thi của học sinh/phụ huynh trong vòng 7 ngày.

### 1.7. Phân Hệ Giao Tiếp, Tin Nhắn & Bảng Tin (11 bảng)
53. `conversations`: Cuộc trò chuyện 1-1 giữa giáo viên, phụ huynh và học sinh (chặn học sinh nhỏ).
54. `conversation_participants`: Thành viên tham gia cuộc trò chuyện.
55. `messages`: Tin nhắn văn bản, hình ảnh, tệp đính kèm và ghi âm (không cho phép xóa qua trigger).
56. `message_edits`: Lưu vết lịch sử chỉnh sửa tin nhắn trong khung thời gian 5 phút.
57. `message_reports`: Báo cáo nội dung tin nhắn không phù hợp để Admin xử lý khóa chat.
58. `chat_access_requests`: Yêu cầu phụ huynh xem tin nhắn giữa con và giáo viên (chỉ đọc trong 72h).
59. `announcements`: Bảng tin lớp học (chỉ giáo viên đăng bài, không bình luận).
60. `announcement_reads`: Nhật ký xác nhận đã đọc thông báo lớp của học sinh và phụ huynh.
61. `notifications`: Thông báo đẩy đa kênh (WebPush & in-app badge).
62. `notification_preferences`: Cài đặt nhận thông báo theo danh mục (tôn trọng giờ yên tĩnh 21h-7h).
63. `push_subscriptions`: Thông tin đăng ký thiết bị nhận WebPush của trình duyệt.

### 1.8. Phân Hệ Đánh Giá, Năng Lực & Báo Cáo Phụ Huynh (5 bảng)
64. `evaluations`: Đánh giá định tính của giáo viên theo buổi (thái độ, tập trung, tiến bộ).
65. `competency_scores`: Điểm năng lực 4 kỹ năng truy xuất nguồn gốc về bài kiểm tra cụ thể.
66. `daily_summaries`: Bản tin tóm tắt buổi học gửi tự động cho phụ huynh lúc 20:00.
67. `monthly_reports`: Báo cáo tháng do AI dự thảo, giáo viên duyệt trước ngày 3 hàng tháng.
68. `teacher_metrics`: Chỉ số chất lượng giáo viên (điểm khảo sát, tỷ lệ chấm đúng hạn, phản hồi).

### 1.9. Phân Hệ Tài Chính, Học Phí & Bảng Lương (9 bảng)
69. `invoices`: Hóa đơn học phí học viên, số tiền, giảm trừ, hạn nộp.
70. `payments`: Bản ghi thu tiền thực tế (tiền mặt, chuyển khoản, VietQR, VNPay webhook).
71. `receipt_counters`: Bộ đếm số biên nhận đảm bảo tăng tuần tự không trùng lặp.
72. `receipts`: Biên lai thu tiền học phí chính thức.
73. `pay_rates`: Đơn giá buổi dạy của từng giáo viên do Admin thiết lập theo ngày hiệu lực.
74. `payroll_periods`: Kỳ tính lương hàng tháng của trung tâm.
75. `payroll_items`: Bảng tính lương chi tiết cho từng giáo viên (khóa chỉnh sửa khi kỳ đã chốt).
76. `payroll_sessions`: Danh sách các buổi dạy thực tế được tính lương trong kỳ.
77. `holidays`: Danh mục ngày nghỉ lễ toàn trung tâm phục vụ dời lịch tự động.

### 1.10. Phân Hệ Quản Trị, Thiết Lập & Khảo Sát (7 bảng)
78. `settings`: Cấu hình hệ thống động (ngân sách AI, bán kính GPS, giờ yên tĩnh, ngưỡng trẻ em).
79. `audit_logs`: Nhật ký kiểm toán toàn bộ thay đổi nhạy cảm (quyền, sửa điểm, học phí, xem chat).
80. `imports`: Nhật ký nhập dữ liệu hàng loạt từ file Excel kèm xem trước và xuất file lỗi.
81. `ai_jobs`: Sổ cái ghi nhận tất cả tác vụ AI (tokens, chi phí USD, provider, log ẩn danh).
82. `surveys`: Phiếu khảo sát chất lượng giảng dạy định kỳ gửi phụ huynh và học sinh.
83. `survey_responses`: Câu trả lời khảo sát ẩn danh bảo vệ danh tính người đánh giá.
84. `consents`: Bản ghi xác nhận đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.

---

## 2. Nguyên Tắc Thiết Kế Cơ Sở Dữ Liệu Bắt Buộc

1. **Bảo toàn nguyên tắc Database-First**: Tuyệt đối không chỉnh sửa trực tiếp file nguồn `db/000_schema.sql` để bảo đảm tính tương thích với hệ thống MySQL 8.4 hiện hành.
2. **Khóa Ngoại & Tính Toàn Vẹn**: Toàn bộ quan hệ cha - con đều có khóa ngoại (`FOREIGN KEY`) với chính sách hạn chế xóa lan truyền (`ON DELETE RESTRICT`) đối với dữ liệu lịch sử tài chính, điểm số và điểm danh.
3. **Mã Hóa & Bảo Mật Dữ Liệu**: Mật khẩu mã hóa bằng hàm băm một chiều `Argon2id`, token QR và link khảo sát sử dụng mã xác thực thông điệp `HMAC-SHA256`.
