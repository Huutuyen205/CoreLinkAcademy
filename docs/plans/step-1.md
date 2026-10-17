# KẾ HOẠCH BƯỚC 1: KHUNG DỰ ÁN & MÔI TRƯỜNG

## 1. [VAI: BA] User Story & Tiêu chí chấp nhận
- **User Story**: Là Kỹ sư phần mềm, tôi muốn có cấu trúc Monorepo pnpm hoàn chỉnh gồm `apps/api`, `apps/web`, `apps/worker`, `packages/shared`, `packages/ai`, kèm Prisma kết nối CSDL MySQL 84 bảng để các bước tiếp theo triển khai nghiệp vụ an toàn và đồng nhất.
- **Tiêu chí chấp nhận (Given/When/Then)**:
  - *Given* CSDL MySQL `corelink` chứa 84 bảng chuẩn
  - *When* chạy `prisma db pull` và `prisma generate`
  - *Then* `schema.prisma` được tạo tự động và `PrismaClient` sinh đủ models
  - *When* gửi yêu cầu `GET /api/v1/health`
  - *Then* API trả về mã 200, JSON thể hiện trạng thái MySQL khỏe mạnh
  - *When* kiểm tra mã nguồn
  - *Then* cấu trúc monorepo phân tách rõ `apps/web`, `apps/api`, `packages/shared`, `packages/ai`, script chạy được trên Windows/PowerShell.

## 2. [VAI: TECH LEAD] Thiết kế kiến trúc & Chia việc
- **Cấu trúc Monorepo**:
  - `pnpm-workspace.yaml`: packages: `apps/*`, `packages/*`
  - `package.json` gốc: scripts `build`, `lint`, `typecheck`, `test`, `dev`, `db:pull`, `db:generate`
- **packages/shared**:
  - Kiểu dữ liệu TypeScript dùng chung giữa Frontend và Backend
  - Enum vai trò (`RoleCode`: admin, academic, consultant, accountant, teacher, guardian, student)
  - Chuẩn hóa số điện thoại Việt Nam (`+84...`)
  - Schema RFC 7807 Problem Details
- **apps/api**:
  - NestJS 11 cấu trúc module: `HealthModule`, `PrismaModule`
  - `PrismaService` khởi tạo với `SET time_zone = '+00:00'`
  - Swagger gắn tại `/api/docs`
  - Prefix toàn cục: `/api/v1`
  - Bộ kiểm thử Supertest cho `GET /api/v1/health`
- **apps/web**:
  - Next.js 15 App Router
  - i18n chuỗi tiếng Việt tại `messages/vi.json`
  - Cấu hình PWA manifest (`manifest.json`)
  - Giao diện mobile-first từ 360px
- **packages/ai**:
  - Interface `AiGateway` và cấu trúc provider stub
- **Phân chia việc**:
  - [DEV BACKEND]: Khởi tạo `apps/api`, Prisma schema, PrismaService, HealthController.
  - [DEV FRONTEND]: Khởi tạo `apps/web`, Layout, PWA manifest, vi.json, trang chủ chào đón.
  - [DEVOPS]: `pnpm-workspace.yaml`, `.github/workflows/ci.yml`, script Windows PowerShell.
  - [TESTER]: Chạy typecheck, lint, unit test, API test `/health`.
  - [REVIEWER BẢO MẬT]: Rà soát biến môi trường, kết nối UTC, không lộ credential.
