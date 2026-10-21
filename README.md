# CoreLink Academy v3

Website công khai + hệ thống quản lý cho học viện đào tạo đa môn phổ thông (Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Tin học). Nhánh `rebuild/v3`.

- Phạm vi: 35 yêu cầu chức năng Pha 1 — [docs/01-requirements.md](docs/01-requirements.md)
- Tổng quan dự án: [docs/00-project-brief.md](docs/00-project-brief.md) · Tài liệu theo từng phía: [docs/19-team-roles-and-document-register.md](docs/19-team-roles-and-document-register.md)
- Quy tắc làm việc cho trợ lý AI: [AGENTS.md](AGENTS.md)

## Công nghệ
Next.js 15 (App Router, Server Actions) · React 19 · TypeScript strict · Tailwind CSS 4 · Prisma 6 · MySQL 8 · Vitest. Lý do: [ADR-001](docs/09-architecture/adr/ADR-001-stack-selection.md).

## Cài đặt từ máy mới (Windows + PowerShell)

Yêu cầu: Node ≥ 22, pnpm 9 (`corepack enable`), MySQL 8 đang chạy.

```powershell
pnpm install
Copy-Item .env.example .env      # rồi điền DATABASE_URL (không commit .env)
pnpm db:check                    # kiểm tra trạng thái migration (không phá hủy)
pnpm db:reset                    # LẦN ĐẦU trên dev: xóa toàn bộ bảng, tạo bảng v3, nạp dữ liệu demo giả
pnpm dev                         # http://localhost:3000
```

`pnpm db:reset` **xóa dữ liệu** — chỉ chạy trên máy dev, sau khi backup (xem [docs/14 §3.1](docs/14-deployment-and-operations.md)). Mật khẩu tài khoản demo là `SEED_DEMO_PASSWORD` trong `.env` hoặc được in ra một lần khi seed. Danh sách tài khoản: [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

## Lệnh

| Lệnh | Tác dụng |
|---|---|
| `pnpm dev` / `pnpm dev:raw` | Chạy dev (có / không kiểm tra DB trước) |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Cổng chất lượng (phải xanh trước khi đóng pha) |
| `pnpm test:integration` | Integration test trên DB riêng `TEST_DATABASE_URL` (tự bỏ qua nếu không đặt) |
| `pnpm db:migrate` | Áp migration (`prisma migrate deploy`) |
| `pnpm db:migrate:new -- --name <tên>` | Tạo migration mới để review |
| `pnpm db:seed` · `pnpm db:studio` | Seed demo · Prisma Studio |

## Cấu trúc
```text
prisma/        schema, migrations, seed
src/app/       routing + giao diện (công khai, quan-ly, giao-vien, hoc-sinh, phu-huynh)
src/components/ component dùng chung và theo nghiệp vụ
src/server/    nghiệp vụ, phân quyền, Server Actions
src/lib/       hàm thuần (giờ VN, lịch, chấm điểm, SĐT)
docs/          tài liệu 00–21, use case, cổng người dùng, tiến độ
```
Hướng dẫn chi tiết: [Frontend](docs/20-frontend-guide.md) · [Backend](docs/21-backend-guide.md).
