# Tiến độ — CoreLink Academy v3

Ghi theo phiên, mới nhất ở trên. Kết quả lệnh là output thực tế, không ước lượng.

## 2026-10-21 (phiên 2) — Pha 1b, 1c, 1d: code xong, chưa chạy trên DB thật

### Đã xong
- **1b Công khai + tuyển sinh (FR-001..009):** `/`, `/khoa-hoc` (lọc `?mon=&khoi=`), `/khoa-hoc/[slug]` (khóa ẩn → 404, lớp đang tuyển + chỗ còn lại), `/dang-ky-hoc-thu` (honeypot, rate limit 5 lần/10 phút/IP trong DB, chuẩn hóa SĐT, trùng lead mở → hoạt động RESUBMITTED), `/quan-ly/lead` (lọc, tìm, quá hạn, phân trang), `/quan-ly/lead/[id]` (đổi trạng thái theo BR-010, ghi chú, chuyển học viên trong một transaction + audit, mật khẩu tạm hiện một lần).
- **1c Đào tạo + điểm danh (FR-013..026):** mở lớp sinh buổi theo giờ VN + chặn trùng GV/phòng (liệt kê từng xung đột), đổi trạng thái lớp, xóa lớp chưa có ghi danh, ghi danh (khóa dòng lớp `FOR UPDATE`, chặn đủ sĩ số/đã ghi danh/trùng lịch HS/lớp đóng), đổi trạng thái ghi danh, hủy/dời buổi (kiểm tra trùng + audit), lịch tuần cho GV/HS/PH, điểm danh mặc định "có mặt" trong khung BR-030, Staff sửa ngoài khung bắt buộc lý do + audit trước/sau, tỷ lệ chuyên cần, cảnh báo vắng 2 buổi liên tiếp; người dùng (tạo/sửa/đổi vai trò/khóa/đặt lại mật khẩu, audit, Admin không tự khóa/tự đổi vai trò), liên kết PH–HS tối đa 4; quản trị môn/khóa/phòng; nhật ký audit chỉ đọc.
- **1d Bài tập + chấm (FR-027..035):** soạn bài 3 dạng câu (MCQ 2–6 lựa chọn, trả lời ngắn, tự luận), DRAFT → PUBLISHED → CLOSED, làm bài/lưu nháp/nộp đúng một lần (`updateMany where IN_PROGRESS`), nộp muộn, tự chấm khách quan, chấm tự luận bước 0,25, công bố kết quả, bảng điểm, HS/PH chỉ thấy điểm + đáp án sau công bố (câu hỏi đi qua `toStudentQuestion`), sửa điểm sau công bố ghi audit.
- **Dashboard FR-034** cho 4 khu; điều hướng đầy đủ theo vai trò.
- Seed bổ sung 3 lớp demo, buổi đã điểm danh, 1 cảnh báo vắng, 1 bài tập, 2 lead.
- Tài liệu cập nhật: 05, 07, 08, 09, 11, 13, 14, 15, 16, 17.

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 13 file, 70/70 test pass |
| `pnpm build` | Pass, 38 route (gồm `/_not-found`) |
| Smoke `next start` (không cần DB) | `/dang-nhap` 200 có đủ 4 header bảo mật; 7 trang nội bộ khi chưa đăng nhập → 307 `/dang-nhap`; URL lạ → 404 |

### Chưa làm được / rủi ro còn lại
- **Chưa chạy bất kỳ luồng nào trên DB thật.** DB `corelink` vẫn là schema v2 (lệnh xóa bị chặn ở phía trợ lý); thử tạo DB riêng `corelink_test` thì MySQL báo `P1010: User was denied access` → không có môi trường để smoke test. Mọi lỗi runtime (truy vấn, raw SQL `FOR UPDATE`, transaction) chỉ được kiểm qua typecheck/build, chưa được chứng minh bằng chạy thật (RISK-007).
- Integration test (TC-003, 007, 008, 015) và E2E (TC-009, 012, 360px, axe) chưa có — Pha 1.5.
- `docs/ACCOUNTS.md` vẫn là tài khoản v2; `.env` còn biến của v2.

### Bước tiếp theo
1. Chủ dự án chạy `pnpm exec prisma migrate reset --force` (xóa bảng v2, áp `init`, chạy seed), rồi `pnpm dev`.
2. Kiểm tra thủ công UC-001..012 với tài khoản demo (docs/14 §4), desktop + 360px; ghi kết quả vào đây và cột Bằng chứng của docs/16.
3. Kiểm tra truy cập chéo theo docs/18: GV Văn mở `/giao-vien/lop/<id lớp Toán>`, PH2 mở `/phu-huynh?con=<id HS1>`, HS3 mở bài tập lớp Toán → đều 404.
4. Pha 1.5: cấp quyền `corelink_test` (QUESTION-Q08) để viết integration test.

## 2026-10-21 — Pha 1a: Nền tảng (đang làm)

### Đã xong
- Scaffold Next.js 15.5 + React 19 + TypeScript strict + Tailwind 4 + Prisma 6 + Vitest (`package.json`, `tsconfig.json`, `next.config.ts` có header bảo mật, `eslint.config.mjs`, `vitest.config.ts`).
- Backup DB cũ: `backup/corelink-v2-20261021.sql` (84 bảng, dump hoàn tất) — RISK-001.
- Schema `prisma/schema.prisma` (18 bảng) và migration `prisma/migrations/20261021000000_init` (sinh offline bằng `prisma migrate diff --from-empty`).
- Seed `prisma/seed.ts`: 6 môn, 8 khóa (1 khóa chưa xuất bản), 3 phòng, 15 tài khoản demo, 6 liên kết PH–HS. Chạy lại nhiều lần được (upsert).
- Tiện ích thuần: `src/lib/phone.ts` (BR-001), `src/lib/time.ts` (NFR-005, giờ VN ↔ UTC), `src/lib/format.ts`.
- Xác thực (FR-010..012, API-005..007): `src/server/auth/` — `password.ts` (Argon2id), `rules.ts` (khóa 5 lần/15 phút, độ mạnh mật khẩu), `session.ts` (phiên DB, cookie httpOnly 7 ngày, lưu sha256 token), `policy.ts` (ma trận quyền theo vai trò), `guard.ts` (`requireActor`, `requireRole`), `actions.ts` (`login`, `logout`, `changePassword`).
- `src/server/audit/log.ts` (append-only), `src/server/errors.ts`, `src/server/validation.ts`.
- Design system: token trong `src/app/globals.css`, font Be Vietnam Pro + Source Serif 4; component `Button/ButtonLink`, `SubmitButton`, `TextField/SelectField/TextareaField/CheckboxField`, `Alert`, `Badge`, `Card`, `EmptyState`, `PageHeader`, `PageSkeleton`.
- Layout: `PublicShell`; `AppShell` (sidebar 240px ≥1024px, menu ngăn kéo dưới 1024px, thanh đáy cho GV/HS/PH). Khu `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`: layout **và** trang đều gọi `requireRole()`.
- Trang: `/` (tối giản), `/dang-nhap`, `/doi-mat-khau`, 4 dashboard khung, `not-found`, `error`, `loading`.

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass, không lỗi |
| `pnpm lint` (ESLint CLI) | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 4 file, 17/17 test pass (TC-001, TC-010, TC-011, TC-036, TC-038 + time) |
| `pnpm build` | Pass, 8 route |
| Smoke `next start` | `/` 200 có đủ 4 header bảo mật; `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`, `/doi-mat-khau` khi chưa đăng nhập → 307 `/dang-nhap`; `/khong-co` → 404 |

### Chưa xong / bị chặn
- **Chưa áp migration vào MySQL.** DB `corelink` vẫn chứa 84 bảng của v2. Lệnh xóa DB (`prisma migrate reset`) bị chặn bởi chế độ quyền của trợ lý; chủ dự án cần tự chạy (xem docs/14 §3). Vì vậy **chưa kiểm tra được đăng nhập thật 5 vai trò** (TC-009, TC-012) — cổng của Pha 1a vẫn mở.
- `Table/ResponsiveList`, `Pagination` (docs/08 §4) để lại cho Pha 1b khi có trang danh sách đầu tiên.
- `docs/ACCOUNTS.md` là danh sách tài khoản của bản v2 (không còn đúng với v3, có mật khẩu dạng chữ) — chờ chủ dự án quyết định xóa/viết lại.
- `.env` còn các biến của v2 (Redis, S3, JWT, AI…) không dùng ở v3; nên dọn theo `.env.example`.

### Bước tiếp theo
1. Chủ dự án chạy `pnpm exec prisma migrate reset --force` (xóa bảng v2, áp migration `init`, tự chạy seed và in mật khẩu demo).
2. Đăng nhập thử 5 vai trò, kiểm tra khóa 15 phút, `mustChangePassword` → đóng Pha 1a.
3. Pha 1b: FR-001..009 (trang công khai, form học thử, lead).
