# BÁO CÁO AUDIT TOÀN BỘ REPOSITORY (GIAI ĐOẠN 1)

**Dự án**: Hệ thống Quản lý và Giới thiệu Trung tâm Tiếng Anh CoreLink Academy  
**Phiên bản kiểm toán**: 1.0 — Rebuild Audit  
**Ngày thực hiện**: 18/10/2026  
**Đơn vị thực hiện**: Ban Kiến trúc & Đội ngũ Kỹ thuật Cấp cao (Principal Architect, Lead QA, Security Engineer)

---

## 1. TỔNG QUAN HỆ THỐNG VÀ CẤU TRÚC HIỆN TẠI

### 1.1. Hệ sinh thái mã nguồn (Monorepo pnpm)
Dự án được cấu trúc dạng Monorepo với `pnpm workspace` (v9.15.9), tương thích Node.js LTS (v22/v24), TypeScript 5.7 (Strict Mode):

```
CoreLinkAcademy/
├── apps/
│   ├── api/         # Backend: NestJS 11, REST API /api/v1, Swagger OpenAPI, Prisma ORM, Passport JWT, Argon2
│   ├── web/         # Frontend: Next.js 15 (App Router), React 19, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, 55 routes
│   └── worker/      # Tác vụ nền: NestJS standalone + BullMQ (xử lý AI, thông báo, báo cáo, media)
├── packages/
│   ├── shared/      # Schema DTO dùng chung, Enum, Type, Role-Permission constants
│   └── ai/          # AiGateway, Anonymizer (ẩn danh PII), Budget Guard ($150/tháng), Prompt templates
├── db/
│   ├── 000_schema.sql # CSDL chuẩn 84 bảng MySQL 8.4 LTS, 11 trigger, 4 view
│   └── migrations/  # Các script migration mở rộng
├── prisma/
│   └── schema.prisma# Prisma Schema ánh xạ trực tiếp 84 bảng từ Database MySQL
├── docs/            # Hồ sơ kỹ thuật gốc, đặc tả 15 module, walkthroughs
└── docker-compose.yml# MySQL 8.4, Redis 7, MinIO S3, Mailpit
```

### 1.2. Trạng thái hoạt động thực tế của môi trường
- **Node.js**: v24.18.0 (Tương thích LTS).
- **Trình quản lý gói**: pnpm 9.15.9 (Lockfile đồng bộ hoàn toàn).
- **Database**: MySQL 8.4 trên `localhost:3306`, database `corelink` kết nối qua Prisma Client. Kiểm thử `GET /api/v1/health` trả HTTP 200 `status: ok` (`test/health.e2e-spec.ts` PASS).
- **Backend API**: Port 4000 sẵn sàng, Swagger API Docs tại `/api/docs`.
- **Frontend Web**: Port 3000 sẵn sàng, Next.js 15 App Router hỗ trợ SSR và Static Generation (55/55 routes prerendered sạch sẽ).

---

## 2. PHÂN LOẠI CHỨC NĂNG: ĐÃ CÓ, CÒN THIẾU, BỊ LỖI VÀ KHÔNG PHÙ HỢP

### 2.1. Chức năng đã triển khai hoàn thiện và đã kiểm thử (Verified & Production-Ready)
1. **Xác thực & Phân quyền (Auth & RBAC - M02)**:
   - Đăng nhập qua email/SĐT/mã học sinh, mã hóa Argon2id, refresh token xoay vòng, khóa sau 5 lần sai mật khẩu, mật khẩu tạm 72h.
   - Phân quyền 2 lớp (Layer 1: `@Roles()` RBAC; Layer 2: Scope policy theo `branch_id`, `class_teachers`, `guardianships`).
   - Quản lý đồng ý dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP.
   - Toàn bộ 15 test case e2e (`auth-rbac.e2e-spec.ts`) đạt 100% PASS.
2. **Quản lý Đào tạo & Điểm danh (Academic & Attendance - M03, M04)**:
   - Quản lý cây cấp học, chương trình, lớp học, phòng học, lịch học lặp lại, chống trùng lịch giáo viên và phòng học.
   - Điểm danh mã QR động HMAC-SHA256 (30 giây xoay một lần), định vị GPS (bán kính 150m cơ sở) và chụp ảnh xác thực.
3. **Ngân hàng Câu hỏi & Kiểm tra Đánh giá (Assessment - M06)**:
   - Ngân hàng câu hỏi phân loại CEFR/YLE/IELTS, sinh đề ngẫu nhiên, làm bài thi online với bộ đếm ngược, chống nộp đúp.
4. **Học phí & Tài chính (Finance - M11)**:
   - Gói học phí, hóa đơn phải thu, thanh toán nhiều đợt, biên nhận chống trùng lặp, tính lương giáo viên theo buổi xác thực.
5. **Cổng Phụ huynh & Học viên (Parent & Student Portal - M05, M07)**:
   - Cổng phụ huynh chuyển đổi giữa các con, xem lịch học, chuyên cần, tiến độ năng lực, báo cáo ngày (20h) và báo cáo tháng.
6. **Khung AI Gateway & Chatbot Tư vấn (AI Infrastructure - AI-01 đến AI-14)**:
   - `AiGateway` là cổng duy nhất điều hướng qua Claude 3.5 Sonnet / Gemini 1.5 Flash.
   - `Anonymizer` ẩn danh PII học sinh trước khi gửi prompt.
   - `AiBudgetGuard` chặn vượt hạn mức ngân sách.
   - Nguyên tắc "AI soạn, người duyệt" được bảo vệ chặt chẽ.

### 2.2. Điểm không phù hợp và tồn đọng cần tái thiết kế (Areas Needing Redesign)
1. **Định hướng Thẩm mỹ & Giao diện (Critical UI/UX Gap)**:
   - *Vấn đề*: Hệ thống giao diện vừa cập nhật lạm dụng phong cách cyberpunk / dark-mode nền tối `#060911`, hiệu ứng neon glow, glassmorphism tím/xanh điện. Kiểu thiết kế này gây cảm giác giống công cụ AI hoặc ứng dụng crypto, **hoàn toàn không phù hợp** với định vị của một trung tâm tiếng Anh uy tín, thân thiện, sáng sủa, giáo dục.
   - *Giải pháp tái thiết kế*: Chuyển đổi toàn diện sang **Educational Brand Identity**:
     - Nền sáng trang nhã `#F7F9FC`, thẻ nội dung `#FFFFFF` viền `#E2E8F0`.
     - Màu thương hiệu chính: Xanh dương giáo dục `#2563EB`, Xanh ngọc phát triển `#0F9D8A`, Vàng ấm điểm nhấn `#F4B942`.
     - Phông chữ tiêu chuẩn: Plus Jakarta Sans / Outfit, độ tương phản đạt WCAG 2.2 AA.
2. **Trang Chủ Công Khai (Landing Page S01) Thiếu Chiều Sâu Giáo Dục**:
   - Hiện tại trang chủ còn mang tính liệt kê tính năng phần mềm thay vì tập trung vào giá trị đào tạo: lộ trình Cambrigde/IELTS, phương pháp tương tác, đội ngũ giáo viên bản ngữ & Việt Nam có chứng chỉ quốc tế, bảng học phí minh bạch và câu chuyện thành công của học viên.
3. **Khu vực Trải nghiệm Học sinh (Interactive Learning Modules)**:
   - Cần bổ sung các tính năng luyện tập trực quan: **AI Speaking Coach** với giao diện thu âm trực quan Web Audio, **Flashcard Từ vựng Spaced Repetition** có âm thanh và hình ảnh minh họa bài giảng.

---

## 3. DỮ LIỆU VÀ TÍCH HỢP CẦN BẢO TỒN (PRESERVATION LIST)

1. **Database Schema (db/000_schema.sql)**:
   - Tuyệt đối giữ nguyên 84 bảng cơ sở dữ liệu đã chuẩn hóa 3NF trong MySQL 8.4. Không can thiệp sửa trực tiếp file gốc. Mọi mở rộng chỉ thực hiện qua script migration có đánh số thứ tự trong `db/migrations/`.
2. **Tài khoản Demo và Quyền Quản trị**:
   - Giữ nguyên các script `seed:admin` và `seed:demo` để hỗ trợ môi trường phát triển cục bộ và kiểm thử e2e.
3. **Mã hóa An toàn & Secrets**:
   - Khóa bí mật JWT, HMAC Secret cho QR Code, Argon2 salt parameters trong `.env`.
   - Không đưa bất kỳ secret thực tế nào vào repository.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ TRẠNG THÁI BUILD MÃ NGUỒN

| Lệnh thực thi | Phạm vi kiểm tra | Kết quả thực tế | Trạng thái |
|---|---|---|:---:|
| `pnpm typecheck` | 5 packages/apps trong workspace | `tsc --noEmit` thành công không lỗi cú pháp | **PASS** |
| `pnpm test` | Unit test suite | 2/2 tests PASS trong Health Controller | **PASS** |
| `pnpm build` | Production bundle build | 55/55 routes tĩnh & động Next.js 15 prerendered thành công; NestJS build hoàn tất | **PASS** |
| `pnpm test:e2e` (Health) | Database connectivity e2e | 1/1 test PASS (kết nối trực tiếp MySQL 8.4) | **PASS** |
| `pnpm test:e2e` (Auth/RBAC) | Xác thực, RBAC 2 lớp, Nghị định 13 | 15/15 test cases PASS | **PASS** |

---

## 5. KẾT LUẬN VÀ LỘ TRÌNH CHUYỂN GIAI ĐOẠN

Repository hiện tại có nền tảng Backend, Database và nghiệp vụ rất vững chắc (đầy đủ 15 module lõi và 84 bảng chuẩn hóa).  
Khoảng cách lớn nhất hiện tại nằm ở **Thiết kế giao diện người dùng (UI/UX)** và **Trải nghiệm thương hiệu giáo dục** theo yêu cầu mới của Master Prompt.

**Quyết định**: Hoàn tất Giai đoạn 1 (Audit), chuyển ngay sang Giai đoạn 2 (Thiết lập Bộ tài liệu Kiến trúc & Kế hoạch) và Giai đoạn 3 (Thiết lập Nền tảng Design Tokens & Tái cấu trúc Giao diện Giáo dục Hiện đại).
