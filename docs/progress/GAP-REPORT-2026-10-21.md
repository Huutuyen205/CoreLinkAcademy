# Báo cáo đối chiếu tài liệu ↔ code — 2026-10-21 (phiên 3)

| Mục | Giá trị |
|---|---|
| Người lập | Trợ lý AI (kiêm BA + Functional Analyst + QA Test Analyst) |
| Người duyệt | Chủ dự án |
| Phạm vi | 35 FR Pha 1 (docs/01), toàn bộ `src/**`, `prisma/**`, `docs/00..18` |
| Phương pháp | Đọc từng file server/action/page/component; so với FR, BR, ma trận quyền, UI spec; ghi chênh lệch có bằng chứng (file:dòng) |
| Trạng thái | **Đã xử lý trong phiên 3** — xem cột "Xử lý" và [PROGRESS.md](PROGRESS.md) |

Quy ước mức độ: **Cao** = sai nghiệp vụ/quyền hoặc lộ dữ liệu · **Trung bình** = thiếu chức năng tài liệu đã cam kết · **Thấp** = UX/nhất quán.

## 1. Kết luận chung

- Lớp server tuân thủ đúng mẫu `requireRole → parseForm → runAction(service: assertCan/scope → Prisma)`. Không tìm thấy Server Action nào thiếu kiểm tra phiên/vai trò. Không có đường đọc dữ liệu nào bỏ qua policy.
- Đáp án không rời server trước công bố: `openAssignmentForStudent` chỉ truyền `toStudentQuestion()` và `result = null` khi chưa công bố (`src/server/assessment/service.ts`).
- Tài liệu cũ đúng hướng nhưng **mỏng**: chưa có SRS chi tiết từng FR, UC chưa tách file theo template, chưa có screen inventory, data dictionary theo cột, error catalogue, threat register có đánh giá, test case có bước, tài liệu theo cổng người dùng và hướng dẫn FE/BE.
- 14 chênh lệch code cần sửa (mục 2), 6 chênh lệch tài liệu (mục 3). **Cả 14 đã sửa trong phiên 3** (implemented); kiểm chứng: typecheck/lint/build xanh, unit 76/76; GAP-12 integration test viết xong nhưng chưa chạy (chưa có DB test).

## 2. Chênh lệch cần sửa code

| ID | Mức | Yêu cầu / nguồn | Hiện trạng (bằng chứng) | Xử lý (phiên 3) |
|---|---|---|---|---|
| GAP-01 | Trung bình | Thuật ngữ "Lead … hoặc nhập tay" (docs/01 §1); ma trận quyền Staff **C**RU lead (docs/03 §2); tiêu đề trang "khách nhập tay" | Không có màn hình/action tạo lead thủ công; lead chỉ sinh từ form công khai (`src/server/leads/service.ts`) | Thêm `/quan-ly/lead/moi`, `createLeadAction` (API-021), nguồn `phone/walk_in/referral/other`; trùng SĐT với lead đang mở → từ chối kèm liên kết lead cũ (BR-011) |
| GAP-02 | Trung bình | FR-015 "Admin quản lý môn học"; ma trận Admin CRUD môn | Chỉ thêm/sửa môn, không xóa được (`src/server/catalog/admin.ts`) | Thêm `deleteSubjectAction` (API-022): chỉ xóa khi môn chưa có khóa; lead tham chiếu → `subjectId = null` |
| GAP-03 | Cao | FR-032/BR-046: HS/PH chỉ thấy điểm khi đã công bố | Công bố khi còn bài `SUBMITTED` (tự luận chưa chấm) → HS thấy điểm `0` cho câu tự luận, tổng `0` (`openAssignmentForStudent`, `listPublishedResults`, `ResultsList`) | BR-047: điểm hiển thị khi đã công bố **và** bài nộp `GRADED`; bài chưa chấm hiện "Đang chờ chấm". Màn công bố hiện số bài chưa chấm (DECISION-D15) |
| GAP-04 | Thấp | DECISION-D13 (trả lại giá trị đã nhập khi lỗi) | `login` không trả `values` → sai mật khẩu mất ô email/SĐT (`src/server/auth/actions.ts`) | Trả `values.identifier` (không trả mật khẩu) |
| GAP-05 | Cao (bảo mật) | QUALITY_SECURITY_GATES §4 "chống credential abuse"; T-02 | Chỉ khóa theo tài khoản; một IP dò nhiều tài khoản không bị giới hạn | Rate limit đăng nhập 20 lần/10 phút/IP dùng bảng `rate_limit_buckets` (BR-009, DECISION-D16) |
| GAP-06 | Thấp | NFR-003 (bàn phím) | Khu nội bộ không có liên kết "Bỏ qua tới nội dung" (`src/components/layout/app-shell.tsx`), khu công khai có | Thêm skip link vào `AppShell` |
| GAP-07 | Thấp | docs/08 §5 "Permission denied: có link về tổng quan" | Trang 404 chỉ có "Về trang chủ" (`src/app/not-found.tsx`) | Người đã đăng nhập thấy thêm "Về trang tổng quan" theo vai trò |
| GAP-08 | Thấp | NFR-007, D13 | `ConfigForm` ô checkbox đơn mất trạng thái khi lỗi validate (xuất bản/nổi bật khóa học, cho nộp muộn) | Action trả giá trị checkbox trong `values`; `ConfigForm` ưu tiên `values` |
| GAP-09 | Thấp | FR-021, FR-035 (truy vết) | Dời buổi ghi audit, hủy buổi không ghi (`cancelSession`) | Ghi audit `session.cancel` kèm lý do |
| GAP-10 | Trung bình | NFR-001 (validate phía server) | `enrollStudent` không kiểm tra học sinh `ACTIVE` (chỉ màn hình lọc) | Từ chối học sinh bị khóa: `STUDENT_DISABLED` |
| GAP-11 | Thấp | FR-034 "bài chờ chấm" | Tiêu đề thẻ đếm tối đa 20 do `take: 20` (`countPendingGrading`) | Đếm tổng riêng, danh sách vẫn 20 |
| GAP-12 | Trung bình | NFR-008, TC-003/007/008/015 | Không có integration test | Thêm bộ integration test chạy khi có `TEST_DATABASE_URL`, tự bỏ qua khi không có (chưa chạy được — QUESTION-Q08) |
| GAP-13 | Thấp | Unit test cho logic mới | — | Thêm TC-039..TC-046 cho logic thuần mới |
| GAP-14 | Trung bình | NFR-003 WCAG 2.1 AA — 1.4.11 (tương phản thành phần không phải chữ ≥ 3:1) | Viền ô nhập/chọn dùng `--color-line` `#E3DED3`: **1,34:1** trên nền trắng (đo bằng công thức WCAG, xem docs/08 §4.1) | Thêm token `--color-line-strong` `#8C8578` (3,66:1 trên trắng, 3,45:1 trên giấy) cho viền ô nhập, select, textarea, ô ghi chú điểm danh/làm bài; `--color-line` giữ cho đường kẻ trang trí |

## 3. Chênh lệch tài liệu

| ID | Tài liệu | Vấn đề | Xử lý |
|---|---|---|---|
| DOC-GAP-01 | PROGRESS, docs/14 | Ghi `ACCOUNTS.md` còn là v2; thực tế đã viết lại cho v3 | Sửa |
| DOC-GAP-02 | docs/10 §5, docs/14 §3 | `pnpm db:migrate` = `migrate dev` — `package.json` (chưa commit) đổi thành `migrate deploy`, thêm `db:reset`, `db:check`, `db:migrate:new`, `dev` chạy `check-db` trước | Cập nhật lệnh |
| DOC-GAP-03 | docs/06 | Thiếu: chuyển lớp OPEN → COMPLETED; sức chứa phòng (CAPACITY_OVER_ROOM); `STALE` khi cập nhật đồng thời; mở lại lead LOST xóa `lostReason` | Bổ sung BR-012..BR-016, BR-024..BR-026 |
| DOC-GAP-04 | docs/04 | UC gộp một file, thiếu luồng thay thế/ngoại lệ chi tiết; FR-001..003, 015, 016, 021, 022, 026, 034, 035 chưa có UC | Tách `04-use-cases/UC-001..UC-020` |
| DOC-GAP-05 | docs/11 | Thiếu mã lỗi `STALE`, `HAS_ENROLLMENTS`, `IN_USE`, `DUPLICATE_CODE`, `CAPACITY_OVER_ROOM`, `NOT_ACTIVE`, `CLOSED`, `NOT_SUBMITTED`, `ALREADY_LINKED`, `NO_LOGIN`… | Error catalogue đầy đủ |
| DOC-GAP-06 | — | Không có tài liệu theo cổng người dùng, hướng dẫn FE/BE, README cài đặt | Thêm `docs/portals/`, `docs/20`, `docs/21`, `README.md` |

## 4. Không thay đổi (đã xem xét, giữ nguyên)

- `leads.assignedToId` tồn tại trong schema nhưng không FR nào dùng → ghi "dự phòng Pha 2" trong data dictionary, không xóa cột (tránh migration không cần thiết).
- Staff không sửa thông tin học sinh (chỉ Admin) — đúng DECISION-D12/ASSUMPTION-A04.
- E2E Playwright và axe vẫn ở Pha 1.5 (cần DB + cài trình duyệt; RISK-004).
