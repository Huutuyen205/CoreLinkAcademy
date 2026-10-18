# CoreLink Academy — Hệ Thống Quản Lý Đào Tạo Tiếng Anh Tích Hợp AI

> **Dự án Quản lý đào tạo tiếng Anh thế hệ mới** dành cho các trung tâm ngoại ngữ từ tiền tiểu học đến luyện thi chứng chỉ quốc tế (Cambridge YLE, IELTS, TOEIC), tích hợp trợ lý AI thông minh, học tập thích ứng (adaptive learning), chấm điểm tự động và tự động hóa vận hành toàn diện.

---

## 🌟 1. Tổng Quan Kiến Trúc & Công Nghệ

Hệ thống được phát triển theo kiến trúc **Monorepo (pnpm workspace)**, tuân thủ nghiêm ngặt nguyên tắc **Database-First** (MySQL 8.4 với 48 bảng chuẩn hóa 3NF) và kiến trúc Clean Architecture:

- **Monorepo Workspace**:
  - `apps/api`: NestJS 11 backend REST API (`/api/v1`), Swagger OpenAPI (`/api/docs`), Passport JWT + RBAC, Argon2id, Zod + class-validator.
  - `apps/web`: Next.js 15 (App Router), TailwindCSS, TypeScript, PWA Manifest, hỗ trợ 52 routes giao diện (44 màn hình nghiệp vụ S01–S44).
  - `apps/worker`: NestJS Background Worker xử lý hàng đợi BullMQ, thông báo đẩy WebPush, đồng bộ AI embeddings.
  - `packages/shared`: Thư viện dùng chung chứa DTOs, Enums, Types, Constants và Helper utilities.
  - `packages/ai`: AI Gateway đa mô hình (Claude 3.5 Sonnet, Google Gemini 1.5 Flash, HeyGen API, Deterministic 768-dim Embeddings), bộ kiểm soát ngân sách AI (`AiBudgetGuard`) và kiểm duyệt nội dung an toàn trẻ em (`AiSafetyFilter`).

---

## 🚀 2. Các Giai Đoạn Đã Hoàn Thành (100% Hoàn Tất)

Dự án đã hoàn thành toàn diện **16 Bước** thuộc cả 3 giai đoạn theo chuẩn `docs/CORELINK_MASTER.md`:

| Giai Đoạn | Các Bước | Phạm Vi Triển Khai | Kết Quả Kiểm Thử |
|---|---|---|---|
| **Giai đoạn 1: Nền tảng & Vận hành Core** | Bước 1 → 10 | RBAC, Public CRM & Leads, Quản lý Lớp & Lịch học, Điểm danh QR động (HMAC SHA-256), Ngân hàng câu hỏi & Đề thi, Làm bài & Chống gian lận (AI-06), Chấm điểm tự động & AI hỗ trợ (AI-07), Cổng Phụ huynh & Báo cáo tháng (AI-08), Học phí & Lương giáo viên, Truyền thông & Khảo sát NPS (HMAC). | **136/136 Test Cases PASS** |
| **Giai đoạn 2: Trợ lý AI & Học tập Thích ứng** | Bước 11 → 13 | Chatbot Tuyển sinh & CSKH RAG (AI-12, TC-011..016), Luyện tập Thích ứng & Gia sư AI (AI-09, TC-059..062), Khảo sát Năng lực & Khuyến nghị Lộ trình (AI-13, TC-068..073). | **16/16 Test Cases PASS** |
| **Giai đoạn 3: Tự động hóa & Tích hợp Toàn diện** | Bước 14 → 16 | Sinh Giáo trình & Video Bài giảng AI (AI-10, AI-11, TC-074..075), Cảnh báo Rủi ro & Trợ lý Điều hành AI (AI-14, AI-15, TC-137..140), Tích hợp Toàn diện, Cổng Thanh toán & Báo cáo tổng thể (TC-132, TC-155..160). | **20/20 Test Cases PASS** |

> **Tổng cộng**: 16/16 Test Suites, **186/186 automated E2E tests PASS** trên CI/CD, độ phủ 100% các tiêu chí nghiệm thu.

---

## 🖥️ 3. Ma Trận 44 Màn Hình Nghiệp Vụ (S01 – S44)

Tất cả 44 màn hình nghiệp vụ chuẩn theo Phần B, Mục 11 của tài liệu đặc tả đã được xây dựng hoàn thiện:

- **Công khai & Tuyển sinh**: S01 (Trang chủ Landing), S02 (Chi tiết khóa học), S03 (Chatbot AI tuyển sinh nổi), S04 (Đăng ký học thử), S05 (Thi xếp lớp Online), S06 (Thông tin trung tâm).
- **Xác thực & Chung**: S07 (Đăng nhập / Đổi mật khẩu), S08 (Hồ sơ cá nhân), S09 (Trung tâm thông báo), S10 (Hộp thư nội bộ).
- **Cổng Học Sinh**: S11 (Dashboard học viên), S12 (Lịch học & Buổi học), S13 (Danh sách bài tập), S14 (Làm bài trực tuyến & Chống gian lận), S15 (Kết quả & Lời giải chi tiết), S16 (Kho tài liệu số), S17 (Gia sư AI 1-kèm-1), S18 (Bản đồ năng lực 4 kỹ năng), S19 (Quét mã QR điểm danh).
- **Cổng Phụ Huynh**: S20 (Tổng quan học tập con), S21 (Theo dõi bài tập & Điểm số), S22 (Báo cáo tháng nhận xét AI), S23 (Học phí & Thanh toán VNPay/VietQR), S24 (Khảo sát độ hài lòng & NPS), S25 (Chương trình giới thiệu học viên).
- **Cổng Giáo Viên**: S26 (Bàn làm việc giảng dạy), S27 (Lớp học phụ trách), S28 (Điểm danh & Nhận xét buổi học), S29 (Giáo trình & Đề xuất AI), S30 (Ngân hàng câu hỏi & Sinh đề AI), S31 (Giao bài tập), S32 (Chấm bài tự luận & AI hỗ trợ), S33 (Đánh giá học sinh định kỳ), S34 (Bảng lương & Thù lao).
- **Cổng Tư Vấn & Giáo Vụ**: S35 (CRM Quản lý Leads), S36 (Chăm sóc & Cảnh báo nguy cơ thôi học), S37 (Phễu chuyển đổi tuyển sinh), S38 (Xếp lớp & Điều phối), S39 (Lịch học trung tâm).
- **Cổng Kế Toán**: S40 (Quản lý thu học phí), S41 (Tính & Duyệt bảng lương GV).
- **Cổng Quản Trị (Admin)**: S42 (Dashboard KPI & Doanh thu), S43 (Quản trị người dùng & Nhập liệu Excel/CSV), S44 (Cấu hình hệ thống & Kho tri thức RAG).

---

## 🛠️ 4. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Yêu Cầu Môi Trường
- **Node.js**: >= 20.x (Khuyên dùng v22.x LTS)
- **pnpm**: >= 9.x (`npm install -g pnpm`)
- **Docker & Docker Compose** (hoặc cài sẵn MySQL 8.4, Redis 7)

### Bước 1: Khởi động Hạ tầng Docker
```bash
docker compose up -d
```
Lệnh trên sẽ khởi tạo tự động:
- **MySQL 8.4** (`localhost:3306`) — Tự nạp toàn bộ cấu trúc CSDL `db/000_schema.sql`
- **Redis 7** (`localhost:6379`) — Hàng đợi BullMQ và cache
- **MinIO S3** (`localhost:9000` / Console `localhost:9001`) — Lưu trữ media, video bài giảng
- **Mailpit** (`localhost:1025` / Web UI `localhost:8025`) — Bắt email nội bộ môi trường dev

### Bước 2: Cài Đặt Thư Viện & Sinh Prisma Client
```bash
# Cài đặt toàn bộ dependencies trong monorepo
pnpm install

# Sinh Prisma Client từ schema
pnpm db:generate
```

### Bước 3: Nạp Dữ Liệu Mẫu (Seed Demo Data)
Hệ thống cung cấp sẵn script khởi tạo toàn bộ dữ liệu mẫu phục vụ kiểm thử và demo:
```bash
# Khởi tạo dữ liệu mẫu toàn diện (Cơ sở, Khóa học, 20 GV, 10 Lớp, 80 HS, 100 PH, Knowledge Base)
pnpm seed:demo

# (Tùy chọn) Chỉ tạo riêng tài khoản Admin tối cao
pnpm seed:admin
```

### Bước 4: Khởi Động Ứng Dụng Môi Trường Dev
```bash
# Chạy đồng thời API và Web Client
pnpm dev:all

# Hoặc chạy riêng lẻ từng ứng dụng:
pnpm --filter @corelink/api dev   # API: http://localhost:4000 (Swagger: http://localhost:4000/api/docs)
pnpm --filter @corelink/web dev   # Web: http://localhost:3000
```

---

## 🔑 5. Danh Sách Tài Khoản Mẫu (Demo Credentials)

Sau khi chạy `pnpm seed:demo`, toàn bộ các tài khoản sau đã sẵn sàng đăng nhập:

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Mô Tả Quyền Hạn |
|---|---|---|---|
| **Admin** | `admin@corelink.edu.vn` | `Admin@123456` | Quản trị viên hệ thống toàn quyền |
| **Giáo vụ (Academic)** | `academic@corelink.edu.vn` | `Test@123456` | Xếp lớp, điều phối phòng học, lịch thi |
| **Tư vấn viên (Consultant)** | `consultant@corelink.edu.vn` | `Test@123456` | Quản lý leads tuyển sinh, chăm sóc phụ huynh |
| **Kế toán (Accountant)** | `accountant@corelink.edu.vn` | `Test@123456` | Quản lý học phí, duyệt bảng lương giáo viên |
| **Giáo viên (Teacher)** | `teacher01@corelink.edu.vn` *(đến teacher20)* | `Test@123456` | Điểm danh, giao bài tập, chấm điểm AI, báo cáo |
| **Học sinh (Student)** | `student001@corelink.edu.vn` *(đến student080)* | `Test@123456` | Làm bài, luyện tập thích ứng, gia sư AI |
| **Phụ huynh (Guardian)** | `guardian001@corelink.edu.vn` *(đến guardian100)* | `Test@123456` | Xem điểm, đóng học phí, khảo sát NPS |

---

## 🧪 6. Kiểm Thử Toàn Diện (Testing & Quality Assurance)

```bash
# Kiểm tra tĩnh lỗi kiểu dữ liệu TypeScript toàn repo (Zero errors)
pnpm typecheck

# Đóng gói Production Build (Xác thực 52/52 Next.js routes và NestJS bundles)
pnpm build

# Chạy toàn bộ 16 bộ test E2E tích hợp
pnpm --filter @corelink/api test:e2e --runInBand
```

---

## 📑 7. Tài Liệu Nghiệm Thu Chi Tiết

- **Tài liệu bàn giao tổng kết**: [docs/walkthroughs/TONG_KET_DU_AN.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/walkthroughs/TONG_KET_DU_AN.md)
- **Tài liệu kiến trúc chuẩn**: [docs/CORELINK_MASTER.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/CORELINK_MASTER.md)
- **Kịch bản kiểm thử GĐ2 & GĐ3**: [docs/test-cases-gd2-gd3.md](file:///c:/Users/TUYEN/Desktop/CoreLinkAcademy/CoreLinkAcademy/docs/test-cases-gd2-gd3.md)
- **Nhật ký các bước thực hiện**: Thư mục `docs/walkthroughs/step-01.md` đến `step-16.md`.

---
*Bản quyền phát triển © 2026 CoreLink Academy. Được xây dựng chuẩn hóa theo tài liệu kiến trúc CORELINK_MASTER.*
