# 14 — Triển khai và vận hành (Runbook)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — lệnh mới trong `package.json` (`db:check`, `db:reset`, `db:migrate` = deploy, `db:migrate:new`, `dev` có kiểm tra DB, `test:integration`), runbook theo template |
| Owner | Trợ lý (DevOps/Release) · Người có quyền chạy lệnh phá hủy/deploy: **chủ dự án** |

## 1. Environment inventory

| Môi trường | URL | DB | Trạng thái | Owner |
|---|---|---|---|---|
| Dev | `http://localhost:3000` | MySQL 8 local `localhost:3306/corelink` | Đang dùng; **DB còn schema v2, migration `init` chưa áp** | Chủ dự án |
| Test (integration) | — | `TEST_DATABASE_URL` (đề xuất `corelink_test`) | Chưa có quyền tạo DB (QUESTION-Q08) | Chủ dự án |
| Staging / Production | TBD | TBD | Chưa chọn hosting (QUESTION-Q04) | Chủ dự án |

Yêu cầu máy: Node ≥ 22 (máy dev có 24), pnpm 9.15.9 (`packageManager`), MySQL 8, Windows + PowerShell.

## 2. Configuration (chỉ tên biến — không bao giờ ghi giá trị thật)

| Biến | Mục đích | Bắt buộc | Môi trường | Nguồn / xoay vòng | Kiểm tra |
|---|---|---|---|---|---|
| `DATABASE_URL` | Kết nối MySQL (`mysql://USER:PASSWORD@HOST:3306/corelink`) | Có | Mọi | `.env` (dev), secret manager (prod); đổi mật khẩu DB → cập nhật | `pnpm db:check` |
| `APP_URL` | URL gốc cho metadata | Có | Mọi | `.env` | Xem `<link rel=canonical>`/OG khi có |
| `SEED_DEMO_PASSWORD` | Mật khẩu chung tài khoản demo khi seed | Không | Dev | `.env`; trống → seed tự sinh và in một lần | Seed từ chối nếu yếu (BR-006) |
| `TEST_DATABASE_URL` | DB riêng cho integration test | Chỉ khi chạy `test:integration` | Dev/CI | `.env` | Test tự skip khi thiếu |
| `NODE_ENV` | `production` bật cookie `Secure` | — | Prod | Do `next start` | — |
| `SLOW_QUERY_MS` | Ngưỡng log `[db] CHẬM` (ms) | Không (mặc định 300) | Mọi | `.env` | Xem stdout |
| `DB_LOG_QUERIES` | `1` = in mọi query kèm thời gian | Không | Dev | `.env` | Xem stdout |
| `CRON_SECRET` | Khóa cho Vercel Cron gọi `/api/cron/nhac-lich` (nhắc lịch học 19:00 hằng ngày, `vercel.json`) | Không — trống thì cron trả 404, vẫn gửi tay được ở Lịch tổng | Prod | Vercel env, chuỗi ngẫu nhiên ≥ 16 ký tự; Vercel tự gửi kèm `Authorization: Bearer` | Vercel → Cron Jobs → Run; hoặc bấm "Nhắc lịch ngày mai" |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Khóa công khai Web Push (trình duyệt dùng để đăng ký) | Không — trống thì tắt thông báo đẩy | Mọi | Sinh bằng `npx web-push generate-vapid-keys`; **phải đặt lúc build** (biến `NEXT_PUBLIC_*` được nhúng vào JS) | Nút "Bật thông báo đẩy" hiện ở `/thong-bao` |
| `VAPID_PRIVATE_KEY` | Khóa bí mật ký thông báo đẩy | Cùng cặp với khóa công khai | Server | Vercel env (không commit). Đổi cặp khóa → mọi thiết bị phải bật lại | "Gửi thử" ở `/thong-bao` |
| `VAPID_SUBJECT` | Liên hệ gửi kèm (mailto:) cho dịch vụ push | Không | Server | `.env` | — |

Mẫu: `.env.example`. `.env` có trong `.gitignore`. File `.env` hiện tại còn biến của v2 (Redis, S3, JWT, AI…) không dùng — nên dọn theo `.env.example` (không ảnh hưởng chạy).

`prisma.config.ts` tự nạp `.env` (Node ≥ 20.12, `process.loadEnvFile`); không có `.env` thì dùng biến môi trường hệ thống.

**`connection_limit` trong `DATABASE_URL`:** `=1` làm mọi query của một request chạy nối tiếp và các request chờ nhau. Đo 2026-10-22 (`pnpm bench:admin`): trang tổng quan 888 ms với `=1` so với 321 ms với `=5`. Dev đặt `5`; Vercel đặt `3` (xem `.env.example`).

**Region của Vercel Functions phải cùng region với DB.** Supabase ở Singapore (`ap-southeast-1`) → `vercel.json` đặt `"regions": ["sin1"]`. Mặc định Vercel chạy ở `iad1` (Mỹ): đo 2026-10-21 header `X-Vercel-Id: hkg1::iad1::…`, `/khoa-hoc` TTFB 1,4–1,7 s vì mỗi query đi Mỹ ↔ Singapore. Kiểm tra sau deploy: phần giữa của `X-Vercel-Id` phải là `sin1`.

## 3. Lệnh (PowerShell, tại thư mục gốc)

| Lệnh | Tác dụng | Phá hủy? |
|---|---|---|
| `pnpm install` | Cài phụ thuộc + `prisma generate` (postinstall) | Không |
| `pnpm db:check` | `prisma migrate status` + hướng dẫn tiếng Việt | Không |
| `pnpm db:reset` | `prisma migrate reset --force`: **xóa toàn bộ bảng**, áp migration, chạy seed | **Có — chỉ chủ dự án chạy, chỉ trên dev** |
| `pnpm db:migrate` | `prisma migrate deploy`: áp migration chưa chạy | Không (chỉ thêm) |
| `pnpm db:migrate:new -- --name <tên>` | Tạo file migration mới (`--create-only`) để review | Không |
| `pnpm db:seed` | Seed dữ liệu demo giả (chạy lại được) | Không (upsert) |
| `pnpm db:studio` | Prisma Studio | Cẩn thận khi sửa tay |
| `pnpm dev` | Kiểm tra DB rồi `next dev` | Không |
| `pnpm dev:raw` | `next dev` bỏ qua kiểm tra DB | Không |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Cổng chất lượng NFR-008 | Không |
| `pnpm test:integration` | Integration test trên `TEST_DATABASE_URL` | Ghi/xóa dữ liệu **trong DB test** |
| `pnpm start` | Chạy bản build | Không |

### 3.1 Lần đầu chuyển dev từ v2 sang v3 (chủ dự án chạy)

```powershell
# 1. Backup (đã có backup\corelink-v2-20261021.sql; làm thêm nếu DB đã đổi)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u <user> -p --single-transaction corelink > backup\corelink-YYYYMMDD.sql
# 2. Xóa bảng v2, tạo bảng v3, nạp dữ liệu demo
pnpm db:reset
# 3. Ghi lại mật khẩu demo in ra (nếu không đặt SEED_DEMO_PASSWORD)
# 4. Chạy app
pnpm dev
```

## 4. Release steps (khi có production)

1. **Preflight:** `pnpm typecheck; pnpm lint; pnpm test; pnpm build` xanh; `pnpm audit --prod` không có lỗ hổng mức cao chưa xử lý; docs/18 checklist.
2. **Backup** DB production (§6) và xác nhận file > 0 byte.
3. **Build artifact** từ commit đã tag (người dùng tự commit/push).
4. **Migration:** `pnpm db:migrate` (deploy) — migration chỉ thêm.
5. **Deploy:** thay bản build, khởi động lại `next start`.
6. **Smoke test** (§5).
7. **Theo dõi** log 30 phút; nếu lỗi nghiêm trọng → rollback (§4.1).

### 4.1 Migration and rollback

| Tình huống | Hành động |
|---|---|
| Bản mới lỗi, schema không đổi | Deploy lại bản build trước |
| Migration chỉ thêm (cột null/bảng mới) | Deploy lại bản build trước; schema mới tương thích ngược |
| Migration phá hủy (xóa/đổi cột) | **Không làm trong cùng release**; tách 2 release (expand → contract). Nếu buộc phải: restore từ backup bước 2 (mất dữ liệu sau backup — cần chủ dự án phê duyệt) |
| Dừng rollout khi | Lỗi đăng nhập, lỗi 500 lặp lại, sai phân quyền |

## 5. Smoke test

```powershell
pnpm build; pnpm start   # cửa sổ khác:
$r = Invoke-WebRequest http://localhost:3000/dang-nhap -UseBasicParsing; $r.StatusCode; $r.Headers["X-Frame-Options"]
(Invoke-WebRequest http://localhost:3000/quan-ly -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing).StatusCode   # 307
(Invoke-WebRequest http://localhost:3000/khong-co -ErrorAction SilentlyContinue -UseBasicParsing).StatusCode                      # 404
```
Sau khi có DB: đăng nhập 5 vai trò (TC-009), mở 1 trang của mỗi khu.

## 6. Observability

| Tín hiệu | Pha 1 | Đề xuất Pha 2 |
|---|---|---|
| Log | stdout của Next.js (lỗi không bắt); không log PII/secret | Thu gom log có redaction |
| Health check | Trang `/dang-nhap` 200 (không cần DB) | Endpoint `/api/health` kiểm tra DB |
| Metrics / alert | Cảnh báo query chậm `[db] CHẬM` ≥ `SLOW_QUERY_MS`; thời gian từng request: `next dev` in sẵn, Vercel ghi trong Logs; `pnpm bench:admin` đo thủ công | Uptime check, tỷ lệ 5xx, APM/tracing (QUESTION-Q05) |
| Nghiệp vụ | Ô "Lead quá 24 giờ", audit log | Báo cáo tháng (P2-18) |

## 7. Backup and recovery

| Mục | Dev hiện tại | Đề xuất production |
|---|---|---|
| Phạm vi | Toàn DB `corelink` | Toàn DB |
| Tần suất | Thủ công trước thao tác phá hủy | Hằng ngày + trước mỗi release |
| Lưu giữ | `backup/` (không commit) | 30 bản hằng ngày + 12 bản tháng, lưu ngoài máy chủ, mã hóa |
| RPO / RTO | — | Đề xuất RPO 24h, RTO 4h (chờ chủ dự án duyệt) |
| Restore | `mysql -u <user> -p corelink < backup\corelink-YYYYMMDD.sql` | Như trên vào DB mới rồi đổi `DATABASE_URL` |
| **Thử restore** | **Chưa từng làm** (RISK-011) | Bắt buộc thử một lần vào DB tạm trước production và ghi kết quả vào PROGRESS |

## 8. Incident response

| Mức | Ví dụ | Phản ứng |
|---|---|---|
| SEV-1 | Lộ dữ liệu học sinh, chiếm tài khoản Admin, mất DB | Khóa tài khoản liên quan (Admin), thu hồi phiên (`DELETE FROM sessions` — có thể đăng xuất mọi người), đổi mật khẩu DB, giữ log/backup làm bằng chứng, báo chủ dự án ngay; đánh giá nghĩa vụ thông báo (tư vấn pháp lý) |
| SEV-2 | Không đăng nhập được, lỗi 500 diện rộng | Rollback bản trước (§4.1); kiểm tra DB |
| SEV-3 | Lỗi một màn hình | Ghi issue, sửa ở release sau |

Postmortem: thời gian, tác động, nguyên nhân gốc, hành động — ghi vào `docs/progress/`.

## 9. Support handoff

- Quên mật khẩu → Admin "Đặt lại mật khẩu" (UC-012 A3), gửi mật khẩu tạm qua kênh đã xác minh.
- Phụ huynh không thấy con → Staff liên kết ở `/quan-ly/hoc-vien`.
- GV không điểm danh được (ngoài khung) → Staff sửa ở `/quan-ly/buoi/[id]` với lý do.
- HS nhỏ không có email/SĐT → Admin bổ sung email/SĐT rồi đặt lại mật khẩu (DECISION-D12).
- Tài khoản demo: [ACCOUNTS.md](ACCOUNTS.md) — chỉ dev.
