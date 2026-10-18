# BÁO CÁO KIỂM TRA TOÀN DIỆN DỰ ÁN (PROJECT AUDIT)
**Dự án**: CoreLink Academy — Hệ thống Quản lý Đào tạo Tiếng Anh Tích hợp AI  
**Thời gian kiểm tra**: 18/10/2026  
**Người thực hiện**: Đội ngũ Tech Lead, Solution Architect & QA  

---

## 1. Cấu Trúc Thư Mục & Hệ Sinh Thái Workspace

Dự án đang sử dụng kiến trúc **Monorepo** với trình quản lý gói `pnpm` (pnpm workspace v9.15.9, Node.js v22/v24), tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns):

```
CoreLinkAcademy/
├── apps/
│   ├── api/          # NestJS 11 REST API, Swagger OpenAPI (/api/docs), Passport JWT, RBAC
│   ├── web/          # Next.js 15 (App Router), TailwindCSS, TypeScript, PWA Manifest, 52 routes
│   └── worker/       # NestJS Background Worker (BullMQ queue, WebPush notifications, AI tasks)
├── packages/
│   ├── shared/       # DTOs, Enums, Interfaces, Helper Functions dùng chung
│   └── ai/           # AI Gateway (Claude 3.5 Sonnet, Gemini 1.5 Flash, HeyGen, Embeddings, Budget Guard)
├── db/
│   ├── 000_schema.sql # CSDL chuẩn 84 bảng (Database-First, MySQL 8.4, 3NF, Foreign Keys, UTF8MB4)
│   └── *.sql         # Các script trích xuất cấu trúc và phân quyền
├── prisma/
│   └── schema.prisma # Prisma Client mapping 100% khớp với 84 bảng MySQL
├── docs/             # Tài liệu đặc tả CORELINK_MASTER.md, TEAM_PROMPT.md, Walkthroughs B1-B16
└── docker-compose.yml# MySQL 8.4, Redis 7, MinIO S3, Mailpit
```

---

## 2. Kiểm Tra Tài Liệu Nghiệp Vụ & Yêu Cầu Hiện Có

Hệ thống tài liệu gốc đã được rà soát chi tiết:
1. `docs/CORELINK_MASTER.md`: Tài liệu đặc tả kỹ thuật 4 phần (A: Quy tắc phát triển, B: Nghiệp vụ và 44 màn hình S01-S44, C: Kịch bản thử nghiệm 136 TCs, D: Bàn giao).
2. `docs/TEAM_PROMPT.md`: Quy trình phối hợp 8 vai trò ảo (BA, Tech Lead, Dev Backend, Dev Frontend, Dev AI, DevOps, QA, Security Reviewer).
3. `docs/PROGRESS.md` & `docs/walkthroughs/TONG_KET_DU_AN.md`: Lịch sử thực thi 16 bước phát triển từ GĐ1 đến GĐ3.
4. `docs/test-cases-gd2-gd3.md`: Ma trận 72 test cases bổ sung cho AI và tích hợp tự động hóa.

---

## 3. Hiện Trạng Các Module Backend, Database & API

| Module Backend | Đường dẫn API | Trạng thái Nghiệp vụ | Trạng thái Database | Kết quả Test E2E |
|---|---|---|---|:---:|
| **Auth & RBAC** | `/api/v1/auth/*` | Hoàn thành: Login, Refresh, Logout, Change Password, Consent (Nghị định 13) | Bảng `users`, `roles`, `user_roles`, `consents`, `refresh_tokens` | **15/15 PASS** |
| **Public & Leads** | `/api/v1/public/*` | Hoàn thành: Khóa học công khai, Đăng ký học thử, Placement test token, CRM Leads | Bảng `programs`, `fee_plans`, `leads`, `placement_tests`, `branches` | **14/14 PASS** |
| **Chatbot AI (RAG)** | `/api/v1/ai-chatbot/*` | Hoàn thành: Vector Search (768-dim), RAG Knowledge Base, Budget Guardrails | Bảng `kb_documents`, `kb_chunks`, `ai_usage_logs` | **6/6 PASS** |
| **Academic** | `/api/v1/academic/*` | Hoàn thành: Quản lý lớp, buổi học, phòng học, giáo viên chủ nhiệm, ghi danh | Bảng `classes`, `class_sessions`, `rooms`, `enrollments`, `class_teachers` | **12/12 PASS** |
| **Attendance QR** | `/api/v1/attendance/*` | Hoàn thành: QR động mã hóa HMAC-SHA256 (30s xoay), GPS Check-in (150m), Chụp ảnh lớp | Bảng `attendance_records`, `teacher_checkins` | **15/15 PASS** |
| **Messages & Notif** | `/api/v1/messages/*`, `/api/v1/notifications/*` | Hoàn thành: Tin nhắn 1-1, Bảng tin lớp học (chỉ GV đăng), WebPush | Bảng `messages`, `class_announcements`, `notifications` | **15/15 PASS** |
| **Assessment Core** | `/api/v1/assessment/*` | Hoàn thành: Ngân hàng câu hỏi, Sinh đề ngẫu nhiên, Làm bài online, Chống gian lận | Bảng `questions`, `question_tags`, `exams`, `exam_attempts`, `exam_answers` | **17/17 PASS** |
| **AI Grading** | `/api/v1/ai-grading/*` | Hoàn thành: Chấm tự luận AI (Grammar, Lexical, Coherence), GV phê duyệt điểm | Bảng `essay_submissions`, `ai_grading_results`, `grades` | **5/5 PASS** |
| **Parents & Reports**| `/api/v1/parents/*` | Hoàn thành: Cổng phụ huynh, Theo dõi con, Báo cáo ngày (20h), Báo cáo tháng AI | Bảng `guardians`, `guardianships`, `monthly_reports`, `daily_summaries` | **12/12 PASS** |
| **Finance & Admin** | `/api/v1/finance/*`, `/api/v1/admin/*` | Hoàn thành: Học phí, Lương giáo viên, Khảo sát NPS (HMAC token) | Bảng `tuition_invoices`, `payments`, `teacher_payrolls`, `surveys` | **24/24 PASS** |
| **Competency & Adaptive** | `/api/v1/competency/*` | Hoàn thành: Radar 4 kỹ năng (CEFR/YLE/IELTS), Bài luyện thích ứng, AI Tutor 1-1 | Bảng `competencies`, `student_competencies`, `ai_tutor_sessions` | **7/7 PASS** |
| **Smart Curriculum**| `/api/v1/smart-curriculum/*` | Hoàn thành: Giáo trình số, Đề xuất bổ sung nội dung AI | Bảng `curriculum_modules`, `curriculum_lessons`, `curriculum_suggestions` | **2/2 PASS** |
| **Video AI Pipeline**| `/api/v1/video-curriculum/*`| Hoàn thành: Script AI, State machine duyệt kịch bản, Render HeyGen video | Bảng `curriculum_videos` (ràng buộc DB `ck_vid_render`) | **2/2 PASS** |
| **AI Assistant** | `/api/v1/ai-assistant/*` | Hoàn thành: Early warning nguy cơ bỏ học, Trợ lý điều hành CEO | Bảng `early_warning_signals`, `executive_insights` | **2/2 PASS** |
| **Final Integration**| `/api/v1/final-integration/*`| Hoàn thành: Landing chiến dịch, Cổng thanh toán VietQR/VNPay HMAC, Báo cáo | Bảng `campaigns`, `webhooks_log`, `payments` | **2/2 PASS** |

---

## 4. Hiện Trạng Giao Diện Frontend (Apps/Web)

- Next.js 15 App Router với **52 routes** tĩnh và động.
- Đã bao phủ toàn bộ **44 màn hình nghiệp vụ (S01–S44)**.
- Giao diện sử dụng TailwindCSS, dark mode hiện đại, glassmorphism, responsive cho thiết bị di động (PWA manifest đã được tích hợp).
- Trạng thái kết nối API: 100% routes được kết nối với Backend API thật qua HTTP Client, có token Authorization Bearer và Cookie JWT.

---

## 5. Đánh Giá Rủi Ro & Khoảng Trống So Với Master Prompt Mới

1. **Trang Chủ (Landing Page S01) Cần Đột Phá Thương Mại**:
   - Trang chủ hiện tại tập trung vào giới thiệu tính năng, nhưng cần nâng cấp theo chuẩn thương mại cao cấp giống VUS, ILA, British Council: Hero Section ấn tượng, Khối Thử trình độ 3 bước, Lộ trình học tương tác sinh động, Danh sách giáo viên quốc tế, Bảng so sánh khóa học, Chứng chỉ thực tế, và Lời chứng thực (Testimonials).
2. **Khu Vực Luyện Tập AI (Học viên)**:
   - Cần bổ sung giao diện **AI Speaking Coach** (thu âm trực tiếp qua trình duyệt với Web Audio API / Speech Recognition, chấm phát âm & mạch lạc).
   - Cần bổ sung **AI Vocabulary Spaced Repetition (Flashcard)** mô phỏng thuật toán lặp lại ngắt quãng (SM-2) theo chuẩn Duolingo/Busuu.
3. **Blog & Tài Nguyên Học Tập (Website công khai)**:
   - Cần mở rộng trang tài nguyên học thuật miễn phí: bài học ngữ pháp, mẹo thi IELTS, tài liệu tải về.
4. **Bảo Mật & Kiểm Soát Ngân Sách**:
   - AI Gateway hiện tại đã có `AiBudgetGuard` ($150/tháng) và `AiSafetyFilter` (chặn nội dung nhạy cảm cho trẻ em), cần tiếp tục duy trì và mở rộng logging chi tiết theo từng user.
