# 08 — UI/UX Specification và Design System

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — screen inventory đầy đủ, tỷ lệ tương phản đo thật, token `line-strong` (GAP-14), đặc tả component + trạng thái, catalogue thông điệp |
| Owner | Trợ lý (Product/UI Designer + UX Writer + Design Systems) · Phê duyệt: chủ dự án |
| Nguồn sự thật token | `src/app/globals.css` (`@theme`). Component: `src/components/ui/**` |

## 1. Audience and primary jobs

| Người dùng | Bối cảnh | Việc chính (job) | Ưu tiên thiết kế |
|---|---|---|---|
| Phụ huynh tiềm năng, 30–50 tuổi | Điện thoại, giờ nghỉ trưa/tối, 4G | "Tìm khóa cho con và để lại số điện thoại" | Chữ lớn, ít bước, 1 CTA rõ |
| Giáo vụ | Máy tính cả ngày, nhiều tab | "Xử lý danh sách lead, mở lớp, xếp học sinh" | Mật độ thông tin vừa, bảng, lọc nhanh, thông báo lỗi cụ thể |
| Giáo viên | Điện thoại khi đứng lớp; máy tính khi soạn/chấm | "Điểm danh 30 giây", "chấm bài buổi tối" | Nút lớn ≥ 44px, thao tác một tay, mặc định thông minh |
| Học sinh (lớp 1–12) | Điện thoại/máy tính bảng | "Biết hôm nay học gì, làm bài, xem điểm" | Ngôn ngữ đơn giản, xác nhận trước khi nộp |
| Phụ huynh có con đang học | Điện thoại | "Con có đi học không, điểm thế nào" | Một màn hình, đọc nhanh, không thuật ngữ nội bộ |

Khả năng tiếp cận: WCAG 2.1 AA (NFR-003); thiết bị ưu tiên: điện thoại 360px cho công khai/GV/HS/PH, máy tính cho quản lý.

## 2. Visual direction

**Nhận diện Core Link Academy — xanh thương hiệu, trắng, rõ ràng (DECISION-D21, thay D07).**

- **Nguồn:** logo và banner chính thức của trung tâm (trang Facebook CoreLinkAcademy). Màu lấy bằng cách đo pixel ảnh gốc: nền logo/banner `#1C2D95`, ô nhấn trên banner `#1D46D4`, nền ô "Cam kết" `#D7E6FF`.
- **Lý do:** website phải nhìn ra ngay là cùng một trung tâm với logo, banner, fanpage mà phụ huynh đã thấy; xanh đậm + trắng tạo cảm giác nghiêm túc, đáng tin.
- **Ẩn dụ thị giác:** cây cầu trong logo ("Core Link" = nối kết) → họa tiết vòm cầu mảnh (`BridgeArc`, trắng 10%) ở khối giới thiệu, chân trang, sidebar, trang đăng nhập. Khối nền xanh đặc + chữ trắng đậm như banner; "ô nhấn" = ô trắng với từ khóa trong ô xanh sáng như "10+ năm" trên banner. Wordmark "CORE LINK / ACADEMY" chữ có chân giống logo; tiêu đề nội dung chữ không chân đậm giống banner.
- **Thay đổi so với bản trước:** bỏ nền giấy ngà và màu nhấn đỏ gạch (không hợp tông xanh thương hiệu); tiêu đề chuyển từ chữ có chân sang chữ không chân đậm.
- **Tính cách thương hiệu:** điềm tĩnh, chính xác, ấm áp vừa phải. Tone viết: lịch sự ("quý phụ huynh"), câu ngắn, động từ rõ, không cảm thán, không biệt ngữ kỹ thuật.
- **Tham khảo tinh thần (không sao chép):** trang khoa của trường đại học, tạp chí học thuật — hierarchy bằng typography và khoảng trắng, không bằng màu.
- **Tránh (DESIGN_QUALITY_NOT_AI):** gradient tím/xanh, glassmorphism, glow, emoji làm icon, floating blobs, card lồng card, bóng đổ dày, hero + 3 card giống nhau vô nghĩa, số liệu bịa ("10.000+ học viên"), badge "AI" trang trí, ảnh stock học sinh cười giả tạo, animation trang trí.
- **Hình ảnh/biểu tượng:** Pha 1 không dùng ảnh (chưa có ảnh thật — QUESTION-Q01); không dùng bộ icon. Trạng thái truyền đạt bằng nhãn chữ (Badge). Nếu Pha 2 có ảnh: ảnh thật của lớp học, tỷ lệ cố định, có `alt` mô tả.

## 3. Sitemap and screen inventory

Sitemap: [07 §1](07-user-flows-and-logic-diagrams.md#1-sitemap). Trạng thái viết tắt: **L** loading (khung xám tĩnh `loading.tsx`) · **E** empty · **V** lỗi validate · **D** lỗi nghiệp vụ · **S** thành công · **P** không quyền (chuyển hướng/404) · **R** chỉ đọc.

| Screen | Route | Actor | Mục tiêu | Vào từ | Thành phần chính | Trạng thái | FR / UC |
|---|---|---|---|---|---|---|---|
| SCREEN-001 | `/` | Khách | Hiểu học viện, đi tới học thử | Trực tiếp, tìm kiếm | Giới thiệu + 2 CTA, lưới môn, khóa nổi bật (CourseCard), 3 bước | E (ẩn khối rỗng) | FR-001 / UC-013 |
| SCREEN-002 | `/khoa-hoc` | Khách | Lọc khóa theo môn/khối | Header, trang chủ | Form GET (2 Select + Lọc/Bỏ lọc), đếm kết quả `aria-live`, lưới CourseCard | E (2 thông điệp), L | FR-002 / UC-013 |
| SCREEN-003 | `/khoa-hoc/[slug]` | Khách | Quyết định học thử | Danh mục | Breadcrumb, CTA, `dl` thông tin, mục tiêu, lộ trình đánh số, lớp đang tuyển | E (chưa có lớp), P (404 khóa ẩn) | FR-003 / UC-013 |
| SCREEN-004 | `/dang-ky-hoc-thu` | Khách | Để lại thông tin | Header, CTA | Form 2 fieldset, honeypot, Checkbox đồng ý, SubmitButton | V, D (rate limit), S → 005 | FR-004, 005 / UC-001 |
| SCREEN-005 | `/dang-ky-hoc-thu/cam-on` | Khách | Xác nhận đã nhận | Sau gửi | Tiêu đề, mô tả bước tiếp theo, 2 nút | — | FR-004 |
| SCREEN-006 | `/dang-nhap` | Mọi người | Vào cổng | Header, chuyển hướng | Form 2 ô, ghi chú quên mật khẩu | V, D (6 thông điệp), S → tổng quan | FR-010, 011 / UC-004 |
| SCREEN-007 | `/doi-mat-khau` | Đã đăng nhập | Đổi mật khẩu (bắt buộc lần đầu) | Đăng nhập, menu | Alert mật khẩu tạm, form 3 ô | V, S (flash) | FR-012 / UC-004 |
| SCREEN-008 | `/quan-ly` | Admin, Staff | Việc cần làm hôm nay | Đăng nhập | 4 ô số liệu có liên kết (ô quá hạn viền warning), Card cảnh báo vắng | E, L | FR-026, 034 / UC-018 |
| SCREEN-009 | `/quan-ly/lead` | Admin, Staff | Tìm và xử lý lead | Menu, ô số liệu | Nút "Nhập lead", form lọc GET, liên kết quá hạn, DataTable, Pagination | E (2 thông điệp), L | FR-006 / UC-002 |
| SCREEN-010 | `/quan-ly/lead/[id]` | Admin, Staff | Tư vấn, đổi trạng thái, chuyển | Danh sách | Thông tin (`tel:`), lịch sử (timeline), Card đổi trạng thái, ghi chú, chuyển học viên | V, D, S, P (404), thẻ mật khẩu tạm | FR-007..009 / UC-002, 003 |
| SCREEN-011 | `/quan-ly/lead/moi` | Admin, Staff | Nhập lead tay | Danh sách lead | Form nguồn + thông tin; lỗi trùng có liên kết lead cũ | V, D, S → 010 | FR-006 / UC-020 |
| SCREEN-012 | `/quan-ly/lop` | Admin, Staff | Xem lớp theo trạng thái | Menu | Nút "Mở lớp mới", bộ lọc dạng chip (`aria-current`), DataTable | E, S (flash xóa lớp) | FR-017 |
| SCREEN-013 | `/quan-ly/lop/moi` | Admin, Staff | Mở lớp | Danh sách lớp | ConfigForm 2 cột, checkbox thứ, cảnh báo thiếu khóa/GV | V, D (danh sách xung đột) | FR-017, 018 / UC-005 |
| SCREEN-014 | `/quan-ly/lop/[id]` | Admin, Staff | Vận hành lớp | Danh sách lớp, cảnh báo | Thông tin, bảng HS + đổi trạng thái, danh sách buổi + "Hủy hoặc dời", ghi danh (tìm + checkbox), trạng thái lớp, xóa lớp | E, V, D, S, P | FR-019..021 / UC-005, 006, 015 |
| SCREEN-015 | `/quan-ly/buoi/[id]` | Admin, Staff | Sửa điểm danh | Chi tiết lớp | SessionAttendance (+ ô lý do ngoài khung) | E, V, D, S, R (buổi hủy) | FR-024 / UC-007 |
| SCREEN-016 | `/quan-ly/hoc-vien` | Admin, Staff | Tạo HS/PH, liên kết | Menu | details "Tạo tài khoản", tìm, danh sách HS (PH n/4, bỏ, thêm), Pagination | E, V, D, S (mật khẩu tạm) | FR-013, 014 / UC-012 |
| SCREEN-017 | `/quan-ly/nguoi-dung` | Admin | Quản lý tài khoản | Menu | details "Tạo tài khoản mới", lọc, DataTable, Pagination | E, V, S | FR-013 / UC-012 |
| SCREEN-018 | `/quan-ly/nguoi-dung/[id]` | Admin | Sửa, khóa, đặt lại MK | Danh sách | Form thông tin, PH/con liên kết, đặt lại MK, khóa/mở | V, D, S, P | FR-013, 014 / UC-012 |
| SCREEN-019 | `/quan-ly/khoa-hoc` | Admin | Danh sách + thêm khóa | Menu | DataTable, details "Thêm khóa học" | E, V, S | FR-015 / UC-014 |
| SCREEN-020 | `/quan-ly/khoa-hoc/[id]` | Admin | Sửa/xóa khóa | Danh sách | Form 2 cột, liên kết trang công khai, xóa (hoặc giải thích không xóa được) | V, D, S, P | FR-015 / UC-014 |
| SCREEN-021 | `/quan-ly/mon-hoc` | Admin | Quản lý môn | Menu | Card mỗi môn (form sửa + xóa khi 0 khóa), thêm môn | V, D, S | FR-015 / UC-014 |
| SCREEN-022 | `/quan-ly/phong` | Admin | Quản lý phòng | Menu | Card mỗi phòng (sửa, xóa/giải thích), thêm phòng | E, V, D, S | FR-016 / UC-014 |
| SCREEN-023 | `/quan-ly/nhat-ky` | Admin | Truy vết | Menu | Lọc loại, DataTable, details JSON, Pagination | E | FR-035 / UC-019 |
| SCREEN-024 | `/giao-vien` | GV | Việc hôm nay | Đăng nhập | Card buổi hôm nay, bài chờ chấm (tổng), cảnh báo vắng | E (3), L | FR-034 / UC-018 |
| SCREEN-025 | `/giao-vien/lich` | GV | Xem tuần dạy | Menu | WeekSchedule (liên kết điểm danh) | E | FR-022 / UC-016 |
| SCREEN-026 | `/giao-vien/lop` | GV | Danh sách lớp mình | Menu | Lưới thẻ lớp | E | FR-022 |
| SCREEN-027 | `/giao-vien/lop/[id]` | GV | Vận hành lớp mình | Lớp của tôi | Cảnh báo vắng (role=status), HS, buổi (cuộn trong khung), bài tập + "Tạo bài tập", bảng điểm (cuộn ngang trong khung) | E, P (404 lớp khác) | FR-023, 027, 033 |
| SCREEN-028 | `/giao-vien/buoi/[id]` | GV | Điểm danh | Hôm nay, lịch, lớp | SessionAttendance: Alert khung, AttendanceForm (radio lớn, nút dính đáy) | E, D, S, R | FR-023 / UC-007 |
| SCREEN-029 | `/giao-vien/bai-tap/moi` | GV | Tạo bài | Chi tiết lớp | ConfigForm (tên, hướng dẫn, hạn, nộp muộn) | V, P | FR-027 / UC-008 |
| SCREEN-030 | `/giao-vien/bai-tap/[id]` | GV | Soạn, giao, công bố | Tạo bài, lớp | Danh sách câu (đáp án đánh dấu), QuestionForm, Card giao bài (+ số bài chưa chấm), thông tin bài | E, V, D, S, R (đã giao) | FR-027, 028, 032 / UC-008, 010 |
| SCREEN-031 | `/giao-vien/bai-tap/[id]/bai-nop` | GV | Ai đã nộp | Trang bài | DataTable trạng thái/điểm/thao tác | E | FR-031 |
| SCREEN-032 | `/giao-vien/bai-nop/[id]` | GV | Chấm | Danh sách bài nộp, tổng quan | GradingForm (bài làm, đáp án, điểm, nhận xét; cảnh báo đã công bố) | V, D, S, R (chưa nộp) | FR-031, 033 / UC-010 |
| SCREEN-033 | `/hoc-sinh` | HS | Việc hôm nay | Đăng nhập | Bài cần làm (≤ 5), WeekSchedule, 5 điểm mới | E (3) | FR-034 / UC-018 |
| SCREEN-034 | `/hoc-sinh/lich` | HS | Xem tuần học | Menu | WeekSchedule (hiện GV) | E | FR-022 / UC-016 |
| SCREEN-035 | `/hoc-sinh/bai-tap` | HS | Danh sách bài | Menu | "Cần làm" và "Đã nộp và đã đóng", Badge trạng thái | E | FR-029 |
| SCREEN-036 | `/hoc-sinh/bai-tap/[id]` | HS | Làm/nộp/xem kết quả | Danh sách, tổng quan | AnswerForm (nút dính đáy) hoặc chế độ xem + Alert điểm | V, D, S, R, P | FR-029..032 / UC-009 |
| SCREEN-037 | `/hoc-sinh/ket-qua` | HS | Điểm + chuyên cần | Menu | ResultsList, AttendanceSummary | E (2) | FR-025, 033 / UC-017 |
| SCREEN-038 | `/phu-huynh` | PH | Theo dõi con | Đăng nhập | Chọn con (chip), WeekSchedule, AttendanceSummary, ResultsList | E (chưa liên kết + 3), P (404) | FR-022, 025, 033, 034 / UC-011 |
| SCREEN-039 | 404 / lỗi / loading | Mọi người | Phục hồi | — | 404: "Về trang chủ" + "Về trang tổng quan" (nếu đã đăng nhập); lỗi: "Thử lại"; loading: PageSkeleton | — | NFR-007 |

## 4. Design tokens

### 4.1 Màu (vai trò + tương phản đo bằng công thức WCAG 2.1)

| Token | Giá trị | Vai trò | Tương phản (đo 2026-10-21) |
|---|---|---|---|
| `--color-paper` | `#F5F7FC` | Nền trang (trắng ngả xanh) | — |
| `--color-surface` | `#FFFFFF` | Bề mặt card/bảng/form | — |
| `--color-ink` | `#141B3D` | Chữ chính | 15,63:1 trên paper · 16,75:1 trên surface |
| `--color-muted` | `#4E5874` | Chữ phụ, nhãn bảng, gợi ý | 6,59:1 paper · 7,07:1 surface · 5,99:1 trên primary-soft |
| `--color-line` | `#DDE3F0` | Đường kẻ, viền card (trang trí) | 1,29:1 surface — **không dùng cho ranh giới điều khiển** |
| `--color-line-strong` | `#7D87A3` | Viền ô nhập/chọn/textarea (WCAG 1.4.11) | 3,58:1 surface · 3,34:1 paper |
| `--color-primary` | `#1C2D95` | **Xanh thương hiệu (logo).** Nút chính, liên kết, tiêu đề trang, sidebar, khối giới thiệu, focus ring | 10,54:1 paper · 11,30:1 surface · chữ trắng 11,30:1 |
| `--color-primary-strong` | `#142170` | Hover nút chính, nền chân trang | chữ trắng 14,18:1 |
| `--color-primary-soft` | `#E6ECFF` | Nền nhấn nhẹ (Alert info, nút phụ khi hover) | primary trên nó 9,58:1 |
| `--color-accent` | `#1D46D4` | **Xanh sáng của banner.** Ô từ khóa, viền nhấn, "404" | 6,81:1 paper · 7,29:1 surface · chữ trắng 7,29:1 |
| `--color-brand-tint` | `#D7E6FF` | Nền nhãn môn, số bước (như ô "Cam kết" trên banner) | primary trên nó 8,96:1 |
| `--color-on-brand-muted` | `#C9D4FF` | Chữ phụ trên nền xanh thương hiệu | 7,72:1 trên primary |
| `--color-success` / `-soft` | `#2F6B47` / `#E7F1EA` | Có mặt, đạt, đã xuất bản | 5,48:1 trên soft · 6,33:1 surface |
| `--color-warning` / `-soft` | `#8A5A00` / `#F7EFDC` | Muộn, quá hạn, mật khẩu tạm | 5,17:1 trên soft · 5,93:1 surface |
| `--color-danger` / `-soft` | `#A3261B` / `#F8E6E3` | Vắng, lỗi, thao tác phá hủy | 6,11:1 trên soft · 7,37:1 surface · chữ trắng trên danger 7,37:1 |

Mọi cặp chữ/nền đang dùng ≥ 4,5:1 (AA chữ thường). Trạng thái luôn có chữ, không chỉ màu (WCAG 1.4.1).

### 4.2 Typography

| Vai trò | Font | Cỡ (token) | Weight | Dùng cho |
|---|---|---|---|---|
| Wordmark "CORE LINK" | Source Serif 4 (`--font-serif`), chữ hoa | 18px | 700 | `Brand` (header, sidebar, chân trang) — giống logo |
| Tiêu đề trang (h1) | Be Vietnam Pro (`--font-heading`), màu primary | 28px (`2xl`) → 36px (`3xl`) ≥ 640px | 700 | PageHeader — giống tiêu đề banner |
| Tiêu đề khối (h2) | Be Vietnam Pro | 18–28px | 700 | Card, section |
| Body | Be Vietnam Pro (`--font-sans`) | 16px, line-height 1,6 | 400 | Nội dung |
| Nhãn, phụ | Be Vietnam Pro | 14px (`sm`) | 500 (nhãn) / 400 | Label, hint, bảng |
| Số liệu dashboard | Source Serif 4 | 36px | 600 | Ô số liệu |

Thang cỡ chữ: 14 / 16 / 18 / 22 / 28 / 36 / 48 (`sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`). Cả hai font có subset `vietnamese`, tải bằng `next/font` (self-host lúc build, `display: swap`). Tiêu đề `text-wrap: balance`.

### 4.3 Khoảng cách, bo góc, viền, chuyển động, breakpoint

| Nhóm | Quy tắc |
|---|---|
| Spacing | Bội số 4px (Tailwind). Khoảng giữa section trang chủ 64px; giữa card 24px; trong card 20px; giữa ô form 16–20px |
| Logo / banner / favicon | `public/brand/logo.png` (1000×1000), `public/brand/banner.png` (banner chính thức), `src/app/icon.png`, `src/app/apple-icon.png`; component `Brand` (ô logo 44px + wordmark) |
| Vùng nền xanh | Lớp `.on-brand`: chữ, liên kết và vòng focus chuyển trắng; nút dùng biến thể `inverse` / `outline-inverse` |
| Viền / elevation | Viền 1px `line` cho card; `.card-interactive` nâng nhẹ và đổ bóng mềm khi hover; `.banner-glow-frame` tỏa sáng hào quang xanh đa tầng |
| Focus | `outline: 2px solid primary; offset 2px` cho mọi `:focus-visible`; radio/checkbox trong nhãn dùng `has-[:focus-visible]` |
| Motion & Animation | Micro-animations: `.animate-float`, `.animate-float-delayed`, `.animate-pulse-subtle`, `.btn-shimmer`, `card-interactive`; `prefers-reduced-motion` tắt toàn bộ transition/animation bảo đảm WCAG 2.1 AA |
| Breakpoint | `sm` 640px (2 cột form), `md` 768px (DataTable thành bảng), `lg` 1024px (sidebar 240px, lưới 7 cột lịch tuần). Nội dung tối đa 1120px |
| Vùng chạm | ≥ 44px (`min-h-11`) cho nút, ô nhập, liên kết điều hướng, radio điểm danh; thanh đáy 56px |

## 5. Responsive and interaction behavior

| Thành phần | < 640px | 640–1023px | ≥ 1024px |
|---|---|---|---|
| Header công khai | Logo + 3 mục, xuống dòng nếu hẹp | Một dòng | Một dòng |
| Khu nội bộ | Thanh trên dính (logo + "Menu"), ngăn kéo `details` chứa menu + tài khoản; GV/HS/PH có thanh đáy ≤ 4 mục | Như trên | Sidebar trái 240px, không có thanh đáy |
| DataTable | Danh sách dòng: cột chính in đậm + `dl` các cột còn lại (không cuộn ngang) | Như < 640 tới 767px; bảng từ 768px | Bảng |
| Form | 1 cột | 2 cột (`columns=2`, ô `wide` chiếm 2 cột) | 2 cột |
| Lịch tuần | Danh sách các ngày có buổi | Như trên | 7 cột |
| Bảng điểm GV | Cuộn ngang **trong khung** (ngoại lệ có chủ đích) | Như trên | Bảng đầy đủ |
| Nút gửi dài (điểm danh, làm bài) | Dính đáy, trên thanh đáy (`bottom-16`) | Như trên | Dính đáy trang |
| Hộp xác nhận | `window.confirm` cho thao tác khó hoàn tác (giao bài, công bố, nộp bài, hủy buổi, xóa, khóa, đặt lại MK, đổi trạng thái lớp) | | |

Bàn phím: thứ tự tab theo thứ tự đọc; skip link "Bỏ qua tới nội dung" ở đầu mọi trang (công khai và nội bộ — GAP-06); menu ngăn kéo là `details/summary` (Enter/Space mở); không bẫy focus.

## 6. Component rules (src/components/ui)

| Component | Biến thể | Trạng thái bắt buộc | Quy tắc |
|---|---|---|---|
| `Button` / `ButtonLink` | primary, secondary, ghost, danger · sm (36px), md (44px) | default, hover, focus-visible, disabled (opacity 60%, `cursor-not-allowed`) | Mỗi màn hình ≤ 1 nút primary trong cùng nhóm; danger chỉ cho thao tác phá hủy |
| `SubmitButton` | như Button | pending: chữ "Đang lưu…"/nhãn riêng + disabled (chống gửi trùng) | Dùng `useFormStatus` |
| `TextField`, `TextareaField`, `SelectField` | — | default, focus (viền primary), invalid (viền danger + `aria-invalid` + lỗi `aria-describedby`), disabled | Luôn có `<label>`; `*` bắt buộc `aria-hidden` + thuộc tính `required`; hint ẩn khi có lỗi; viền `line-strong` |
| `CheckboxField` | — | checked, focus, invalid | Ô 20px, nhãn bấm được |
| `Alert` | info, success, warning, danger | — | danger = `role="alert"`, còn lại `role="status"`; có thể có tiêu đề + danh sách chi tiết |
| `Badge` | neutral, primary, success, warning, danger | — | Luôn có chữ; dùng cho trạng thái nghiệp vụ (§8) |
| `Card` | có/không tiêu đề, có `action` | — | Không lồng Card trong Card |
| `EmptyState` | có/không hành động | — | Một câu mô tả + hành động tiếp theo nếu người xem có quyền |
| `PageHeader` | có mô tả, có `action` | — | Một h1 mỗi trang |
| `DataTable` | — | — | `caption` (sr-only), `th scope="col"`; danh sách dòng ở < 768px có `aria-label` |
| `Pagination` | — | ẩn khi 1 trang | Giữ tham số lọc; "Trang n/N · T mục" |
| `PageSkeleton` | — | loading | Khối xám tĩnh, không nhấp nháy |
| `ConfigForm` (forms) | 1/2 cột, `confirm`, `submitVariant` | lỗi chung + từng ô, giữ giá trị (kể cả checkbox — GAP-08) | `useId` tránh trùng id khi nhiều form một trang |
| `CredentialsNotice` (forms) | — | — | Alert warning "Mật khẩu tạm — chỉ hiển thị một lần"; `code` cho đăng nhập/mật khẩu |
| `AttendanceForm`, `AnswerForm`, `GradingForm`, `QuestionForm` | — | như ConfigForm | Radio/checkbox trong `fieldset/legend` |
| `WeekSchedule` | có/không liên kết buổi, hiện GV | E | Hôm nay: viền primary + "(hôm nay)" sr-only |
| `Flash` | — | S | Chỉ hiển thị chuỗi định sẵn theo mã `?thongbao=` (không in tham số URL) |

## 7. States and copy (UX writing)

### 7.1 Nguyên tắc
- Câu ngắn, chủ động, nói **điều xảy ra + việc tiếp theo**: "Đã hết thời gian điểm danh của giáo viên. Liên hệ giáo vụ để sửa."
- Không đổ lỗi người dùng, không mã lỗi kỹ thuật, không "Error 500".
- Thông báo lỗi đăng nhập không tiết lộ tài khoản có tồn tại.
- Số điện thoại hiển thị dạng `0912 345 678`; ngày `dd/MM/yyyy`; giờ `HH:mm`; tiền `3.600.000 ₫`; điểm dùng dấu phẩy khi nhập được chấp nhận ("7,5").

### 7.2 Catalogue thông điệp chính

| Ngữ cảnh | Thông điệp | Loại |
|---|---|---|
| Form chung lỗi validate | Vui lòng kiểm tra lại các ô được đánh dấu. | danger |
| Rate limit form học thử | Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút. | danger |
| Cảm ơn | Cảm ơn quý phụ huynh — Học viện đã nhận thông tin đăng ký học thử. Giáo vụ sẽ gọi lại trong giờ làm việc để tư vấn và hẹn lịch. | trang |
| Đăng nhập sai | Thông tin đăng nhập không đúng. | danger |
| Khóa tạm | Bạn đã nhập sai 5 lần. Tài khoản tạm khóa 15 phút. | danger |
| Rate limit đăng nhập | Quá nhiều lần đăng nhập từ thiết bị này. Vui lòng thử lại sau 10 phút. | danger |
| Mật khẩu tạm | Bạn đang dùng mật khẩu tạm do học viện cấp. Hãy đặt mật khẩu mới để tiếp tục. | info |
| Trùng lead (nhập tay) | SĐT này đang có lead chưa xử lý xong. → Mở lead hiện có | danger + liên kết |
| Cập nhật đồng thời | Lead vừa được người khác cập nhật. Vui lòng tải lại trang. | danger |
| Trùng lịch | Trùng lịch N buổi. Vui lòng đổi giờ, giáo viên hoặc phòng. + danh sách | danger |
| Ghi danh dừng giữa chừng | Đã ghi danh k học sinh. Dừng lại: <lý do> | danger |
| Ngoài khung (GV) | Ngoài khung điểm danh (30 phút trước giờ học đến 24 giờ sau giờ kết thúc). Bạn chỉ xem được; liên hệ giáo vụ nếu cần sửa. | info |
| Ngoài khung (Staff) | Ngoài khung điểm danh của giáo viên: cần nhập lý do, thay đổi được ghi vào nhật ký. | warning |
| Giao bài | Sau khi giao sẽ không sửa được câu hỏi. Tiếp tục? | confirm |
| Công bố | Học sinh và phụ huynh sẽ thấy điểm, đáp án và nhận xét. Tiếp tục? · Còn N bài chưa chấm… | confirm / warning |
| Nộp bài | Nộp bài? Sau khi nộp sẽ không sửa được. | confirm |
| Đã nộp | Đã nộp bài. Điểm sẽ hiển thị khi giáo viên công bố kết quả. | success |
| Chờ chấm sau công bố | Bài của bạn đang chờ giáo viên chấm. | info |
| Sửa điểm sau công bố | Kết quả đã công bố. Mọi thay đổi điểm sẽ được ghi vào nhật ký. | warning |
| 404 / sai phạm vi | Không tìm thấy trang — Trang không tồn tại hoặc bạn không có quyền xem nội dung này. | trang |
| Lỗi hệ thống | Đã có lỗi xảy ra — Hệ thống tạm thời không xử lý được yêu cầu. Vui lòng thử lại sau ít phút. + Thử lại | trang |
| PH chưa liên kết con | Tài khoản chưa được liên kết với học sinh nào. Vui lòng liên hệ giáo vụ của học viện. | empty |

Danh sách đầy đủ mã lỗi → thông điệp: [11 §3](11-api-specification.md#3-error-catalogue).

## 8. Màu theo trạng thái nghiệp vụ (Badge)

| Nhóm | Trạng thái → nhãn (tone) |
|---|---|
| Lead | Mới (primary) · Đã liên hệ · Đã hẹn học thử · Đã học thử (neutral) · Đã nhập học (success) · Không theo học (danger) · Quá hạn (warning) |
| Lớp | Đang tuyển (primary) · Đang học (success) · Đã kết thúc (neutral) · Đã hủy (danger) |
| Buổi | Theo lịch (primary, thường ẩn) · Đã học (success) · Đã hủy (danger) |
| Ghi danh | Đang học (success) · Bảo lưu (warning) · Đã nghỉ (danger) · Hoàn thành (neutral) |
| Điểm danh | Có mặt (success) · Muộn (warning) · Vắng (danger) · Có phép (neutral) |
| Bài tập | Nháp (neutral) · Đang giao (primary) · Đã đóng (neutral) · Đã công bố (success) |
| Bài nộp | Đang làm (warning) · Chờ chấm (primary) · Đã chấm (success) · Nộp muộn (warning) |
| Tài khoản | Hoạt động (success) · Đã khóa (danger) · Tạm khóa do sai mật khẩu (warning) · Chưa đổi mật khẩu tạm (warning) |

Nguồn: `src/lib/labels.ts`.

## 9. Accessibility and visual QA

| Hạng mục | Quy tắc | Trạng thái kiểm |
|---|---|---|
| Landmark | `header`, `nav` có `aria-label`, `main#noi-dung`, `footer` | Review code: đạt |
| Heading | Một h1/trang; h2 cho card | Review: đạt |
| Nhãn form | Mọi ô có `<label for>`; nhóm radio/checkbox dùng `fieldset/legend`; ô ghi chú điểm danh có nhãn sr-only | Review: đạt |
| Lỗi | Lỗi gắn `aria-describedby` + `aria-invalid`; Alert danger `role="alert"` | Review: đạt |
| Tương phản | §4.1 đo thật; viền điều khiển 3,66:1 | Đạt sau GAP-14 |
| Bàn phím | Tab qua mọi trang; skip link; focus luôn thấy | **Chưa kiểm thực tế** (cần chạy app) |
| Reduced motion | Tắt transition/animation | Review: đạt |
| Zoom 200% / 360px | Không mất nội dung, không cuộn ngang trang | **Chưa kiểm** |
| Trình đọc màn hình | `aria-current` cho mục menu/chip; "(hôm nay)" sr-only | Review; chưa thử NVDA |
| Visual QA | Chụp màn hình 360px và 1280px cho SCREEN-001..039 | **Chưa thực hiện** — không có DB/trình duyệt trong phiên này (ghi trung thực) |
