# 05 — Phân rã chức năng (Feature Tree + Functional Inventory)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — thêm FEAT ID, trạng thái thực tế đã đối chiếu code, mục Pha 2 mở rộng |
| Owner | Trợ lý (Functional Analyst) · Phê duyệt: chủ dự án |

## 1. Nguyên tắc phân rã

- `Domain → Module → Feature (FEAT) → Action`. Domain theo nghiệp vụ học viện: **Công khai**, **Tuyển sinh**, **Nền tảng**, **Đào tạo**, **Khảo thí**, **Cổng**.
- Mỗi FEAT thuộc đúng một FR chính; một FR có thể có nhiều FEAT.
- Cột "Trạng thái" chỉ ghi điều đã kiểm chứng: **Code** = đã có code, typecheck/build xanh; **Unit** = logic thuần có unit test xanh; **Bổ sung P3** = thêm trong phiên 3 (GAP-REPORT); **Manual** = chưa kiểm tra thủ công vì DB chưa migrate (RISK-007).
- Ý tưởng mới không thuộc 35 FR → **chỉ** ghi vào §5 (AGENTS.md).

## 2. Cây chức năng

```text
CoreLink Academy v3
├── Công khai (Web, SEO)
│   └── Nội dung khóa học
│       ├── FEAT-001 Trang chủ
│       ├── FEAT-002 Danh mục + lọc môn/khối
│       └── FEAT-003 Chi tiết khóa + lớp đang tuyển
├── Tuyển sinh
│   ├── Form công khai
│   │   ├── FEAT-004 Form học thử (gộp trùng lead mở)
│   │   └── FEAT-005 Chống spam (rate limit IP, honeypot)
│   └── Quản lý lead
│       ├── FEAT-006 Danh sách, lọc, tìm, quá hạn 24h
│       ├── FEAT-007 Nhập lead thủ công
│       ├── FEAT-008 Đổi trạng thái + ghi chú + lịch sử
│       └── FEAT-009 Chuyển lead thành học viên (1 transaction)
├── Nền tảng
│   ├── Xác thực
│   │   ├── FEAT-010 Đăng nhập email/SĐT, đăng xuất
│   │   ├── FEAT-011 Khóa tạm 15', rate limit IP
│   │   └── FEAT-012 Đổi mật khẩu, bắt đổi mật khẩu tạm
│   ├── Người dùng
│   │   ├── FEAT-013 Danh sách + lọc người dùng
│   │   ├── FEAT-014 Tạo tài khoản (Admin mọi vai trò, Staff HS/PH)
│   │   ├── FEAT-015 Sửa, đổi vai trò, khóa/mở, đặt lại mật khẩu
│   │   └── FEAT-016 Liên kết phụ huynh–học sinh
│   ├── FEAT-042 Nhật ký audit
│   └── FEAT-044 Khung giao diện (shell, điều hướng, 404, lỗi, loading)
├── Đào tạo
│   ├── Danh mục
│   │   ├── FEAT-022 Môn học
│   │   ├── FEAT-023 Khóa học (xuất bản/nổi bật)
│   │   └── FEAT-024 Phòng học
│   ├── Lớp và buổi
│   │   ├── FEAT-017 Mở lớp + sinh buổi
│   │   ├── FEAT-018 Chặn trùng lịch GV/phòng
│   │   ├── FEAT-019 Trạng thái lớp, xóa lớp
│   │   └── FEAT-035 Hủy/dời buổi
│   ├── Ghi danh
│   │   ├── FEAT-020 Ghi danh (khóa chỗ, trùng lịch HS)
│   │   └── FEAT-021 Trạng thái ghi danh
│   ├── FEAT-027 Lịch tuần (GV/HS/PH)
│   └── Điểm danh
│       ├── FEAT-025 Điểm danh trong khung
│       ├── FEAT-026 Sửa ngoài khung + audit
│       ├── FEAT-037 Lịch sử + tỷ lệ chuyên cần
│       └── FEAT-043 Cảnh báo vắng 2 buổi liên tiếp
├── Khảo thí
│   ├── FEAT-028 Soạn bài + 3 dạng câu
│   ├── FEAT-029 Giao/đóng/mở lại bài
│   ├── FEAT-030 Làm bài, lưu nháp, nộp 1 lần
│   ├── FEAT-031 Tự chấm MCQ/trả lời ngắn
│   ├── FEAT-032 Chấm tự luận, sửa điểm, nhận xét
│   ├── FEAT-033 Công bố kết quả
│   ├── FEAT-034 Bảng điểm lớp (GV)
│   └── FEAT-036 Điểm đã công bố (HS/PH)
└── Cổng theo vai trò
    ├── FEAT-039 Tổng quan quản lý
    ├── FEAT-040 Tổng quan giáo viên
    ├── FEAT-041 Tổng quan học sinh
    └── FEAT-038 Cổng phụ huynh (chọn con)
```

## 3. Functional inventory

| FEAT | Module | Hành vi chính (tóm tắt) | Actor | Kênh | BR | Dữ liệu | Màn hình / Action | UC | FR | P | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FEAT-001 | Nội dung | Môn có khóa xuất bản, ≤ 3 khóa nổi bật, CTA | Khách | Web | — | subjects, courses | SCREEN-001 / Q-001, Q-002 | UC-013 | FR-001 | P0 | Code; Manual |
| FEAT-002 | Nội dung | Form GET `mon`, `khoi`; bỏ tham số sai | Khách | Web | — | courses | SCREEN-002 / Q-003 | UC-013 | FR-002 | P0 | Code; Unit |
| FEAT-003 | Nội dung | Chi tiết, 404 khóa ẩn, lớp OPEN còn chỗ | Khách | Web | BR-020 | courses, classes | SCREEN-003 / Q-004 | UC-013 | FR-003 | P0 | Code; Manual |
| FEAT-004 | Form | Validate, chuẩn hóa SĐT, gộp lead mở | Khách | Web | BR-001, 004 | leads, lead_activities | SCREEN-004, 005 / API-001 | UC-001 | FR-004 | P0 | Code; Unit (TC-001, 002) |
| FEAT-005 | Form | 5 lần/10'/IP; honeypot | Khách | Web | BR-002 | rate_limit_buckets | API-001 | UC-001 | FR-005 | P0 | Code; Unit (TC-004) |
| FEAT-006 | Lead | Lọc, tìm, phân trang 20, nhãn quá hạn | Staff | Quản lý | BR-003 | leads | SCREEN-009 / Q-005 | UC-002 | FR-006 | P0 | Code; Manual |
| FEAT-007 | Lead | Nhập tay, nguồn, từ chối trùng lead mở | Staff | Quản lý | BR-011, 012 | leads, lead_activities | SCREEN-011 / API-021 | UC-020 | FR-006 | P0 | Bổ sung P3 |
| FEAT-008 | Lead | Trạng thái BR-010, ghi chú, lịch sử | Staff | Quản lý | BR-010, 013, 016 | leads, lead_activities | SCREEN-010 / API-002, 003 | UC-002 | FR-007, 008 | P0 | Code; Unit (TC-005, 006) |
| FEAT-009 | Lead | HS + PH + liên kết + ghi danh + audit | Staff | Quản lý | BR-007, 008, 015, 020..022 | users, guardianships, enrollments, leads, audit_logs | SCREEN-010 / API-004 | UC-003 | FR-009 | P0 | Code; Manual |
| FEAT-010 | Xác thực | Email/SĐT, phiên DB, cookie, chuyển theo vai trò | Mọi người | Web | — | users, sessions | SCREEN-006 / API-005, 006 | UC-004 | FR-010 | P0 | Code; Manual |
| FEAT-011 | Xác thực | Khóa 5 lần/15'; 20 lần/10'/IP | Mọi người | Web | BR-005, 009 | users, rate_limit_buckets | API-005 | UC-004 | FR-011 | P0 | Code; Unit (TC-010); IP: Bổ sung P3 |
| FEAT-012 | Xác thực | Đổi MK, bắt đổi MK tạm, thu hồi phiên khác | Mọi người | Web | BR-006 | users, sessions | SCREEN-007 / API-007 | UC-004 | FR-012 | P0 | Code; Unit (TC-011) |
| FEAT-013 | Người dùng | Lọc vai trò/trạng thái, tìm, 25/trang | Admin | Quản lý | — | users | SCREEN-017 / Q-028 | UC-012 | FR-013 | P1 | Code |
| FEAT-014 | Người dùng | Mật khẩu tạm một lần, mã HS | Admin, Staff | Quản lý | BR-007, 015 | users, audit_logs | SCREEN-016, 017 / API-008 | UC-012 | FR-013 | P1 | Code; Unit (TC-036) |
| FEAT-015 | Người dùng | Đổi vai trò/khóa/đặt lại MK + audit + thu hồi phiên | Admin | Quản lý | BR-051 | users, sessions, audit_logs | SCREEN-018 / API-008 | UC-012 | FR-013 | P1 | Code; Unit (TC-038) |
| FEAT-016 | Người dùng | Liên kết/bỏ liên kết, tối đa 4 | Admin, Staff | Quản lý | BR-008 | guardianships | SCREEN-016, 018 / API-009 | UC-012 | FR-014 | P0 | Code; Unit (TC-037) |
| FEAT-017 | Lớp | Form mở lớp, sinh buổi VN→UTC | Staff | Quản lý | BR-023, 024 | classes, class_sessions | SCREEN-013 / API-011 | UC-005 | FR-017 | P0 | Code; Unit (TC-013) |
| FEAT-018 | Lớp | Liệt kê xung đột GV/phòng | Staff | Quản lý | BR-021 | class_sessions | API-011, 014 | UC-005, 015 | FR-018 | P0 | Code; Unit (TC-014) |
| FEAT-019 | Lớp | OPEN→IN_PROGRESS→COMPLETED/CANCELLED; xóa khi chưa ghi danh | Staff | Quản lý | BR-025, 027 | classes, enrollments, class_sessions | SCREEN-014 / API-011, 012 | UC-005 | FR-017 | P0 | Code |
| FEAT-020 | Ghi danh | Khóa dòng lớp, sĩ số, trùng lịch HS, HS ACTIVE | Staff | Quản lý | BR-020..022 | enrollments | SCREEN-014 / API-013 | UC-006 | FR-019 | P0 | Code; Unit (TC-016, 017); HS ACTIVE: Bổ sung P3 |
| FEAT-021 | Ghi danh | ACTIVE↔PAUSED, →DROPPED/COMPLETED | Staff | Quản lý | BR-026 | enrollments | SCREEN-014 / API-013 | UC-006 | FR-020 | P0 | Code; Unit (TC-018) |
| FEAT-022 | Danh mục | Thêm/sửa/xóa môn (xóa khi chưa có khóa) | Admin | Quản lý | BR-050 | subjects | SCREEN-021 / API-010, 022 | UC-014 | FR-015 | P1 | Code; Xóa: Bổ sung P3 |
| FEAT-023 | Danh mục | Thêm/sửa/xóa khóa, xuất bản, nổi bật | Admin | Quản lý | BR-050 | courses | SCREEN-019, 020 / API-010 | UC-014 | FR-015 | P1 | Code |
| FEAT-024 | Danh mục | Thêm/sửa/xóa phòng | Admin | Quản lý | BR-050 | rooms | SCREEN-022 / API-010 | UC-014 | FR-016 | P1 | Code |
| FEAT-025 | Điểm danh | 4 trạng thái, mặc định có mặt, khung BR-030 | GV | GV | BR-030, 034 | attendances | SCREEN-028 / API-015 | UC-007 | FR-023 | P0 | Code; Unit (TC-019) |
| FEAT-026 | Điểm danh | Ngoài khung: lý do + audit before/after | Staff | Quản lý | BR-031 | attendances, audit_logs | SCREEN-015 / API-015 | UC-007 | FR-024 | P0 | Code; Unit (TC-020) |
| FEAT-027 | Lịch | Tuần T2–CN giờ VN, chuyển tuần | GV, HS, PH | Cổng | — | class_sessions | SCREEN-025, 033, 034, 038 / Q-013 | UC-016 | FR-022 | P0 | Code; Unit (time) |
| FEAT-028 | Bài tập | Tạo nháp, thêm/sửa/xóa câu 3 dạng | GV | GV | BR-048 | assignments, questions | SCREEN-029, 030 / API-016 | UC-008 | FR-027 | P0 | Code; Unit (TC-025) |
| FEAT-029 | Bài tập | DRAFT→PUBLISHED↔CLOSED | GV | GV | BR-049 | assignments | SCREEN-030 / API-017 | UC-008 | FR-028 | P0 | Code; Unit (TC-023, 024) |
| FEAT-030 | Làm bài | Lưu nháp, nộp 1 lần, nộp muộn | HS | HS | BR-044, 045 | submissions, answers | SCREEN-036 / API-018 | UC-009 | FR-029 | P0 | Code; Unit (TC-028) |
| FEAT-031 | Chấm | Tự chấm MCQ/SHORT, GRADED ngay nếu không tự luận | Hệ thống | — | BR-040, 041 | answers, submissions | API-018 | UC-009 | FR-030 | P0 | Code; Unit (TC-026, 027, 029) |
| FEAT-032 | Chấm | Điểm từng câu bước 0,25, nhận xét | GV | GV | BR-042, 043 | answers, submissions | SCREEN-031, 032 / API-019 | UC-010 | FR-031 | P0 | Code; Unit (TC-030, 031) |
| FEAT-033 | Chấm | Công bố một lần, báo số bài chưa chấm | GV | GV | BR-046, 047 | assignments | SCREEN-030 / API-020 | UC-010 | FR-032 | P0 | Code; Unit (TC-032, 033); BR-047: Bổ sung P3 |
| FEAT-034 | Chấm | Bảng điểm HS × bài | GV | GV | — | submissions | SCREEN-027 / Q-023 | UC-010 | FR-033 | P0 | Code |
| FEAT-035 | Lớp | Hủy/dời buổi, lý do, audit | Staff | Quản lý | BR-021, 028 | class_sessions, audit_logs | SCREEN-014 / API-014 | UC-015 | FR-021 | P1 | Code; audit hủy: Bổ sung P3 |
| FEAT-036 | Kết quả | Điểm đã công bố + đã chấm | HS, PH | Cổng | BR-046, 047 | submissions | SCREEN-037, 038 / Q-027 | UC-017, 011 | FR-033 | P0 | Code; BR-047: Bổ sung P3 |
| FEAT-037 | Điểm danh | Tỷ lệ tổng/từng lớp, lịch sử | HS, PH | Cổng | BR-032 | attendances | SCREEN-037, 038 / Q-018 | UC-017, 011 | FR-025 | P0 | Code; Unit (TC-021) |
| FEAT-038 | Cổng PH | Chọn con, lịch, chuyên cần, điểm | PH | PH | — | guardianships + trên | SCREEN-038 | UC-011 | FR-034 | P0 | Code; Unit (TC-034) |
| FEAT-039 | Cổng | 4 ô số liệu + cảnh báo vắng | Admin, Staff | Quản lý | BR-003 | nhiều | SCREEN-008 | UC-018 | FR-034 | P0 | Code |
| FEAT-040 | Cổng | Buổi hôm nay, bài chờ chấm, cảnh báo | GV | GV | — | nhiều | SCREEN-024 | UC-018 | FR-034 | P0 | Code; đếm tổng: Bổ sung P3 |
| FEAT-041 | Cổng | Bài cần làm, lịch, điểm mới | HS | HS | — | nhiều | SCREEN-033 | UC-018 | FR-034 | P0 | Code |
| FEAT-042 | Audit | Ghi append-only, xem, lọc | Admin | Quản lý | — | audit_logs | SCREEN-023 / Q-034 | UC-019 | FR-035 | P1 | Code |
| FEAT-043 | Điểm danh | 2 buổi gần nhất cùng ABSENT | Staff, GV | Cổng | BR-033 | attendances | SCREEN-008, 024, 027 / Q-017 | UC-018 | FR-026 | P1 | Code; Unit (TC-022) |
| FEAT-044 | Nền tảng UI | AppShell, skip link, 404 có link tổng quan, error, loading | Mọi người | Web | — | — | SCREEN-039 | — | NFR-002, 003, 007 | P0 | Code; skip link + 404: Bổ sung P3 |

## 4. Ngoài phạm vi và trùng lặp

- Không có chức năng trùng: chuyển lead (FEAT-009) và ghi danh (FEAT-020) dùng chung hàm `enrollInTx` (có chủ đích).
- Tạo HS/PH có hai đường: FEAT-009 (từ lead) và FEAT-014 (trực tiếp) — cả hai sinh mã HS và mật khẩu tạm qua cùng `credentials.ts`.
- Admin/Staff xem bài tập/bài nộp: ma trận quyền cũ ghi "R" nhưng không có FR — **không làm**, chuyển §5.

## 5. Pha 2 — ý tưởng đã ghi nhận, chưa làm

| ID | Ý tưởng | Domain | Nguồn | Phụ thuộc |
|---|---|---|---|---|
| P2-01 | Học phí, hóa đơn, công nợ, thanh toán online | Tài chính | Brief | Discovery tài chính, nhà cung cấp thanh toán |
| P2-02 | Lương giáo viên theo buổi dạy | Tài chính | Brief | P2-01 |
| P2-03 | Thông báo (email/Web Push/Zalo): lead mới, vắng, điểm mới, hủy/dời buổi | Giao tiếp | UC-007, 011, 015 | Nhà cung cấp gửi tin |
| P2-04 | Chat/nhắn tin GV–PH | Giao tiếp | Brief | P2-03 |
| P2-05 | Chatbot/AI tư vấn khóa, AI chấm tự luận | AI | v1/v2 | Discovery AI, đánh giá chất lượng |
| P2-06 | Ngân hàng câu hỏi, nhân bản bài, ảnh/công thức trong câu hỏi | Khảo thí | UC-008 | Upload file |
| P2-07 | Giới hạn thời gian làm bài (đếm ngược) | Khảo thí | UC-009 | — |
| P2-08 | Thu hồi công bố, công bố từng học sinh | Khảo thí | UC-010 | — |
| P2-09 | Điểm danh QR/GPS | Đào tạo | Brief | Thiết bị |
| P2-10 | Lịch nghỉ lễ tự bỏ qua khi sinh buổi | Đào tạo | UC-005 | — |
| P2-11 | Chuyển lớp một bước (giữ lịch sử) | Đào tạo | UC-006 | — |
| P2-12 | Xuất lịch iCal/Google Calendar | Đào tạo | UC-016 | — |
| P2-13 | Quên mật khẩu qua email/SMS, 2FA cho Admin | Nền tảng | UC-004 | P2-03 |
| P2-14 | Đăng nhập bằng mã học sinh cho HS nhỏ tuổi | Nền tảng | QUESTION-Q07 | — |
| P2-15 | Phân công lead cho tư vấn viên (`assignedToId`), chiến dịch, mã giới thiệu, phễu | Tuyển sinh | Schema, brief | — |
| P2-16 | Nhập tài khoản hàng loạt từ Excel | Nền tảng | UC-012 | Upload file |
| P2-17 | Admin/Staff xem bài tập, bài nộp, bảng điểm mọi lớp | Khảo thí | docs/03 bản cũ | — |
| P2-18 | Báo cáo tháng (tuyển sinh, chuyên cần, điểm), xuất Excel | Báo cáo | Brief | — |
| P2-19 | Nhiều cơ sở (campus) | Nền tảng | ASSUMPTION-A01 | Thay đổi schema lớn |
| P2-20 | App di động + REST `/api/v1` | Kênh | ADR-001 | ADR mới |
| P2-21 | Ảnh minh họa khóa học | Công khai | UC-014 | Upload file |
| P2-22 | Audit đăng nhập, giám sát lỗi (Sentry…) | Vận hành | QUESTION-Q05 | Hosting |
| P2-23 | Trang riêng cho các mục menu (Giới thiệu, Tuyển sinh, Đào tạo, Tin tức – Hoạt động): thư ngỏ, lịch sử, cơ sở vật chất, đối tác, thời khóa biểu công khai… (hiện trỏ về khối trên trang chủ) | Công khai | Trang chủ D22 | Nội dung từ PO |
| P2-24 | Quản trị tin tức, giáo viên, học viên tiêu biểu trong cổng quản lý (hiện sửa file `src/data/home.ts`) | Công khai | Trang chủ D22 | P2-21 (upload ảnh) |
| P2-25 | Tìm kiếm toàn site, tra cứu kết quả công khai bằng mã (hiện nút tìm dẫn tới `/khoa-hoc`, "Tra cứu kết quả" dẫn tới đăng nhập) | Công khai | Trang chủ D22 | — |
| P2-26 | Xóa mềm (`deletedAt`) cho môn/khóa/phòng/lớp/người dùng thay xóa cứng (hiện: chỉ xóa khi không còn tham chiếu + audit) | Nền tảng | Rà soát BE 2026-10-22 | Đổi schema + lọc mọi truy vấn |
| P2-27 | Ô chọn phụ huynh có tìm kiếm (combobox) ở trang Học viên thay `<select>` 500 dòng lặp lại ở mỗi học sinh | Nền tảng | Rà soát BE 2026-10-22 | — |
| P2-28 | Tìm kiếm tên không phân biệt dấu/hoa thường bằng index `pg_trgm` + `unaccent` khi lead/người dùng > vài chục nghìn | Nền tảng | Rà soát BE 2026-10-22 | Extension Supabase |
| P2-29 | Hàng đợi nền (gửi thông báo, xuất Excel, báo cáo tháng) và cache dùng chung (Redis/KV) khi chạy nhiều instance | Vận hành | Rà soát BE 2026-10-22 | P2-03, P2-18 |
| P2-30 | Trang Khóa học quản lý trên điện thoại: thu gọn form; bộ lọc lead thu gọn (trang Môn học/Phòng đã thu gọn ở FR-036) | Nền tảng | Rà soát giao diện điện thoại 2026-10-21 | — |
| P2-32 | GV đăng ký lịch rảnh để giáo vụ xếp lịch | Đào tạo | Giáo viên.md §2 ("Giả định – cần xác nhận") | Chờ PO |
| P2-33 | Ghi nhận thái độ học tập khi điểm danh theo tiêu chí trung tâm | Đào tạo | Giáo viên.md §6 (giả định, BR15) | Chờ tiêu chí |
| P2-34 | Gửi duyệt giáo án trước buổi dạy | Đào tạo | Giáo viên.md §4 (giả định) | FR-042 |
| P2-35 | Hồ sơ giới thiệu GV công khai + gửi duyệt | Công khai | Giáo viên.md §11A (giả định, BR36) | — |
| P2-36 | GV tải lên / thay / xóa bài làm hộ HS (ảnh bài trên giấy) | Bài tập | Giáo viên.md §8; bảng ưu tiên (chức năng phụ) | FR-040 |
| P2-37 | Giao bài cho nhóm / từng học sinh thay vì cả lớp | Bài tập | Giáo viên.md §7 | — |
| P2-38 | Chia sẻ tài liệu cho từng học sinh / từng buổi (hiện: theo lớp; giáo án gắn buổi) | Tài liệu | Giáo viên.md §5 | FR-042 |
| P2-39 | Nhắn tin realtime, gửi ảnh/tệp trong chat, nhắn 1-1 GV ↔ HS (DECISION-D27, D29) | Tương tác | Bảng ưu tiên (chức năng phụ) | Hạ tầng realtime |
| P2-40 | Đánh giá định kỳ gửi Admin duyệt trước khi tới PH | Đào tạo | Giáo viên.md §9 | FR-049 |
| P2-41 | HS tự ôn luyện (đề luyện tập, lịch sử, chấm tự động); lịch tháng; biểu đồ tiến độ/xu hướng điểm | Học sinh | Bảng ưu tiên P2 | — |
| P2-31 | Ảnh banner riêng cho điện thoại (tỉ lệ dọc/vuông, chữ lớn) — banner hiện tại 1640×626 chỉ cao ~140px ở 375px, chữ trên ảnh khó đọc | Công khai | Rà soát giao diện điện thoại 2026-10-21 | Cần ảnh từ PO |

## 6. Coverage check

- 35/35 FR có ≥ 1 FEAT (FR-006 → FEAT-006, 007; FR-034 → FEAT-038..041).
- Mọi FEAT P0 có UC và ≥ 1 TC (docs/16).
- FEAT không có UC riêng: FEAT-044 (nền tảng UI) — kiểm bằng TC-UAT-15 (bàn phím, 360px).
