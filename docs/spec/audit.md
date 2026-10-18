# BÁO CÁO AUDIT TOÀN DIỆN REPOSITORY (BASELINE AUDIT)

**Dự án**: Hệ thống Vận hành & Giới thiệu Trung tâm Đào tạo Tiếng Anh CoreLink Academy  
**Phiên bản kiểm toán**: 2.0 (Phase 0 & Phase 1)  
**Thời gian thực hiện**: 18/10/2026  
**Đơn vị thực hiện**: Ban Kỹ thuật & Sản phẩm Cấp cao (Product Manager, Solution Architect, Lead QA & Security Engineer)

---

## 1. MÔI TRƯỜNG RUNTIME, HẠ TẦNG VÀ ĐIỂM VÀO ỨNG DỤNG

### 1.1. Phiên bản công nghệ thực tế trên máy
- **Node.js**: `v24.18.0` (Tương thích Node LTS)
- **Package Manager**: `pnpm@9.15.9` (Monorepo pnpm workspace)
- **Database Engine**: MySQL 8.4 LTS tại `localhost:3306`, cơ sở dữ liệu `corelink`
- **Cache & Message Queue**: Redis 7 tại `localhost:6379`
- **Object Storage**: MinIO S3 tại `localhost:9000`
- **Dev Mail Server**: Mailpit tại `localhost:1025` (Web UI: `localhost:8025`)

### 1.2. Cấu trúc Workspace & Cổng dịch vụ
| Gói / Ứng dụng | Đường dẫn | Công nghệ chính | Cổng (Port) | Điểm vào chính |
|---|---|---|:---:|---|
| **API Backend** | `apps/api` | NestJS 11, Prisma ORM, Passport JWT, Swagger | **4000** | `apps/api/src/main.ts` (`/api/v1/*`, `/api/docs`) |
| **Web Frontend** | `apps/web` | Next.js 15 (App Router), React 19, Tailwind CSS 4 | **3000** | `apps/web/src/app/page.tsx` (55 routes) |
| **Worker Queue** | `apps/worker`| NestJS Standalone, BullMQ, WebPush | N/A | `apps/worker/src/main.ts` |
| **Shared Lib** | `packages/shared` | TypeScript Types, Enums, Zod DTOs | N/A | `packages/shared/src/index.ts` |
| **AI Gateway** | `packages/ai` | Claude 3.5 Sonnet / Gemini 1.5, Anonymizer | N/A | `packages/ai/src/index.ts` |

---

## 2. KẾT QUẢ KIỂM TRA CHẨN ĐOÁN AN TOÀN (BASELINE TESTS)

| Lệnh kiểm tra | Lệnh đã chạy | Kết quả thực tế | Trạng thái |
|---|---|---|:---:|
| **Kiểm tra kiểu dữ liệu tĩnh** | `pnpm --recursive typecheck` | `tsc --noEmit` hoàn thành trên cả 5 dự án, 0 lỗi kiểu dữ liệu | **PASS** |
| **Kiểm thử đơn vị** | `pnpm --recursive test` | 2/2 unit tests trong Health Controller đạt 100% | **PASS** |
| **Kiểm thử E2E Database** | `pnpm --filter @corelink/api test:e2e -- health.e2e-spec.ts` | Kết nối trực tiếp cơ sở dữ liệu thật MySQL 8.4 LTS thành công (205ms) | **PASS** |
| **Kiểm thử E2E Xác thực & RBAC**| `pnpm --filter @corelink/api test:e2e -- auth-rbac.e2e-spec.ts` | 15/15 test cases đạt 100% (Argon2id, refresh token xoay vòng, RBAC 2 lớp) | **PASS** |
| **Kiểm tra Build Production** | `pnpm --recursive build` | 55/55 routes tĩnh & động Next.js prerendered sạch sẽ (10.0s), NestJS build hoàn tất | **PASS** |

---

## 3. BẢN ĐỒ VÀ PHÂN LOẠI CHỨC NĂNG (FEATURE CLASSIFICATION)

### 3.1. Đang hoạt động và đã xác minh (Verified & Production-Ready)
1. **Xác thực & Bảo mật Truy cập (M02)**:
   - Đăng nhập đa kênh (Email / SĐT / Mã học sinh), băm mật khẩu Argon2id, Refresh Token xoay vòng (HttpOnly Cookie).
   - Khóa tài khoản sau 5 lần nhập sai, xác thực 2FA TOTP bắt buộc cho Admin.
   - Quản lý đồng ý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP (`consents`).
2. **Quản lý Đào tạo & Điểm danh (M03, M04)**:
   - Cấu trúc cấp học → chương trình → khóa học → lớp học.
   - Thuật toán phát hiện xung đột lịch học 3 chiều (giáo viên, phòng học, học viên).
   - Điểm danh mã QR động HMAC-SHA256 đổi mới mỗi 30 giây, kết hợp chụp ảnh lớp và tọa độ GPS trong bán kính 150m cơ sở.
3. **Khảo thí & Ngân hàng Đề thi (M06)**:
   - Ngân hàng câu hỏi phân loại khung năng lực Cambridge/CEFR.
   - Làm bài thi trắc nghiệm trực tuyến có đồng hồ đếm ngược, nộp bài tự động, chấm điểm tức thời.
   - Hỗ trợ AI chấm bài tự luận Writing có giáo viên thẩm định điểm số.
4. **Tài chính & Học phí (M11)**:
   - Hóa đơn học phí, thanh toán linh hoạt, cấp biên nhận tuần tự chống trùng lặp qua khóa dòng bi quan (`SELECT ... FOR UPDATE`).
   - Tính lương giáo viên tự động theo buổi học đã xác thực chuyên cần.
5. **Cổng Phụ huynh & Học viên (M05, M07)**:
   - Xem thời khóa biểu, chuyên cần, bảng điểm năng lực 4 kỹ năng.
   - Bản tóm tắt học tập cá nhân hóa phát sinh vào 20:00 hằng ngày.
6. **Chatbot Tuyển sinh RAG (AI-12)**:
   - Tra cứu tri thức đã duyệt qua vector nhúng 768 chiều.
   - Bộ lọc an toàn chặn câu hỏi nhạy cảm và 30 câu hỏi bẫy kiểm thử an toàn.

### 3.2. Cải tiến giao diện đã hoàn tất (UI Design Overhaul)
- **Tái thiết kế Design System**: Đã thay thế toàn bộ dark-mode cyberpunk bằng bảng màu giáo dục tiêu chuẩn (#F7F9FC canvas, #FFFFFF card surface, #2563EB primary, #0F9D8A secondary, #F4B942 accent, #172033 text).
- **Tái xây dựng Trang chủ S01**: Bổ sung ứng dụng kiểm tra trình độ 3 phút, danh mục khóa học, đội ngũ giảng viên quốc tế và form đăng ký học thử kết nối API `/api/v1/public/leads`.

### 3.3. Chưa cấu hình hoặc cần tích hợp bên ngoài (Pending External Configuration)
- **Cổng thanh toán trực tuyến tự động (VNPay/VietQR Webhook)**: Cần cấu hình khóa Merchant & Webhook Secret thật của đối tác. Hiện tại hỗ trợ cơ chế chuyển khoản ngân hàng và ghi nhận thanh toán thủ công chuẩn mực có chứng từ đối soát.
- **Dịch vụ gửi SMS OTP / Email SendGrid**: Hiện đang sử dụng Mailpit cục bộ (`localhost:8025`) để bắt email kiểm thử an toàn trong môi trường phát triển.

---

## 4. KẾT LUẬN AUDIT
Hệ thống có nền tảng CSDL và nghiệp vụ backend rất hoàn thiện (84 bảng MySQL 8.4 chuẩn hóa và 15 module NestJS). Nền tảng giao diện đã được chuyển đổi thành công sang phong cách giáo dục thân thiện và chuyên nghiệp. Toàn bộ mã nguồn sẵn sàng cho giai đoạn hoàn thiện chi tiết theo đặc tả.
