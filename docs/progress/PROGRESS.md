# Tiến độ — CoreLink Academy v3

## 2026-10-21 (tối) — Bổ sung chức năng theo 4 file của PO (FR-036..FR-052, DECISION-D26) + giao diện cổng

### Bước 1 — Kiểm kê
35 FR v3 đã chạy (công khai/tuyển sinh, tài khoản, đào tạo, điểm danh, bài tập/chấm, cổng + audit). Đối chiếu 4 file PO (Admin.md, Giáo viên.md, Phụ huynh.md, Bảng phân loại ưu tiên demo.md): thiếu nộp bài bằng tệp/ảnh, hồ sơ GV/HS/PH, sửa lớp/dạy thay/học bù/lịch tổng, cấp học, giáo trình–tài liệu, đề xuất đổi lịch, đơn xin nghỉ, thông báo, đánh giá định kỳ, nhắn tin, báo cáo. PO chốt: trợ lý được chạy migration chỉ-thêm; tệp lưu trong Postgres (D24); đơn nghỉ do GV lớp hoặc giáo vụ duyệt (D25).

### Bước 2 — Đã làm
- **DB:** migration `20261023090000_portal_features` (14 bảng mới + cột mới, có mặc định; 4 cấp học khởi tạo) và `20261022090000_admin_perf_indexes` — **đã áp lên Supabase** (`pnpm db:migrate`, PO đồng ý). Chi tiết docs/10 §5b.
- **Tệp:** `src/server/files/*` (kiểm tra loại/dung lượng, `stored_files` + `file_blobs`), route `/tep/[id]` kiểm tra quyền theo chủ sở hữu, `Content-Security-Policy: sandbox`.
- **Bài tập (FR-040/041):** bài nhận tệp/ảnh, tệp đề, bài không câu hỏi chấm điểm tổng, xóa bài, nhắc nộp; điểm tối đa qua `assignmentMaxScore`.
- **Quản lý (FR-036..038):** trang Giáo viên, Phụ huynh, hồ sơ Học sinh (chuyển/gỡ lớp, phụ huynh, chuyên cần, kết quả, đánh giá), nhập HS hàng loạt, sửa lớp/đổi GV-phòng, dạy thay từng buổi, học bù, lịch tổng lọc GV/phòng/lớp, Môn & cấp học, phòng tạm ngừng.
- **HS/PH (FR-039, 044, 045):** chi tiết buổi học, đơn xin nghỉ (duyệt → "Có phép"), bài tập của con, lớp con đang học.
- **GV (FR-043, 046, 049):** đề xuất đổi lịch, duyệt đơn nghỉ, hồ sơ HS lớp mình, đánh giá định kỳ kèm tổng hợp chuyên cần/điểm.
- **Chung (FR-042, 047, 048, 050, 051, 052):** giáo trình–tài liệu–giáo án (chia sẻ theo lớp), thông báo + chuông chưa đọc, nhắn tin (nhóm lớp + 1-1, tự làm mới), tài khoản cá nhân, báo cáo + xuất CSV.
- **Tài liệu:** docs/00, 01 (v3.2), 03, 05 (P2-32..P2-41), 08, 10, 17 (D24..D29).

### Kiểm thử
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `pnpm test` ✓ **17 file / 103 test** (mới: `files/rules.test.ts`, `users/import.test.ts`, `reports/reports.test.ts`, bổ sung `grading.test.ts`).
- **E2E trên Chrome headless + DB thật** (4 vai trò): GV tạo bài nhận tệp + tệp đề → giao → HS bị chặn nộp khi chưa có tệp → tải ảnh, nộp → GV nhắc nộp, chấm 8,5/10, công bố → HS/PH thấy điểm + thông báo, PH tải được ảnh bài làm của con → PH gửi đơn nghỉ → GV Toán duyệt → buổi "Có phép" + PH nhận thông báo → GV đề xuất nghỉ → Admin từ chối → Admin: lịch tổng, giáo viên, phụ huynh, hồ sơ HS, báo cáo, CSV 200 text/csv → thông báo lớp → tài liệu chia sẻ lớp → tin nhắn Admin↔GV, nhóm lớp HS/PH. Truy cập chéo: HS lớp khác mở tài liệu/tệp bài làm → 404; PH2 xem con PH1, GV Văn xem HS lớp Anh → trang "Không tìm thấy" (soft 404 do `loading.tsx` stream trước, không lộ dữ liệu). **Tất cả pass.**
- **Lỗi thật E2E tìm ra và đã sửa:** thông báo thành công nằm trong form nên biến mất khi form ẩn sau thao tác (gửi đơn nghỉ, duyệt/từ chối đơn & đề xuất, giao/đóng bài, công bố) → chuyển trang + Flash.
- Dữ liệu kiểm thử (nhãn "[Kiểm thử]") đã xóa sau mỗi lượt; audit log giữ nguyên (chỉ thêm, NFR-011).

### Bước 3 — Giao diện cổng
Banner chào theo vai trò (lời chào theo giờ, ngày VN, vòm cầu logo), thẻ số liệu có icon xuất hiện lần lượt, menu có icon + nhóm mục (quản lý), thanh đáy điện thoại icon + chữ, hiệu ứng vào trang (`template.tsx` + `.animate-rise`, tắt khi giảm chuyển động), khóa học xuất hiện lần lượt, nút "Đăng ký học thử" dính đáy trên điện thoại ở trang chi tiết khóa. docs/08 §5b.

### Việc PO
1. Review và commit/push (trợ lý không commit).
2. Xác nhận DECISION-D27 (tin nhắn không realtime), D28 (thông báo fan-out lúc gửi), D29 (chưa mở nhắn 1-1 GV↔HS).
3. Vercel: dung lượng tệp ≤ 4 MB/lần (giới hạn body) — muốn tệp lớn hơn thì chuyển Supabase Storage (P2).
4. Các mục "Giả định – cần xác nhận" trong file PO đang ở docs/05 P2-32..P2-41.

---

## 2026-10-21 — Production chậm: Vercel Functions chạy ở Mỹ, DB ở Singapore

- Đo `core-link-academy.vercel.app`: `X-Vercel-Id: hkg1::iad1::…` (function ở `iad1`), `/khoa-hoc` TTFB 1,45–1,70 s, `/dang-nhap` 0,37–0,64 s.
- Thêm `vercel.json` `"regions": ["sin1"]` (cùng region Supabase `ap-southeast-1`); ghi docs/14 §2. **Chưa đo lại** — cần push + redeploy.
- Việc PO: push; trên Vercel đặt `DATABASE_URL` có `connection_limit=3`; chạy `pnpm db:migrate` nếu chưa.


Ghi theo phiên, mới nhất ở trên. Kết quả lệnh là output thực tế, không ước lượng.

## 2026-10-22 — Rà soát và tối ưu Backend khu quản lý (DECISION-D23, chờ PO xác nhận)

### Phát hiện chính
Dữ liệu dev còn rất nhỏ (2 lead, 15 user, 3 lớp, 80 buổi) nhưng mỗi round-trip tới Supabase ~250 ms → thời gian phản hồi gần như hoàn toàn do **số query tuần tự**. Hai nguyên nhân lớn nhất: `.env` đặt `connection_limit=1` (Promise.all chạy nối tiếp) và Prisma tải mỗi quan hệ `include` bằng một query riêng.

### Đã làm
- Prisma `previewFeatures = ["relationJoins"]`: mỗi lệnh đọc có quan hệ = 1 câu SQL. Kiểm chứng: dump kết quả 18 nhóm service (135 KB JSON) với chiến lược cũ và mới → **giống hệt từng byte**.
- Tổng quan: đếm lead 2→1 query (`FILTER`), đếm lớp 2→1 (`groupBy`), cảnh báo vắng 4→1 query (`ROW_NUMBER`), số liệu được cache (tag `dashboard`, TTL 60/300 s, vô hiệu ở mọi action ghi lead/lớp). Cảnh báo vắng: đối chiếu cách cũ trên dữ liệu thật — cùng 1 cảnh báo, cùng 6 buổi được chọn; thứ tự hiển thị nay theo mã lớp, tên học sinh.
- Danh sách môn cache (tag `subjects`, vô hiệu khi lưu/xóa môn/khóa) — bỏ 1 round-trip ở `/quan-ly/lead`, `/khoa-hoc`, form học thử.
- Rate limit: BEGIN + SELECT FOR UPDATE + upsert + COMMIT (4 round-trip) → một `INSERT … ON CONFLICT` nguyên tử; kiểm chứng trên Postgres thật trong transaction rollback (4 lần, max 3 → `[true,true,true,false]`, reset sau cửa sổ, DB không đổi).
- Đăng nhập: bỏ `UPDATE` thừa khi bộ đếm sai đã 0; tạo phiên ∥ dọn phiên hết hạn ∥ dọn bucket cũ.
- Điểm danh: một upsert/học sinh → `createMany` + `updateMany` gộp nhóm (`planAttendanceWrites`, 3 unit test); dự phòng upsert khi điểm danh đồng thời.
- Chuyển lead: 4 kiểm tra trùng SĐT/email tuần tự → 1 query. Ghi chú lead: 3 query không transaction → 1 lệnh lồng nguyên tử.
- Lỗi logic: xóa lớp có thể cascade mất ghi danh vừa thêm (race) → khóa dòng `FOR UPDATE` trong transaction; xóa môn/khóa/phòng đồng thời với thao tác tham chiếu trả 500 → bắt `P2003` thành thông báo thân thiện.
- Audit thêm: `class.delete`, `course.delete`, `subject.delete`, `room.delete`, `guardian.link`, `guardian.unlink`.
- Phân trang danh sách lớp quản lý (`listClassesPage`, 50/trang); `listClasses` giữ nguyên cho trang giáo viên.
- Index mới: migration `prisma/migrations/20261022090000_admin_perf_indexes` (sinh offline bằng `prisma migrate diff`) — **chưa chạy trên DB**.
- Log `[db] CHẬM` cho query ≥ `SLOW_QUERY_MS` (300 ms); `Cache-Control` 1 ngày cho `/brand/*`; `pnpm bench:admin` (chỉ đọc).

### Trước / sau (`pnpm bench:admin`, median 7 lần, ms; RTT ~230–255 ms; ca "Tổng quan" và "Danh sách lead" đo phần query KHÔNG qua cache)
| Ca | Trước, limit=1 | Sau, limit=1 | Trước, limit=5 | Sau, limit=5 |
|---|---|---|---|---|
| Tổng quan `/quan-ly` | 1706 | 888 | 707 | 321 |
| Danh sách lead (môn + trang 1) | 849 | 782 | 613 | 455 |
| Tìm lead theo tên | 489 | 527 | 269 | 229 |
| Chi tiết lead | 439 | 235 | 478 | 226 |
| Danh sách lớp | 540 | 907 | 736 | 223 |
| Chi tiết lớp | 1330 | 226 | 1391 | 229 |
| Học viên | 1224 | 650 | 675 | 225 |
| Người dùng | 488 | 426 | 260 | 219 |
| Nhật ký | 484 | 429 | 265 | 219 |

Ghi chú trung thực: với `limit=1` danh sách lớp chậm hơn vì phân trang thêm một query đếm chạy nối tiếp; "Tìm lead" chênh trong biên nhiễu (p90 dao động tới 1,5 s). Sau tối ưu + `limit=5` mọi ca ≈ 1 round-trip.

### Kết quả lệnh
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` / `pnpm lint` | Pass / Pass |
| `pnpm test` | 14 file, **79/79** pass (thêm 3 test `planAttendanceWrites`) |
| `pnpm build` | Pass |
| `next start` smoke | `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` 200; `/quan-ly` 307 khi chưa đăng nhập; `/khoa-hoc` lần 2 nhanh hơn (cache môn); gzip bật; `/brand/logo.png` có `max-age=86400` |
| Integration test (`test:integration`) | **Chưa chạy** — không có `TEST_DATABASE_URL`, máy không có Postgres/Docker |
| Đăng nhập thật + thao tác ghi trong trình duyệt | **Chưa làm** |

### Cần PO làm
1. `pnpm db:migrate` để tạo index.
2. Sửa `.env`: `connection_limit=1` → `5` (dev); trên Vercel đặt `3`.
3. Xác nhận DECISION-D23.

---

## 2026-10-21 (phiên 3, tiếp) — Làm lại trang chủ theo mô tả của PO (DECISION-D22)

### Đã làm
- **Phụ thuộc mới:** `framer-motion`, `lucide-react` (`pnpm add`).
- **Token/font:** `globals.css` đổi sang `#1F2F98` / `#121C5E` / `#2F6BFF` / `#F5F7FE` / `#0E1433` / `#4A5274`; font wordmark chuyển Source Serif 4 → Lora; thêm keyframes `pulse-ring`. `#2F6BFF` trên nền sáng chỉ 4,20:1 nên chỉ dùng cho nền/gạch chân (docs/08 §4.1).
- **Khung công khai:** `PublicShell` dựng lại (TopBar, Header mega-menu + panel di động, Footer có bản đồ, nút nổi Zalo/Gọi/Lên đầu trang), `MotionConfig reducedMotion="user"`. Trang chủ chuyển sang route group `src/app/(home)/` dùng `PublicShell bare` để các khối tràn viền; các trang công khai khác giữ khung 1120px.
- **Component** `src/components/home/*`: top-bar, header, hero-banner (Ken Burns), quick-access, stats (đếm số), programs (tab `layoutId` + `AnimatePresence`), why-us, teachers, marquee, news-and-stars (modal Esc/click ngoài/focus), register-form, footer, floating-buttons, motion (Reveal/Stagger/CountUp).
- **Dữ liệu tách riêng:** `src/data/home.ts`, `nav.ts`, `site.ts` (thông tin liên hệ placeholder).
- **Form học thử trang chủ:** `submitHomeTrialAction` (`src/server/leads/actions.ts`) dùng lại `trialRequestSchema`, rate limit, honeypot, `submitTrialRequest`; cho chọn nhiều môn (môn đầu là môn chính, còn lại vào ghi chú), "Tiền tiểu học" lưu là lớp 1 + ghi chú; trả `ok: true` để hiện màn hình cảm ơn tại chỗ. Giữ ô đồng ý liên hệ (bắt buộc theo FR-004) dù mô tả không liệt kê.
- **Tài liệu:** D22 + cập nhật Q12 (docs/17), FR-001 (docs/01), docs/08 (token, ngoại lệ, SCREEN-001), P2-23..25 (docs/05), font (docs/02, 20).

### Lệch so với mô tả — cần PO biết
- Ảnh thật là `/brand/logo.png` (1000×1000) và `/brand/banner.png` (**1024×390**, không phải 1640×626) nên banner sẽ hơi mờ trên màn hình rộng; cần ảnh gốc lớn hơn.
- Các mục menu chưa có trang riêng trỏ về khối trên trang chủ hoặc `/khoa-hoc` (không liên kết chết); nút tìm kiếm dẫn tới `/khoa-hoc`; "Tra cứu kết quả", "Cổng học viên/phụ huynh" dẫn tới `/dang-nhap`.
- Tin tức, giáo viên, học viên tiêu biểu là dữ liệu mẫu/placeholder trong `src/data/home.ts`; ngày tin là mẫu.
- Trang chủ không còn đọc DB (khóa nổi bật) — FR-001 đã điều chỉnh.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi |
| `pnpm test` | 14 file, **76/76** pass |
| `pnpm build` | Pass |
| Smoke `next start`: `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` | HTTP 200; HTML trang chủ có đủ các khối chính |
| Kiểm tra bằng mắt (trình duyệt, 360px/desktop), gửi form thật vào DB | **Chưa làm** — cần người dùng chạy `pnpm dev` xem thử |

---

## 2026-10-21 (phiên 3, tiếp) — Redesign giao diện trang web với Banner & Logo chính thức + Animation động

### Đã làm
- **Tài sản hình ảnh thương hiệu**: Lưu 2 ảnh PO cung cấp thành `/brand/banner.png` (435 KB) và `/brand/logo.png` (372 KB); đồng bộ `src/app/icon.png` và `apple-icon.png` theo logo chính thức.
- **Hệ thống Animation & CSS Tokens (`src/app/globals.css`)**:
  - Keyframes: `float-gentle`, `float-gentle-delayed`, `pulse-subtle`, `shimmer-sweep`.
  - Utility classes: `.animate-float`, `.animate-float-delayed`, `.animate-pulse-subtle`, `.card-interactive` (elevation + border glow khi hover), `.btn-shimmer` (vệt sáng lướt qua nút CTA), `.banner-glow-frame` (viền hào quang xanh đa tầng bao quanh banner).
  - Tuân thủ WCAG 2.1 AA: `@media (prefers-reduced-motion: reduce)` tắt toàn bộ chuyển động khi người dùng yêu cầu.
- **Redesign Header & Shell (`src/components/layout/public-shell.tsx`, `brand.tsx`)**:
  - Thanh thông báo tuyển sinh đầu trang với đèn chớp ping xanh ngọc (`animate-ping`).
  - Header kính mờ dính (`sticky`, `backdrop-blur-md`, `bg-surface/90`, viền `border-line/80`).
  - Component `Brand`: hiệu ứng hover phóng to nhẹ (`group-hover:scale-105`), bóng đổ mềm, viền sáng và ánh kim trên logo.
  - Chân trang gradient thương hiệu (`#142170` → `#0B1348`), họa tiết vòm cầu `BridgeArc` phát sáng nhẹ, 3 khối nội dung và liên kết Fanpage.
- **Redesign Trang Chủ (`src/app/(public)/page.tsx`)**:
  - **Hero Showcase**: Trưng bày banner chính thức khổ lớn với khung ánh sáng `banner-glow-frame`, 2 huy hiệu kính mờ bay lơ lửng (`animate-float`) thể hiện "10+ Năm Kinh Nghiệm" và "Sĩ Số 7–12 HS/Lớp".
  - **Tứ Trụ Chất Lượng**: 4 card tương tác trực tiếp lấy từ nội dung cốt lõi của banner (10+ năm kinh nghiệm, 7–12 học sinh/lớp, Cam kết chất lượng đầu ra, Đào tạo liên cấp Tiền TH – THPT).
  - **Lưới Môn Học**: Bộ icon SVG riêng biệt cho 6 môn (Toán, Văn, Anh, Lý, Hóa, Tin) trong `src/components/catalog/subject-icons.tsx`, card tương tác lướt chuột nổi bật.
  - **Khóa Học Nổi Bật**: Card khóa học cải tiến với hiệu ứng nổi `card-interactive` và mũi tên trượt.
  - **Hệ Sinh Thái Cổng Số**: Giới thiệu 3 cổng chuyên biệt (Phụ huynh, Học sinh, Giáo viên) với thông tin minh bạch.
  - **Quy Trình 3 Bước**: Lộ trình đánh số có vòng tròn gradient tỏa sáng.
  - **CTA Banner Cuối Trang**: Nền gradient xanh thương hiệu, họa tiết vòm cầu và nút shimmer nổi bật.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi, 0 cảnh báo |
| `pnpm test` | 14 file, **76/76** pass |
| `pnpm build` | Pass, 39 route |
| Smoke HTTP server dev | `/`, `/khoa-hoc`, `/dang-ky-hoc-thu`, `/dang-nhap` đều trả về HTTP **200** |
| Static assets | `/brand/logo.png` (200), `/brand/banner.png` (200) |

---

## 2026-10-21 (phiên 3, tiếp) — Giao diện theo nhận diện thương hiệu (DECISION-D21)

### Đã làm
- Đo màu từ logo + banner chính thức (System.Drawing): `#1C2D95` (nền logo/banner), `#1D46D4` (ô nhấn), `#D7E6FF` (nền ô "Cam kết"). Facebook chặn khi chưa đăng nhập → không đọc được trang, chỉ dùng 2 ảnh PO gửi.
- Token mới trong `globals.css`; mọi cặp chữ/nền ≥ 4,5:1, viền ô nhập 3,58:1 (đo bằng công thức WCAG — docs/08 §4.1).
- Logo `public/brand/logo.png`, favicon `src/app/icon.png` (512) + `apple-icon.png` (180); component `Brand` + họa tiết `BridgeArc` (`components/layout/brand.tsx`).
- Áp cho mọi khu: header/footer công khai (footer nền xanh, liên kết Facebook), trang chủ (khối giới thiệu nền xanh + ô nhấn kiểu banner, chỉ dùng dữ liệu thật), thẻ khóa học, chi tiết khóa, đăng nhập (khối logo), đổi mật khẩu, 404, sidebar/thanh trên nội bộ nền xanh cho Quản lý/GV/HS/PH, thanh đáy điện thoại, nút (`inverse`, `outline-inverse`, secondary viền xanh), tiêu đề trang màu thương hiệu.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Pass · Pass · 76/76 · Pass (thêm route `/icon.png`, `/apple-icon.png`) |
| Smoke `next start` + Supabase | `/`, `/khoa-hoc`, chi tiết khóa, `/dang-ky-hoc-thu`, `/dang-nhap` 200 và có logo/wordmark; `/brand/logo.png`, `/icon.png` 200; URL lạ 404 |

### Chưa kiểm
- **Chưa xem trực quan** (không có trình duyệt trong phiên): cần PO mở thử ở 360px và desktop, nhất là các trang nội bộ sau đăng nhập.
- QUESTION-Q12: nội dung banner (Toán–Văn–Anh, 7–12 HS/lớp, 10+ năm) khác phạm vi hiện tại — chưa đưa lên web.

## 2026-10-21 (phiên 3, tiếp) — Chuyển sang PostgreSQL/Supabase (ADR-005, DECISION-D20)

### Lý do
Vercel `core-link-academy.vercel.app` trả 500 ở trang đọc DB (`/`), `/dang-nhap` vẫn 200 → `DATABASE_URL` trỏ MySQL local, Vercel không với tới.

### Đã làm
- `schema.prisma` → `postgresql` + `directUrl`; `TinyInt` → `SmallInt`. Migration mới `20261021100000_init` (373 dòng, 11 enum + 18 bảng); migration MySQL cũ chuyển sang `prisma/migrations-mysql-archive/`.
- SQL thô `FOR UPDATE` đổi cú pháp PostgreSQL (`limiter.ts`, `enrollment.ts`, `users/service.ts`); tìm kiếm `contains` thêm `mode: "insensitive"`.
- `.env.example` (mẫu, không có mật khẩu thật), `.env` mới cho Supabase (bản cũ lưu `.env.mysql.bak`, đều bị ignore), `scripts/check-db.mjs` thông báo theo Supabase, `src/test/integration-setup.ts` chặn trỏ trùng DB.

### Kết quả (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm db:migrate` (Supabase) | Applied `20261021100000_init` |
| `pnpm db:seed` (Supabase) | 6 môn, 8 khóa, 3 phòng, 15 tài khoản demo, 3 lớp + buổi, điểm danh, bài tập |
| `pnpm db:check` | Pass |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` | Pass · Pass · 76/76 · Pass |
| Smoke `next start` + Supabase | `/` 200, `/khoa-hoc` 200, `/khoa-hoc/toan-9-on-thi-vao-10` 200 (có dữ liệu), khóa ẩn 404 |

### Còn lại
- Chủ dự án: thêm `DATABASE_URL`, `DIRECT_URL`, `APP_URL` trên Vercel (Project → Settings → Environment Variables), commit + push, Redeploy.
- Dev và production đang dùng chung một DB Supabase (RISK-013). Mật khẩu DB trùng mật khẩu MySQL từng lộ trong lịch sử git → nên đổi.

## 2026-10-21 (phiên 3) — Pha 1e: tài liệu chi tiết theo từng phía + bổ sung code theo báo cáo đối chiếu

Yêu cầu chủ dự án (DECISION-D19): giữ 35 FR; viết lại tài liệu chi tiết theo vai trò dự án **và** theo cổng người dùng; sau đó bổ sung code theo báo cáo; **không commit**; chủ dự án tự chạy `pnpm db:reset`.

### Tài liệu (theo skill project-team-roles-master + template)
- Mới: `02-srs.md`, `04-use-cases/UC-001..UC-020` (tách file, thêm UC-013..020), `09-architecture/system-context.md`, ADR-002..004, `19-team-roles-and-document-register.md`, `20-frontend-guide.md`, `21-backend-guide.md`, `portals/P-01..P-05`, `README.md`, `progress/GAP-REPORT-2026-10-21.md`.
- Viết lại chi tiết: 00, 01 (v3.1: làm rõ FR-006/011/015/019/021/032/033/035, NFR-009..012), 03 (ma trận theo thao tác), 04, 05 (FEAT-001..044, Pha 2 P2-01..22), 06 (BR-009, 011..016, 024..029, 034, 035, 047..051), 07, 08 (screen inventory 39 màn, tương phản đo thật), 09 component, 10 (data dictionary theo cột), 11 (error catalogue, API-021/022, Q-001..034), 12 (threat register T-01..T-20), 13 (TC-039..048, UAT-01..15, ma trận quyền âm), 14, 15 (RACI, RISK-008..012), 16, 17 (D15..D19 — **D15..D18 chờ chủ dự án xác nhận**), 18.

### Code (GAP-01..GAP-14, xem GAP-REPORT)
- Nhập lead thủ công `/quan-ly/lead/moi` (API-021, BR-011/012); xóa môn khi chưa có khóa (API-022); BR-047 — bài chưa chấm hiện "Đang chờ chấm" sau công bố, thẻ công bố báo số bài chưa chấm; đăng nhập giữ ô email/SĐT + rate limit 20 lần/10'/IP; skip link khu nội bộ; 404 có "Về trang tổng quan"; checkbox giữ trạng thái khi lỗi; audit `session.cancel` (transaction); chặn ghi danh HS bị khóa (`STUDENT_DISABLED`); tổng số bài chờ chấm; token `--color-line-strong` cho viền ô nhập (WCAG 1.4.11).
- Test: unit TC-039, 042, 043, 044, 045; integration `*.int.test.ts` (TC-003, 007, 008, 015, 040, 041, 044, 047) + `vitest.integration.config.ts`, `src/test/`, script `pnpm test:integration`, biến `TEST_DATABASE_URL` (chặn trỏ nhầm `corelink`).
- Không có migration mới (đã đối chiếu `migration.sql`).

### Kết quả kiểm tra (chạy thật)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass, 0 lỗi |
| `pnpm test` | 14 file, **76/76** pass (phiên 2: 70) |
| `pnpm test:integration` | 2 file, 8 test **skipped** (không có `TEST_DATABASE_URL`) — chưa chạy thật |
| `pnpm build` | Pass, 39 route (thêm `/quan-ly/lead/moi`, 1,58 kB) |
| Smoke `next start` (không DB) | `/dang-nhap` 200, đủ 4 header, không `X-Powered-By`; `/quan-ly`, `/quan-ly/lead/moi`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`, `/doi-mat-khau` → 307; `/khong-co` → 404 có "Về trang chủ" |
| `grep console.* / dangerouslySetInnerHTML src` | 0 kết quả |

### Chưa làm được / rủi ro còn lại
- **Vẫn chưa chạy luồng nào trên DB thật** (DB `corelink` còn schema v2, `migrate status`: `20261021000000_init` chưa áp) — RISK-007.
- Integration test chưa chạy (Q08); UAT, E2E, axe, đo NFR-009, thử restore backup: Pha 1.5.
- Ghi chú phiên 1–2 về `docs/ACCOUNTS.md` là v2 đã **lỗi thời**: file đã là danh sách tài khoản v3, không chứa mật khẩu.
- Một người kiêm mọi vai trò → chưa có review độc lập (RISK-012).

### Bước tiếp theo
1. Chủ dự án xem `progress/GAP-REPORT-2026-10-21.md` và xác nhận DECISION-D15..D18 (docs/17).
2. Chủ dự án chạy `pnpm db:reset` rồi `pnpm dev`; chạy UAT TC-UAT-01..15 (docs/13 §7) và ma trận quyền âm (§6).
3. Tạo DB test (vd `corelink_test`), `prisma migrate deploy` lên đó, đặt `TEST_DATABASE_URL`, chạy `pnpm test:integration`.
4. Review diff và tự commit (trợ lý không commit/push).

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
