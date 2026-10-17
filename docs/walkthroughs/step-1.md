# BÁO CÁO WALKTHROUGH BƯỚC 1: KHUNG DỰ ÁN & MÔI TRƯỜNG

## 1. [VAI: TECH LEAD] Phạm vi bước
- Mã yêu cầu / Test case: TC-154, NFR Vận hành hệ thống.
- Các module triển khai: Khung Monorepo pnpm, `apps/api` (NestJS 11 + Prisma ORM), `apps/web` (Next.js 15 PWA), `apps/worker` (NestJS standalone + BullMQ), `packages/shared`, `packages/ai`.

## 2. Thiết kế tóm tắt
- **Endpoint**:
  - `GET /api/v1/health`: Kiểm tra trạng thái MySQL, Redis, Storage. Mã lỗi RFC 7807, trả 200 khi DB kết nối thành công, 503 khi gặp sự cố.
  - Swagger UI: `http://localhost:4000/api/docs`.
- **Database & Prisma**:
  - Đồng bộ trực tiếp 84 bảng từ CSDL MySQL 8.4 `corelink` qua `prisma db pull`.
  - Sinh `PrismaClient` tự động với `SET time_zone = '+00:00'`.
- **Frontend & PWA**:
  - Next.js 15 App Router, i18n chuẩn hóa tiếng Việt tại `messages/vi.json`.
  - `manifest.json` cấu hình PWA chạy mobile-first từ 360px.
- **Packages dùng chung**:
  - `@corelink/shared`: Kiểu dữ liệu, Enums nghiệp vụ, hàm chuẩn hóa SĐT `+84...`.
  - `@corelink/ai`: Cấu trúc AiGateway, chuẩn bị 14 tính năng AI và module Anonymizer bảo vệ dữ liệu trẻ em.

## 3. Cây thư mục hoàn thành
```
corelink/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── health/ (controller, module, spec)
│   │   │   │   └── prisma/ (service, module)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/ (health.e2e-spec.ts, jest-e2e.json)
│   │   └── package.json, tsconfig.json, nest-cli.json, jest.config.js
│   ├── web/
│   │   ├── public/manifest.json
│   │   ├── messages/vi.json
│   │   ├── src/app/ (layout.tsx, page.tsx, globals.css, not-found.tsx, error.tsx)
│   │   └── package.json, tsconfig.json
│   └── worker/
│       ├── src/main.ts
│       └── package.json, tsconfig.json
├── packages/
│   ├── shared/ (src/enums.ts, src/utils.ts, src/dto.ts, src/index.ts)
│   └── ai/ (src/types.ts, src/anonymizer.ts, src/index.ts)
├── prisma/
│   └── schema.prisma (84 models đồng bộ từ MySQL)
├── db/
│   ├── 000_schema.sql (84 bảng)
│   └── 001_app_user.sql
├── .github/workflows/ci.yml
├── .env, .env.example, .gitignore, AGENTS.md, pnpm-workspace.yaml, package.json
└── docs/ (CORELINK_MASTER.md, TEAM_PROMPT.md, PROGRESS.md, DECISIONS.md, BLOCKERS.md, OUT_OF_SCOPE.md)
```

## 4. [VAI: TESTER / QA] Bảng Test Case
| Mã TC | Module | Tên kiểm thử | Kết quả | Ghi chú |
|---|---|---|---|---|
| TC-154 | NFR Vận hành | Unit test HealthController trả 200 và báo database up | **ĐẠT** | Jest unit test trong `health.controller.spec.ts` |
| TC-154 | NFR Vận hành | Unit test HealthController trả 503 khi database down | **ĐẠT** | Mock database failure |
| TC-154 | NFR Vận hành | E2E API test `GET /api/v1/health` kết nối MySQL thực tế | **ĐẠT** | Kết nối CSDL `corelink` localhost:3306 (95ms) |

## 5. [VAI: REVIEWER BẢO MẬT] Rà soát an toàn
- Không commit file `.env` lên git (đã có trong `.gitignore`).
- Không để lộ secret trong code.
- Header HTTP được bảo vệ bởi `helmet`.
- Phân tách cấu hình biến môi trường qua `ConfigModule`.

## 6. Kết luận & Chuyển giao
- Toàn bộ lệnh `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` đều XANH.
- Chuyển ngay sang **BƯỚC 2: Xác thực, tài khoản, phân quyền (M02)**.
