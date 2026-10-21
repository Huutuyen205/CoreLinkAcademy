# ADR-001 — Chọn stack cho Rebuild v3

- **Ngày:** 2026-10-21 · **Trạng thái:** Accepted · **Người quyết định:** chủ dự án

## Bối cảnh
Bản v1/v2 dùng monorepo Next.js + NestJS + worker BullMQ + Redis + MinIO + MySQL (84 bảng). Với một developer, số thành phần quá lớn so với phạm vi MVP mới (không có job nền, upload hay realtime).

## Phương án
1. **Next.js 15 fullstack + Prisma 6 + MySQL 8** — một app; Server Components để đọc, Server Actions để ghi.
2. Monorepo Next.js + NestJS + MySQL — tách API rõ ràng, nhưng gấp đôi khối lượng việc (DTO, client, deploy hai service).
3. Next.js + PostgreSQL — tương tự (1) nhưng cần cài thêm database.

## Quyết định
Chọn **(1)**. MySQL 8 đã có sẵn trên máy (`localhost:3306`, database `corelink`).

## Hệ quả
- Ít thành phần: không Redis/MinIO/Docker ở Pha 1. Rate limit và phiên lưu trong MySQL.
- Logic nghiệp vụ đặt ở `src/server/**` (không phụ thuộc React) để unit test được và có thể tách thành API riêng sau này.
- Prisma Migrate quản lý schema (`prisma/migrations`), thay cho cách database-first của bản cũ.
- Khi cần app di động hoặc tích hợp bên ngoài (Pha 2+) sẽ thêm Route Handlers `/api/v1/*` dùng chung `src/server/**`.
- Rủi ro: Server Actions là endpoint POST công khai → mọi action phải tự kiểm tra phiên + quyền (xem 12-security).

## Phiên bản
Node 22+ (máy đang có 24), pnpm 9, Next.js 15, React 19, TypeScript 5 strict, Tailwind CSS 4, Prisma 6, Zod 3, `@node-rs/argon2`, `date-fns` + `date-fns-tz`, Vitest.
