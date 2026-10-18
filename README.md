# CoreLink Academy — Hệ Thống Quản Lý Đào Tạo Tiếng Anh Chuẩn Quốc Tế Tích Hợp AI

> **Nền tảng Quản trị & Đào tạo Tiếng Anh Toàn Diện** dành cho các trung tâm ngoại ngữ từ tiền tiểu học đến luyện thi chứng chỉ quốc tế (Cambridge YLE, IELTS, Giao tiếp), tích hợp công nghệ AI trợ lý luyện nói, chấm bài tự luận và bảng tóm tắt học tập lúc 20:00 hằng ngày cho phụ huynh.

---

## 🌟 1. Tổng Quan Kiến Trúc & Công Nghệ (v2.0)

Hệ thống được phát triển theo kiến trúc **Modular Monolith** trên nền tảng **Monorepo (pnpm workspace)**, tuân thủ nguyên tắc **Database-First** (MySQL 8.4 LTS với 84 bảng chuẩn hóa 3NF, 11 trigger, 4 view nghiệp vụ):

- **Monorepo Workspace**:
  - `apps/api`: NestJS 11 REST API (`/api/v1`), Swagger OpenAPI (`/api/docs`), Passport JWT + Two-Layer RBAC, Argon2id, Zod + class-validator.
  - `apps/web`: Next.js 15 (App Router), React 19, Tailwind CSS 4, Design Tokens giáo dục chuẩn mực (#F7F9FC canvas, #FFFFFF card, #2563EB primary), 55 routes giao diện hoàn chỉnh.
  - `apps/worker`: NestJS Background Worker xử lý hàng đợi BullMQ, thông báo đẩy WebPush, job tổng hợp báo cáo 20:00 hằng ngày.
  - `packages/shared`: Schema DTO dùng chung, Enums, Types, Role-Permission constants.
  - `packages/ai`: AI Gateway đa mô hình (Claude 3.5 Sonnet, Gemini 1.5 Flash), bộ lọc ẩn danh thông tin học sinh (`Anonymizer`) và hạn mức chi tiêu AI an toàn ($150/tháng).

---

## 📚 2. Hồ Sơ Kỹ Thuật & Đặc Tả Chuẩn Mực (`docs/spec/`)

Hệ thống được thiết kế và đặc tả chi tiết qua 17 tài liệu kỹ thuật trong thư mục `docs/spec/`:

1. [audit.md](docs/spec/audit.md) — Báo cáo kiểm toán toàn bộ repository và kết quả kiểm thử baseline.
2. [assumptions-and-decisions.md](docs/spec/assumptions-and-decisions.md) — Các quyết định kiến trúc (ADR) và 8 điểm cấu hình chờ trung tâm xác nhận.
3. [product-requirements.md](docs/spec/product-requirements.md) — Đặc tả yêu cầu sản phẩm, User Stories (Given/When/Then) và Non-goals.
4. [feature-matrix.md](docs/spec/feature-matrix.md) — Ma trận 15 module nghiệp vụ, phân quyền 8 vai trò và trạng thái thực thi.
5. [business-rules.md](docs/spec/business-rules.md) — Quy tắc nghiệp vụ chống trùng lặp, xung đột lịch 3 chiều và bảo vệ trẻ em.
6. [state-machines.md](docs/spec/state-machines.md) — Vòng đời và quy tắc chuyển đổi trạng thái của Lead, Lớp học, Buổi học, Hóa đơn.
7. [roles-permissions.md](docs/spec/roles-permissions.md) — Ma trận RBAC 2 lớp và kiểm soát phạm vi dữ liệu chống IDOR.
8. [data-model-and-erd.md](docs/spec/data-model-and-erd.md) — Mô hình CSDL 84 bảng, sơ đồ Mermaid ERD và 11 triggers toàn vẹn.
9. [api-contract.md](docs/spec/api-contract.md) — Hợp đồng REST API v1 RFC 7807 và WebSocket Gateway.
10. [reporting-metrics.md](docs/spec/reporting-metrics.md) — Định nghĩa công thức tính KPI tuyển sinh, chuyên cần, công nợ và chi phí AI.
11. [security-plan.md](docs/spec/security-and-privacy.md) — Kế hoạch bảo mật OWASP Top 10 và Nghị định 13/2023/NĐ-CP.
12. [integrations-and-webhooks.md](docs/spec/integrations-and-webhooks.md) — Kiến trúc Adapter tích hợp cổng thanh toán VietQR và Webhook an toàn.
13. [design-system.md](docs/spec/design-system.md) — Hệ thống thiết kế nhận diện thương hiệu giáo dục, typography và WCAG 2.2 AA.
14. [test-plan.md](docs/spec/test-plan.md) — Chiến lược kiểm thử đa tầng và ma trận xử lý tình huống biên.
15. [acceptance-criteria.md](docs/spec/acceptance-criteria.md) — Tiêu chí nghiệm thu chức năng và phi chức năng có thể kiểm chứng.
16. [implementation-roadmap.md](docs/spec/implementation-roadmap.md) — Lộ trình thực thi 10 giai đoạn từ nền tảng đến vận hành.
17. [deployment-and-operations.md](docs/spec/deployment-and-operations.md) — Hướng dẫn cài đặt, sao lưu, khôi phục CSDL và triển khai production.

---

## 🛠️ 3. Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### Yêu Cầu Môi Trường
- **Node.js**: v22.x hoặc v24.x LTS (Khuyên dùng v24)
- **pnpm**: v9.x (`npm install -g pnpm`)
- **MySQL**: 8.4 LTS đang chạy tại `localhost:3306`

### Bước 1: Cài đặt Dependencies
```powershell
pnpm install
```

### Bước 2: Cấu hình Biến Môi trường
Sao chép tệp mẫu và cập nhật thông tin CSDL trong `.env`:
```powershell
Copy-Item .env.example .env
```

### Bước 3: Tạo Prisma Client & Seed dữ liệu
```powershell
pnpm db:generate
pnpm seed:admin
pnpm seed:demo
```

### Bước 4: Khởi chạy Ứng dụng

**Terminal 1 — Backend API (Port 4000)**:
```powershell
pnpm --filter @corelink/api dev
```
- Swagger API Docs: `http://localhost:4000/api/docs`
- Health check: `http://localhost:4000/api/v1/health`

**Terminal 2 — Frontend Web (Port 3000)**:
```powershell
pnpm --filter @corelink/web dev
```
- Giao diện người dùng: `http://localhost:3000`

---

## 🧪 4. Bộ Lệnh Kiểm Thử Tự Động (Verification Commands)

```powershell
# 1. Kiểm tra tĩnh kiểu dữ liệu TypeScript (0 lỗi)
pnpm --recursive typecheck

# 2. Chạy bài kiểm thử đơn vị
pnpm --recursive test

# 3. Chạy bài kiểm thử tích hợp E2E kết nối MySQL thật
pnpm --filter @corelink/api test:e2e -- health.e2e-spec.ts
pnpm --filter @corelink/api test:e2e -- auth-rbac.e2e-spec.ts

# 4. Kiểm tra khả năng build production (55/55 routes prerendered sạch sẽ)
pnpm --recursive build
```

---

## 🔒 5. Quy Tắc Quản Trị Git & Đẩy Code (Git Remote Policy)
Hệ thống tuân thủ nghiêm ngặt quy tắc người dùng:
> **Tuyệt đối KHÔNG tự động thực thi lệnh `git push`. Toàn bộ việc push code lên remote do người dùng tự thực hiện sau mỗi phiên làm việc.**

Khi bạn muốn cập nhật code lên GitHub / Remote:
```powershell
git push origin main
```
