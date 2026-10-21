# ADR-005: Chuyển CSDL từ MySQL 8 (local) sang PostgreSQL trên Supabase

- **Status:** Accepted · **Date:** 2026-10-21 · **Decision owner:** chủ dự án (DECISION-D20) · **Supersedes:** phần "MySQL 8" của ADR-001
- **Related:** FR toàn bộ (tầng dữ liệu), docs/10, docs/14

## Context and problem
Bản deploy Vercel (`core-link-academy.vercel.app`) trả HTTP 500 ở mọi trang đọc DB vì `DATABASE_URL` trỏ `localhost:3306` — server Vercel không truy cập được MySQL trên máy dev. Chủ dự án đã có project Supabase (`uqyslddttlxnkdxginej`, region `ap-southeast-1`).

## Options considered
| Option | Ưu | Nhược |
|---|---|---|
| A. Giữ MySQL, thuê MySQL cloud (TiDB, Aiven) | Không đổi code | Thêm nhà cung cấp mới |
| **B. PostgreSQL trên Supabase** | Chủ dự án đã có; gói free; dashboard dữ liệu | Phải đổi provider Prisma, SQL thô, migration |

## Decision
Chọn **B**. Thay đổi:
- `schema.prisma`: `provider = "postgresql"`, `directUrl = env("DIRECT_URL")`; `@db.TinyInt` → `@db.SmallInt`.
- `DATABASE_URL` = Transaction pooler cổng 6543 với `?pgbouncer=true&connection_limit=1` (serverless); `DIRECT_URL` = Session pooler cổng 5432 (migrate/seed).
- SQL thô (`FOR UPDATE`) đổi sang trích dẫn kiểu PostgreSQL (`"key"`, `"classes"`).
- Tìm kiếm `contains` thêm `mode: "insensitive"` (MySQL `utf8mb4_unicode_ci` vốn không phân biệt hoa thường, PostgreSQL thì có).
- Migration mới `prisma/migrations/20261021100000_init` (sinh offline). Migration MySQL cũ lưu ở `prisma/migrations-mysql-archive/` (không còn dùng).

## Consequences
- (+) Vercel và máy dev dùng chung một DB cloud; không cần MySQL local.
- (−) Dev cần mạng để chạy; dữ liệu dev và production đang là **cùng một DB** (chưa tách môi trường — RISK-013).
- (−) `TEST_DATABASE_URL` phải là một DB PostgreSQL khác (có chặn trỏ trùng `DATABASE_URL`/`DIRECT_URL`).

## Rollback
Đổi lại provider `mysql`, khôi phục migration từ `migrations-mysql-archive/`, dùng `.env.mysql.bak` (máy dev).
