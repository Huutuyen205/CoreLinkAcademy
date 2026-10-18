# MA TRẬN TÍNH NĂNG CHI TIẾT (FEATURE MATRIX)
**Dự án**: CoreLink Academy  
**Tiêu chí phân loại**:
1. `Đã hoàn thành và đã kiểm thử`: Đầy đủ UI, API, DB, RBAC và có test case tự động PASS.
2. `Đã có nhưng cần nâng cấp`: Đã hoạt động nhưng cần mở rộng trải nghiệm theo Master Prompt.
3. `Chỉ có giao diện, chưa có nghiệp vụ thực tế`: UI có nhưng API mock hoặc chưa có logic backend.
4. `Chưa triển khai`: Tính năng mới được đề xuất trong Master Prompt chưa bắt đầu.
5. `Đang lỗi`: Có lỗi runtime hoặc logic.
6. `Chưa thể xác minh`: Thiếu dữ liệu kiểm thử.

---

## 1. Khu Vực Công Khai & Tuyển Sinh (Public & Enrollment)

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| PUB-01 | Trang chủ giới thiệu thương hiệu | `/` | `/api/v1/public/programs` | `programs`, `fee_plans` | Public | **Đã có nhưng cần nâng cấp** (Nâng cấp Hero, Lộ trình tương tác) | PASS |
| PUB-02 | Chi tiết khóa học & Lộ trình | `/courses` | `/api/v1/public/programs/:code` | `programs`, `levels` | Public | **Đã hoàn thành và đã kiểm thử** | PASS |
| PUB-03 | Chatbot AI Tuyển sinh nổi | `ChatbotWidget.tsx` | `/api/v1/ai-chatbot/chat` | `kb_documents`, `kb_chunks` | Public | **Đã hoàn thành và đã kiểm thử** | 6/6 PASS |
| PUB-04 | Đăng ký tư vấn / Học thử | `/register-trial` | `/api/v1/public/register-trial` | `leads` | Public | **Đã hoàn thành và đã kiểm thử** | PASS |
| PUB-05 | Kiểm tra trình độ Online (Placement Test)| `/placement-test/[token]` | `/api/v1/public/placement-test/:token` | `placement_tests`, `questions` | Public | **Đã hoàn thành và đã kiểm thử** | PASS |
| PUB-06 | Thông tin trung tâm & Cơ sở | `/info` | `/api/v1/public/branches` | `branches` | Public | **Đã hoàn thành và đã kiểm thử** | PASS |
| PUB-07 | Blog & Tài nguyên học tập miễn phí | `/blog` *(Đề xuất)* | `/api/v1/public/blog` *(Đề xuất)* | `blog_posts` | Public | **Chưa triển khai** (Theo Master Prompt) | Chưa test |

---

## 2. Xác Thực & Hồ Sơ Cá Nhân (Auth & User Profile)

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| AUT-01 | Đăng nhập đa vai trò | `/login` | `/api/v1/auth/login` | `users`, `roles`, `user_roles` | Public | **Đã hoàn thành và đã kiểm thử** | PASS |
| AUT-02 | Làm mới Token (Refresh Token) | Interceptor | `/api/v1/auth/refresh` | `refresh_tokens` | All | **Đã hoàn thành và đã kiểm thử** | PASS |
| AUT-03 | Đổi mật khẩu bắt buộc lần đầu | `/change-password` | `/api/v1/auth/change-password` | `users.must_change_password`| All | **Đã hoàn thành và đã kiểm thử** | PASS |
| AUT-04 | Đồng ý xử lý dữ liệu (NĐ 13/2023) | Modal popup | `/api/v1/auth/consent` | `consents` | All | **Đã hoàn thành và đã kiểm thử** | PASS |
| AUT-05 | Hồ sơ cá nhân | `/profile` | `/api/v1/users/me` | `users`, `user_profiles` | Authenticated | **Đã hoàn thành và đã kiểm thử** | PASS |

---

## 3. Cổng Học Sinh & Học Tập Thông Minh (Student Learning Portal)

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| STU-01 | Dashboard tiến độ học sinh | `/student` | `/api/v1/students/dashboard` | `enrollments`, `classes` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-02 | Thời khóa biểu & Điểm danh | `/student/schedule` | `/api/v1/students/schedule` | `class_sessions` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-03 | Danh sách bài tập & Nộp bài | `/assignments` | `/api/v1/assignments` | `assignments`, `submissions` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-04 | Làm bài online & Chống gian lận | `/assignments/[id]/take` | `/api/v1/assessment/submit` | `exam_attempts`, `exam_answers`| Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-05 | Kết quả bài thi & Giải thích đáp án | `/assignments/[id]/results`| `/api/v1/assessment/results/:id` | `grades`, `questions` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-06 | Kho tài liệu số theo bài học | `/student/materials` | `/api/v1/smart-curriculum` | `curriculum_lessons` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-07 | Gia sư AI 1-kèm-1 (AI Tutor) | `/student/tutor` | `/api/v1/competency/ai-tutor` | `ai_tutor_sessions` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-08 | Radar năng lực 4 kỹ năng & Luyện thích ứng| `/student/competency` | `/api/v1/competency/radar` | `student_competencies` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-09 | Quét mã QR điểm danh động | `/attendance` | `/api/v1/attendance/qr-checkin`| `attendance_records` | Student | **Đã hoàn thành và đã kiểm thử** | PASS |
| STU-10 | AI Speaking Coach (Luyện nói ghi âm) | `/student/speaking` *(Đề xuất)* | `/api/v1/ai/speaking-analyze` *(Đề xuất)* | `speaking_submissions` | Student | **Chưa triển khai** (Master Prompt) | Chưa test |
| STU-11 | AI Vocabulary Flashcard (Spaced Repetition) | `/student/vocabulary` *(Đề xuất)* | `/api/v1/ai/vocabulary` *(Đề xuất)* | `user_vocabulary` | Student | **Chưa triển khai** (Master Prompt) | Chưa test |

---

## 4. Cổng Phụ Huynh & Theo Dõi Tiến Độ (Parent Portal)

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| PAR-01 | Tổng quan học tập của con | `/parent` | `/api/v1/parents/overview` | `guardianships`, `students` | Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |
| PAR-02 | Chi tiết điểm số & Bài tập của con | `/parent/assignments` | `/api/v1/parents/student/:id/grades`| `grades`, `submissions` | Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |
| PAR-03 | Báo cáo ngày (20h) & Báo cáo tháng AI | `/parent/monthly-reports` | `/api/v1/parents/reports/monthly` | `monthly_reports`, `daily_summaries`| Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |
| PAR-04 | Học phí & Thanh toán VietQR/VNPay | `/parent/tuition`, `/pay` | `/api/v1/finance/pay-tuition` | `tuition_invoices`, `payments` | Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |
| PAR-05 | Khảo sát chất lượng & NPS (HMAC token) | `/parent/surveys` | `/api/v1/finance/surveys` | `surveys`, `survey_responses` | Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |
| PAR-06 | Giới thiệu học viên nhận thưởng | `/referrals` | `/api/v1/parents/referrals` | `guardians.referral_code` | Guardian | **Đã hoàn thành và đã kiểm thử** | PASS |

---

## 5. Cổng Giáo Viên & Giảng Dạy (Teacher Portal)

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| TEA-01 | Bàn làm việc giáo viên | `/teacher` | `/api/v1/teachers/dashboard` | `classes`, `teachers` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-02 | Lớp học phụ trách & Điểm danh buổi | `/academic/attendance/:id` | `/api/v1/attendance/teacher-checkin`| `attendance_records` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-03 | Giáo trình điện tử & Đề xuất AI | `/teacher/curriculum` | `/api/v1/smart-curriculum` | `curriculum_suggestions` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-04 | Video bài giảng AI (HeyGen pipeline) | `/teacher/curriculum/videos`| `/api/v1/video-curriculum` | `curriculum_videos` | Teacher/Academic | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-05 | Ngân hàng câu hỏi & Sinh đề AI | `/teacher/ai-generator` | `/api/v1/assessment/ai-generate` | `questions`, `exams` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-06 | Chấm bài tự luận có AI hỗ trợ | `/teacher/grading/ai-assist`| `/api/v1/ai-grading/approve` | `ai_grading_results`, `grades` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-07 | Duyệt báo cáo tháng trước ngày 3 | `/teacher/monthly-reports` | `/api/v1/parents/reports/approve`| `monthly_reports` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |
| TEA-08 | Bảng lương giáo viên minh bạch | `/teacher/payroll` | `/api/v1/finance/my-payroll` | `teacher_payrolls` | Teacher | **Đã hoàn thành và đã kiểm thử** | PASS |

---

## 6. Cổng Giáo Vụ, Kế Toán, Tư Vấn & Admin

| Mã | Tên tính năng | Frontend | Backend | Database | Quyền | Trạng thái | Kiểm thử |
|---|---|---|---|---|---|---|:---:|
| CON-01 | CRM Quản lý Leads tuyển sinh | `/consultant/leads` | `/api/v1/public/leads` | `leads` | Consultant/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| CON-02 | Phễu chuyển đổi tuyển sinh | `/consultant/funnel` | `/api/v1/public/funnel` | `leads` | Consultant/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ACA-01 | Xếp lớp, xếp phòng, sĩ số | `/academic/classes` | `/api/v1/academic/classes` | `classes`, `rooms` | Academic/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ACA-02 | Điều phối lịch học trung tâm | `/academic/schedule` | `/api/v1/academic/sessions` | `class_sessions` | Academic/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ACC-01 | Thu học phí & Xuất hóa đơn | `/accounting/tuition` | `/api/v1/finance/invoices` | `tuition_invoices` | Accountant/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ACC-02 | Tính & Duyệt bảng lương GV | `/accounting/payroll` | `/api/v1/finance/calculate-payroll` | `teacher_payrolls` | Accountant/Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ADM-01 | Dashboard KPI & Doanh thu | `/admin/dashboard` | `/api/v1/admin/dashboard` | Toàn bộ 48 bảng | Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ADM-02 | Quản lý người dùng & Import CSV | `/admin/users`, `/imports` | `/api/v1/admin/users`, `/import` | `users`, `students` | Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ADM-03 | Kho tri thức RAG & Cấu hình AI | `/admin/knowledge-base`, `/settings` | `/api/v1/ai-chatbot/kb` | `kb_documents`, `system_settings`| Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
| ADM-04 | Cảnh báo sớm nguy cơ thôi học AI | `/admin/early-warning` | `/api/v1/ai-assistant/early-warning` | `early_warning_signals` | Admin/Academic | **Đã hoàn thành và đã kiểm thử** | PASS |
| ADM-05 | Trợ lý điều hành CEO AI | `/admin/executive-assistant`| `/api/v1/ai-assistant/insights` | Read-only analytics | Admin | **Đã hoàn thành và đã kiểm thử** | PASS |
