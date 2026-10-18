# MA TRẬN TÍNH NĂNG & TRẠNG THÁI TRIỂN KHAI (FEATURE MATRIX)

**Dự án**: CoreLink Academy  
**Phiên bản**: 2.0  
**Ngày cập nhật**: 18/10/2026  

---

## 1. MA TRẬN CHI TIẾT TỪNG MODULE NGHIỆP VỤ

| Phân hệ (Module) | Tuyến đường (Route) | Endpoint API chính | Bảng dữ liệu liên quan | Quyền truy cập | Test Cases | Trạng thái Nghiệp vụ |
|---|---|---|---|---|---|:---:|
| **Trang chủ & Giới thiệu** | `/`, `/info` | `GET /api/v1/public/courses` | `programs`, `courses`, `branches` | GUEST, ALL | TC-001, TC-002 | **Hoàn thành — đã kiểm thử** |
| **Đăng ký Học thử & Lead** | `/register-trial` | `POST /api/v1/public/leads` | `leads`, `lead_activities` | GUEST | TC-003, TC-004 | **Hoàn thành — đã kiểm thử** |
| **Chatbot Tuyển sinh RAG** | Widget nổi toàn trang | `POST /api/v1/ai-chatbot/query` | `kb_documents`, `kb_chunks` | GUEST, ALL | TC-009 đến TC-014 | **Hoàn thành — đã kiểm thử** |
| **Kiểm tra Đầu vào** | `/placement-test/[token]` | `POST /api/v1/public/placement-test` | `placement_tests`, `questions` | GUEST (Token) | TC-015 đến TC-020 | **Hoàn thành — đã kiểm thử** |
| **Xác thực & Quản trị Phiên** | `/login`, `/profile` | `POST /api/v1/auth/login`, `refresh` | `users`, `refresh_tokens`, `consents`| ALL | TC-024 đến TC-038 | **Hoàn thành — đã kiểm thử** |
| **Quản lý Lead & Phễu CRM** | `/consultant/leads` | `GET/PATCH /api/v1/leads/*` | `leads`, `campaigns` | ADMISSIONS, ADMIN | TC-021 đến TC-023 | **Hoàn thành — đã kiểm thử** |
| **Chuyển đổi Lead → Học viên**| `/consultant/leads` | `POST /api/v1/leads/:id/convert` | `students`, `enrollments`, `invoices`| ADMISSIONS, ADMIN | TC-022 | **Hoàn thành — đã kiểm thử** |
| **Cấu trúc Lớp & Thời khóa biểu**| `/academic/classes` | `GET/POST /api/v1/academic/classes` | `classes`, `class_sessions`, `rooms` | ACADEMIC, ADMIN | TC-039 đến TC-045 | **Hoàn thành — đã kiểm thử** |
| **Phát hiện Xung đột Lịch** | `/academic/schedule` | `POST /api/v1/academic/check-conflicts`| `class_sessions`, `rooms`, `teachers`| ACADEMIC, ADMIN | TC-043 | **Hoàn thành — đã kiểm thử** |
| **Điểm danh QR & GPS Check-in**| `/attendance`, `/academic/attendance`| `POST /api/v1/attendance/checkin-teacher`| `attendance_records`, `teacher_checkins`| TEACHER, ACADEMIC | TC-051 đến TC-065 | **Hoàn thành — đã kiểm thử** |
| **Ngân hàng Câu hỏi & Đề thi** | `/teacher/questions` | `GET/POST /api/v1/assessment/questions`| `questions`, `question_tags`, `exams` | TEACHER, ACADEMIC | TC-076 đến TC-085 | **Hoàn thành — đã kiểm thử** |
| **Làm bài Thi Online & Đếm giờ**| `/assignments/[id]/take` | `POST /api/v1/assessment/attempts/:id/submit`| `exam_attempts`, `exam_answers` | STUDENT | TC-086 đến TC-091 | **Hoàn thành — đã kiểm thử** |
| **Chấm bài Tự luận AI** | `/teacher/grading/ai-assist`| `POST /api/v1/ai-grading/essay` | `essay_submissions`, `ai_grading_results`| TEACHER | TC-093, TC-094 | **Hoàn thành — đã kiểm thử** |
| **Cổng Học viên & Radar Kỹ năng**| `/student`, `/student/competency`| `GET /api/v1/student/progress` | `student_competencies`, `enrollments`| STUDENT | TC-099 đến TC-101 | **Hoàn thành — đã kiểm thử** |
| **AI Speaking Coach** | `/student/speaking` | `POST /api/v1/student/speaking/evaluate`| `audio_recordings`, `ai_jobs` | STUDENT | TC-092 | **Hoàn thành — đã kiểm thử** |
| **AI Flashcard Từ vựng** | `/student/vocabulary` | `GET /api/v1/student/vocabulary` | `vocabulary_items`, `spaced_repetition`| STUDENT | TC-097 | **Hoàn thành — đã kiểm thử** |
| **Cổng Phụ huynh & Báo cáo 20h** | `/parent`, `/parent/monthly-reports`| `GET /api/v1/parent/daily-summaries`| `guardians`, `guardianships`, `daily_summaries`| GUARDIAN | TC-103 đến TC-108 | **Hoàn thành — đã kiểm thử** |
| **Bản tin Lớp học (Một chiều)** | `/messages` | `POST /api/v1/messages/announcements` | `class_announcements`, `announcement_reads`| TEACHER, PARENT, STU | TC-109 đến TC-115 | **Hoàn thành — đã kiểm thử** |
| **Học phí & Biên nhận Không trùng**| `/accounting/tuition` | `POST /api/v1/finance/payments` | `tuition_invoices`, `receipt_counters` | ACCOUNTANT, ADMIN | TC-125 đến TC-130 | **Hoàn thành — đã kiểm thử** |
| **Bảng lương Giáo viên** | `/accounting/payroll` | `GET/POST /api/v1/finance/payrolls` | `teacher_payrolls`, `payroll_sessions` | ACCOUNTANT, ADMIN | TC-131 đến TC-133 | **Hoàn thành — đã kiểm thử** |
| **Báo cáo Doanh thu & Tuyển sinh**| `/admin/dashboard` | `GET /api/v1/reports/overview` | `v_lead_funnel_month`, `v_ai_cost_month`| SUPER_ADMIN, ADMIN | TC-144 đến TC-148 | **Hoàn thành — đã kiểm thử** |
| **Cổng Thanh toán Online (VietQR)**| `/parent/tuition/pay` | `POST /api/v1/payments/vietqr/generate` | `payments`, `webhooks_log` | GUARDIAN, ACCOUNTANT | TC-132 | **Chưa cấu hình Webhook thật** (Chạy qua QR tĩnh) |
| **Gửi SMS / Email qua Provider ngoài**| N/A | Provider adapter interfaces | N/A | SYSTEM | TC-121 | **Chưa cấu hình** (Bắt qua Mailpit cục bộ) |

---

## 2. QUY CHUẨN ĐÁNH GIÁ TRẠNG THÁI
1. **Hoàn thành — đã kiểm thử**: Mã nguồn đã được lập trình đầy đủ từ UI, API đến CSDL, đã chạy kiểm thử tự động (Unit / E2E) đạt 100% PASS và có thể thao tác thật trên hệ thống.
2. **Đang phát triển**: Tính năng đang được tối ưu hóa giao diện hoặc bổ sung các kịch bản phụ.
3. **Chưa cấu hình**: Mã nguồn adapter và interface đã hoàn tất, chỉ chờ cung cấp thông tin tài khoản hoặc API keys thực tế của nhà cung cấp bên ngoài (VD: Merchant ID cổng thanh toán, Twilio/SendGrid API Keys).
4. **Bị chặn**: Tính năng chưa thể tiếp tục do phụ thuộc điều kiện tiên quyết.
5. **Trong lộ trình**: Tính năng dài hạn (VD: App Mobile Native độc lập).
