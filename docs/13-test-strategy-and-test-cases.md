# 13 — Chiến lược kiểm thử và test case

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — test case có bước/kết quả, TC-039..TC-048, kịch bản UAT TC-UAT-01..15, ma trận quyền âm |
| Owner | Trợ lý (QA Test Analyst + SDET) · Chấp nhận UAT: chủ dự án |
| Kết quả thực tế | Ghi ở [progress/PROGRESS.md](progress/PROGRESS.md) và cột "Bằng chứng" của [16](16-traceability-matrix.md). Không ghi "pass" khi chưa chạy |

## 1. Scope and risk approach

| Mức rủi ro | Luồng | Mức kiểm thử bắt buộc |
|---|---|---|
| Cao | Phân quyền/phạm vi (NFR-001), lộ đáp án (FR-032), chuyển lead (FR-009), ghi danh đồng thời (FR-019), nộp bài một lần (FR-029), đăng nhập/khóa (FR-010, 011) | Unit (logic thuần) + Integration (DB) + Manual/E2E truy cập chéo |
| Trung bình | Sinh lịch/trùng lịch, điểm danh khung, chấm điểm, tỷ lệ chuyên cần, cảnh báo vắng | Unit + Manual |
| Thấp | Trang công khai, danh mục, dashboard | Manual + build |

Trình duyệt hỗ trợ: Chrome/Edge/Firefox/Safari 2 bản gần nhất; viewport 360×740 và 1280×800. Ngoài phạm vi Pha 1: load test, pentest, kiểm thử trên thiết bị thật đa dạng.

## 2. Test levels and tools

| Cấp | Công cụ | Lệnh | Phạm vi | Trạng thái |
|---|---|---|---|---|
| Tĩnh | TypeScript strict, ESLint (next config), Next build | `pnpm typecheck`, `pnpm lint`, `pnpm build` | Toàn bộ | Đang chạy mỗi pha |
| Unit | Vitest 3 | `pnpm test` | `src/lib/**`, `src/server/**/rules.ts`, `policy.ts`, `scope.ts` (hàm thuần), schema Zod | Đang chạy |
| Integration | Vitest + MySQL thật (`TEST_DATABASE_URL`, DB riêng) | `pnpm test:integration` | Service có transaction: chuyển lead, ghi danh, mở lớp, nhập lead, xóa môn, hủy buổi | **Có code (P3), chưa chạy** — cần DB test (QUESTION-Q08) |
| E2E | Playwright (đề xuất) | — | Luồng UC chính, 360px, axe | Pha 1.5, chưa có |
| Manual / UAT | Tài khoản seed | §7 | UC-001..020 | Chưa chạy (DB chưa migrate — RISK-007) |
| Smoke | `next start` + curl/PowerShell | docs/14 §5 | Header bảo mật, chuyển hướng khi chưa đăng nhập, 404 | Đã chạy phiên 1–2 |

Quy ước: tên test chứa mã TC — `it("TC-013 sinh đủ số buổi …")`. Integration test đặt ở `src/**/*.int.test.ts`, chỉ chạy bằng `pnpm test:integration`, tự `skip` khi thiếu `TEST_DATABASE_URL`.

## 3. Environment and data

| Môi trường | DB | Dữ liệu | Ghi chú |
|---|---|---|---|
| Unit | Không | Fixture trong test | Không phụ thuộc giờ máy (truyền `now`) |
| Integration | `TEST_DATABASE_URL` (vd `mysql://…/corelink_test`) — **không** trỏ vào `corelink` | Mỗi test tự tạo dữ liệu với hậu tố ngẫu nhiên, dọn sau test | `prisma migrate deploy` lên DB test trước khi chạy |
| Manual | `corelink` sau `pnpm db:reset` | Seed: 15 tài khoản, 3 lớp, 1 cảnh báo vắng (HS2 lớp TOAN9-K1), 1 bài tập 3 dạng câu, 2 lead (1 quá 24h) | Mật khẩu = `SEED_DEMO_PASSWORD` hoặc in ra khi seed |

Tài khoản: [ACCOUNTS.md](ACCOUNTS.md). Không dùng dữ liệu thật.

## 4. Test case inventory

Cột "Tự động": **U** = unit có sẵn · **I** = integration (code P3, chưa chạy) · **M** = thủ công · **E** = ứng viên E2E.

### 4.1 Tuyển sinh

| TC | Yêu cầu | Kịch bản | Tiền điều kiện | Bước / dữ liệu | Kết quả mong đợi | Loại |
|---|---|---|---|---|---|---|
| TC-001 | BR-001 | Chuẩn hóa SĐT | — | `normalizePhone("0912 345 678")`, `"84912345678"`, `"+84 912.345.678"`, `"012345"`, `"0212345678"` | 3 đầu → `+84912345678`; 2 sau → null | U |
| TC-002 | FR-004 | Thiếu đồng ý | — | `trialRequestSchema` với `consent` thiếu | Lỗi ô `consent` "Bạn cần đồng ý…" | U |
| TC-003 | FR-004, BR-004 | Gộp lead mở trùng SĐT | Lead CONTACTED SĐT X | Gửi form SĐT X | Số lead không đổi; lead có thêm RESUBMITTED. Với lead LOST → tạo lead mới | I, M |
| TC-004 | BR-002 | Rate limit form | — | `consume` 6 lần trong 10' ; lần 7 sau khi hết cửa sổ | Lần 6 `allowed=false`; sau cửa sổ đếm lại = 1 | U |
| TC-005 | BR-010 | Ma trận chuyển lead | — | `checkLeadTransition` cho mọi cặp | Đúng bảng docs/06 §2.1 | U |
| TC-006 | BR-013 | LOST không lý do | Lead NEW | → LOST, lý do rỗng/khoảng trắng | `LOST_REASON_REQUIRED` | U |
| TC-007 | FR-009 | Chuyển lead đầy đủ | Lead NEW, lớp OPEN còn chỗ, SĐT PH mới | `convertLead` có chọn lớp | 1 STUDENT (mã `HSyy…`), 1 PARENT, 1 guardianship, 1 enrollment ACTIVE, lead ENROLLED, 1 audit `lead.convert` | I |
| TC-008 | FR-009 | Chuyển lead khi lớp đầy | Lớp capacity 1 đã có 1 ACTIVE | `convertLead` chọn lớp đó | Lỗi `CLASS_FULL`; số users/guardianships/enrollments không đổi; lead giữ trạng thái | I |
| TC-039 | FR-006 | Schema nhập lead tay | — | `manualLeadSchema` hợp lệ (nguồn phone, không môn) / thiếu tên / SĐT sai | Hợp lệ → parse; còn lại lỗi ô | U |
| TC-040 | BR-011 | Nhập tay trùng lead mở | Lead NEW SĐT X | `createManualLead` SĐT X | `DUPLICATE_OPEN_LEAD` + `existingLeadId`; số lead không đổi | I |
| TC-045 | BR-012 | Nguồn lead không hợp lệ | — | `source = "web_form"` hoặc `"abc"` qua schema nhập tay | Lỗi ô `source` | U |

### 4.2 Tài khoản và phân quyền

| TC | Yêu cầu | Kịch bản | Tiền điều kiện | Bước / dữ liệu | Kết quả mong đợi | Loại |
|---|---|---|---|---|---|---|
| TC-009 | FR-010 | Đăng nhập 5 vai trò | Seed | Đăng nhập `admin@`, `giaovu@`, `gv.toan@`, `hs1@`, `ph1@` | Vào `/quan-ly`, `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`; sai MK → "Thông tin đăng nhập không đúng." | M, E |
| TC-010 | BR-005 | Khóa sau 5 lần | — | `afterFailedLogin` 5 lần; `isLocked` tại +14'59" và +15'01" | Lần 5 trả `lockedUntil = now+15'`, bộ đếm 0; khóa/không khóa đúng biên | U |
| TC-011 | BR-006 | Mật khẩu yếu | — | `"abc12"`, `"abcdefgh"`, `"12345678"`, `"Matkhau1"` | 3 đầu lỗi; cuối null | U |
| TC-012 | FR-012 | Bắt đổi mật khẩu tạm | Tài khoản `mustChangePassword` | Đăng nhập, mở `/quan-ly/lead` | Chuyển `/doi-mat-khau`; đổi xong vào được | M, E |
| TC-034 | NFR-001 | PH chỉ xem con | — | `canParentViewStudent([A,B], C)` | false; với A → true | U |
| TC-035 | NFR-001 | GV chỉ lớp mình | — | `canTeacherAccessClass` GV chính / dạy thay / GV khác | true / true / false | U |
| TC-036 | NFR-001 | STAFF không đổi vai trò, không xem audit | — | `can("STAFF", "user.manage" / "audit.read" / "user.createLearner")`; `canCreateUserWithRole("STAFF","TEACHER")` | false / false / true; false | U |
| TC-037 | BR-008 | PH thứ 5 | — | `canAddGuardian(3)`, `canAddGuardian(4)` | true, false | U |
| TC-038 | BR-051 | Admin không tự khóa | — | `canChangeRoleOrStatus(admin, admin.id)` | false; với người khác true | U |
| TC-043 | BR-009 | Rate limit đăng nhập IP | — | `consume(…, LOGIN_LIMIT)` 21 lần | Lần 21 `allowed=false`; lần 20 true | U |
| TC-046 | FR-010, D13 | Giữ ô email/SĐT khi sai | Seed | Đăng nhập sai mật khẩu | Ô "Email hoặc số điện thoại" vẫn còn giá trị; ô mật khẩu trống | M, E |

### 4.3 Đào tạo và điểm danh

| TC | Yêu cầu | Kịch bản | Tiền điều kiện | Bước / dữ liệu | Kết quả mong đợi | Loại |
|---|---|---|---|---|---|---|
| TC-013 | BR-023 | Sinh buổi | — | T2/T4/T6 18:00–19:30 từ 2026-10-21, 5 buổi; chỉ CN từ 21/10, 2 buổi | 21, 23, 26, 28, 30/10 `11:00Z`; 25/10, 01/11 `01:00Z`; index 1..n | U |
| TC-014 | BR-021 | Trùng khoảng | — | `overlaps` chồng / chạm biên; `findConflicts` có buổi CANCELLED | Chồng → true; chạm biên → false; bỏ buổi hủy | U |
| TC-015 | FR-018 | Mở lớp trùng GV | GV có buổi 18:00–19:30 T2 | `createClass` cùng GV T2 18:30 | `SCHEDULE_CONFLICT`, `details` có dòng "Giáo viên đã có lớp …"; không tạo lớp | I |
| TC-016 | BR-020 | Đủ sĩ số | — | `checkEnrollment(seatCount=16, capacity=16)` | `CLASS_FULL` | U |
| TC-017 | BR-022 | Lớp đóng | — | `classStatus = COMPLETED/CANCELLED` | `CLASS_CLOSED` | U |
| TC-018 | BR-026 | Chuyển ghi danh | — | `canChangeEnrollment` mọi cặp | Đúng bảng 06 §2.3 | U |
| TC-019 | BR-030 | Biên khung điểm danh | Buổi 18:00–19:30 | `now` = 17:30, 17:29:59.999, +24h đúng, +24h+1ms | true, false, true, false | U |
| TC-020 | BR-031 | Staff ngoài khung | — | `checkAttendanceEdit(STAFF, inWindow=false, reason="")`; reason="Quên" | `REASON_REQUIRED`; `{override:true}` | U |
| TC-021 | BR-032 | Tỷ lệ chuyên cần | — | 3 PRESENT, 1 LATE, 1 ABSENT, 1 ABSENT ở buổi hủy | 4/5 = 0,8; rỗng → null | U |
| TC-022 | BR-033 | Cảnh báo vắng | — | 2 buổi gần nhất HS A ABSENT cả hai, HS B ABSENT 1 | [A] | U |
| TC-044 | BR-029 | Ghi danh HS bị khóa | — | `checkEnrollment(studentActive=false)` | `STUDENT_DISABLED` (sau các kiểm tra lớp) | U |
| TC-047 | FR-021, FR-035 | Hủy buổi ghi audit | Buổi SCHEDULED tương lai | `cancelSession` | Buổi CANCELLED + `cancelReason`; 1 audit `session.cancel` | I |

### 4.4 Khảo thí

| TC | Yêu cầu | Kịch bản | Bước / dữ liệu | Kết quả mong đợi | Loại |
|---|---|---|---|---|---|
| TC-023 | FR-028 | Giao bài không câu | `checkAssignmentTransition(DRAFT→PUBLISHED, questionCount=0)` | `NO_QUESTIONS` | U |
| TC-024 | FR-028 | Chuyển trạng thái bài | mọi cặp; DRAFT→PUBLISHED khi `dueAt ≤ now` | Đúng bảng 06 §2.5; `DUE_IN_PAST` | U |
| TC-025 | BR-048 | Validate câu | MCQ 1/7 lựa chọn, lựa chọn trống, đáp án ngoài phạm vi; SHORT không đáp án; điểm 0, 0.3, 100.25 | Lỗi đúng ô | U |
| TC-026 | BR-040 | Chấm MCQ | đúng / sai / trống | điểm câu / 0 / 0 | U |
| TC-027 | BR-041 | Chấm trả lời ngắn | `"  Hà   Nội "` vs `["hà nội"]`; NFC/NFD | Đúng | U |
| TC-028 | BR-044, 045 | Nộp quá hạn / lần 2 | `checkSubmit` | `PAST_DUE` khi không cho muộn; `isLate` khi cho; `ALREADY_SUBMITTED` khi đã nộp | U |
| TC-029 | FR-030 | Bài chỉ khách quan | `statusAfterSubmit([MCQ, SHORT])`, có ESSAY | GRADED; SUBMITTED | U |
| TC-030 | BR-042 | Điểm tự luận | `checkTeacherPoints(-1, 6)`, `(6.1, 6)`, `(2.3, 6)`, `(2.25, 6)` | lỗi, lỗi, lỗi bước, null | U |
| TC-031 | BR-043 | Tổng điểm | teacherPoints ưu tiên autoPoints; làm tròn 2 số | Đúng | U |
| TC-032 | FR-032, T-06 | Không lộ đáp án | `toStudentQuestion(q)` | Không có `correctOption`, `acceptedAnswers` | U |
| TC-033 | BR-046 | Kết quả sau công bố | `resultsVisible` null / Date | false / true | U |
| TC-042 | BR-047 | Bài chưa chấm sau công bố | `submissionResultVisible(published, SUBMITTED)`, `(published, GRADED)`, `(chưa công bố, GRADED)` | false, true, false | U |

### 4.5 Giao diện và nền tảng

| TC | Yêu cầu | Kịch bản | Kết quả mong đợi | Loại |
|---|---|---|---|---|
| TC-041 | BR-050 | Xóa môn có khóa | `HAS_COURSES`; môn không khóa → xóa, lead tham chiếu → null | I |
| TC-048 | GAP-08 | Checkbox giữ trạng thái khi lỗi | Sửa khóa: bỏ tích "Xuất bản", xóa tên khóa → lỗi; ô "Xuất bản" vẫn bỏ tích | M |

## 5. Coverage requirements

| Loại | Áp dụng cho |
|---|---|
| Happy path | Mọi UC (TC-UAT) |
| Alternate | UC-001 A2, UC-003 A1/A2, UC-006 A1, UC-007 A1, UC-009 A1/A2, UC-010 A1/A2 |
| Validation | Mọi form (schema Zod: TC-002, 025, 039, 045) |
| Permission denial | §6 + TC-034..036, 038 |
| Boundary | TC-010, 019, 004, 043, 030 |
| Duplicate submission | TC-028 (unit), UAT-10 (hai tab) |
| Concurrency | Ghi danh chỗ cuối, nộp bài 2 tab — integration/E2E (Pha 1.5) |
| Empty state | UAT mỗi màn hình (docs/08 §3 cột E) |
| Failure recovery | DB tắt → trang lỗi (manual) |

## 6. Ma trận kiểm thử quyền âm (server-side)

| # | Tài khoản | Truy cập | Mong đợi |
|---|---|---|---|
| N-01 | (chưa đăng nhập) | `/quan-ly`, `/giao-vien`, `/hoc-sinh`, `/phu-huynh`, `/doi-mat-khau` | 307 → `/dang-nhap` (đã smoke test phiên 2) |
| N-02 | `hs1` | `/quan-ly`, `/giao-vien` | Chuyển `/hoc-sinh` |
| N-03 | `giaovu` | `/quan-ly/nguoi-dung`, `/quan-ly/nhat-ky`, `/quan-ly/khoa-hoc` | Chuyển `/quan-ly` |
| N-04 | `gv.van` | `/giao-vien/lop/<id TOAN9-K1>`, `/giao-vien/buoi/<buổi TOAN9-K1>`, `/giao-vien/bai-tap/<bài TOAN9-K1>` | 404 |
| N-05 | `ph2` | `/phu-huynh?con=<id HS1>` | 404 |
| N-06 | `hs3` | `/hoc-sinh/bai-tap/<bài TOAN9-K1>` | 404 |
| N-07 | `hs1` | Bài DRAFT của lớp mình (sửa URL) | 404 |
| N-08 | `giaovu` | Gửi `createUserAction` với `role=ADMIN` (DevTools) | 404, không tạo user |
| N-09 | `gv.van` | Gửi `saveAttendanceAction` với `sessionId` lớp Toán | 404 |
| N-10 | `hs1` | Xem source trang làm bài trước công bố | Không có chuỗi đáp án đúng (vd "x = 2; x = 3" chỉ xuất hiện như lựa chọn, không có `correctOption`) |

## 7. Kịch bản UAT (thủ công, theo cổng)

| ID | Cổng | Kịch bản | Bước chính | Kết quả mong đợi |
|---|---|---|---|---|
| TC-UAT-01 | Khách | Đăng ký học thử ≤ 2 phút ở 360px | Trang chủ → Đăng ký học thử → điền → Gửi | Trang cảm ơn; lead NEW ở `/quan-ly/lead`; bấm giờ |
| TC-UAT-02 | Khách | Danh mục và khóa ẩn | Lọc Toán/khối 9; mở `/khoa-hoc/tin-hoc-thuat-toan-nang-cao` | Có "Toán 9 — Ôn thi vào lớp 10"; khóa ẩn 404 |
| TC-UAT-03 | Quản lý | Tổng quan | Đăng nhập `giaovu` | Lead mới 2, quá 24 giờ 1 (viền cảnh báo), lớp đang học 3, cảnh báo "Học sinh Hai — Lớp TOAN9-K1" |
| TC-UAT-04 | Quản lý | Mở lớp và trùng lịch | Mở lớp với `gv.toan` T2/T4/T6 18:30–20:00 phòng P.101 | Lỗi trùng lịch liệt kê buổi TOAN9-K1; đổi sang T7 10:00 → thành công, đủ số buổi; sĩ số 30 với P.101 → lỗi sức chứa |
| TC-UAT-05 | GV/HS/PH | Lịch tuần | `gv.toan` /lịch; `hs1` /lịch; `ph1` chọn HS3 | Buổi đúng giờ VN; chuyển tuần hoạt động |
| TC-UAT-06 | Quản lý | Ghi danh + hủy/dời | Ghi danh HS5 vào lớp mới; dời một buổi; hủy một buổi | Thông báo đúng; buổi hủy có lý do; `/quan-ly/nhat-ky` có `session.reschedule`, `session.cancel` |
| TC-UAT-07 | GV | Điểm danh ≤ 30 s ở 360px | `gv.toan` mở buổi hôm nay/hôm qua trong khung → đánh 1 em vắng → Lưu | "Đã lưu điểm danh 2 học sinh."; bấm giờ |
| TC-UAT-08 | Quản lý | Sửa ngoài khung | `giaovu` mở buổi cũ > 24h → sửa không lý do → có lý do | Lỗi lý do; sau đó lưu được; nhật ký có `attendance.override` với before/after |
| TC-UAT-09 | GV | Soạn và giao bài | Tạo bài, thêm 3 dạng câu, giao | Không sửa được câu sau giao |
| TC-UAT-10 | HS/GV | Làm, nộp, chấm, công bố | `hs1` làm bài seed, nộp (thử nộp ở tab thứ hai); `gv.toan` chấm câu tự luận, công bố | Tab 2 báo đã nộp; trước công bố HS không thấy điểm, source không có đáp án; sau công bố thấy điểm/đáp án; HS2 chưa nộp/chưa chấm → không có điểm |
| TC-UAT-11 | PH | Theo dõi con | `ph1` chọn HS1 rồi HS3 | Lịch, chuyên cần, điểm đúng từng con |
| TC-UAT-12 | Admin | Người dùng | Tạo GV mới → đăng nhập bằng mật khẩu tạm → bắt đổi; Admin khóa GV → GV bị đăng xuất | Đúng; nhật ký có `user.create`, `user.disable` |
| TC-UAT-13 | Mọi | Truy cập chéo | §6 N-02..N-10 | Đúng như bảng |
| TC-UAT-14 | Admin | Danh mục | Ẩn khóa nổi bật → biến mất khỏi trang chủ; xóa môn có khóa → lỗi; thêm môn mới rỗng → xóa được | Đúng |
| TC-UAT-15 | Mọi | Bàn phím + 360px | Tab qua form học thử, đăng nhập, điểm danh; mở mọi SCREEN ở 360px | Skip link hoạt động; focus thấy rõ; không cuộn ngang (trừ bảng điểm trong khung) |

## 8. Exit criteria and known gaps

**Đóng Pha 1 khi:** typecheck/lint/test/build xanh; integration test chạy xanh trên DB test; TC-UAT-01..15 đạt và ghi bằng chứng; không còn lỗi mức Cao mở.

**Known gaps (2026-10-21):** chưa có DB đã migrate → mọi TC loại I, M, E chưa chạy (RISK-007); chưa có DB test (Q08); chưa có Playwright/axe (Pha 1.5); chưa đo NFR-009.

## AI (DECISION-D34) — các bộ test đã có

| Tệp | Loại | Nội dung |
|---|---|---|
| `src/server/ai/ai.test.ts` | Unit | cấu hình, `extractJson`, chia điểm, lọc câu lỗi, mọi dữ liệu mẫu (3 nhóm môn × 6 loại) qua đúng schema, prompt |
| `src/server/ai/chat/chat.test.ts` | Unit | khớp 20 câu hỏi mẫu của PO theo vai trò, ngày tương đối, giờ VN, khớp tên con/mã lớp, "chưa điểm danh ≠ vắng" |
| `src/server/ai/generate/render.test.ts` | Unit | mọi loại nội dung → tệp Word/PowerPoint hợp lệ ≤ 4 MB; Toán có ảnh nhúng (`ppt/media`, `word/media`), Tiếng Anh không; hình hỏng bị bỏ mà phần chữ còn; tối đa 6 hình (D43) |
| `src/server/figures/figures.test.ts` | Unit | bộ đọc biểu thức (phép toán, nhân ngầm, Unicode, từ chối `alert(1)`…), đặc tả 6 dạng hình hợp lệ/không hợp lệ, parse lặp lại không đổi, SVG không có thẻ nguy hiểm, chữ được escape, LaTeX lỗi → null, PNG đúng chữ ký và độ phân giải 2× (FR-067) |
| `src/server/ai/generate/slide-layout.test.ts` | Unit | dàn trang slide; slide có hình: chữ hẹp + hình phải, chỉ hình → giữa slide, trang "(tiếp)" không lặp hình |
| `src/server/ai/providers/providers.test.ts` | Unit | Gemini/OpenAI-tương thích/Claude bằng `fetch` giả; lỗi HTTP không lộ khóa; thử lại khi AI trả sai định dạng |
| `src/server/ai/ai.int.test.ts` | Integration (DB thật) | chatbot theo từng vai trò + phạm vi (PH khác, GV khác, sai vai trò), điểm chưa công bố không lộ, soạn bài → bài tập nháp/tệp riêng tư, audit không chứa nội dung, gợi ý chấm không ghi điểm, phiếu giấy, **AI chấm cả bài (D44)**: chỉ GV phụ trách, chấm mọi bài đã nộp chưa chấm, câu bỏ trống = 0, đánh dấu `aiGradedAt`, HS chưa nộp không bị đụng, GV lưu điểm thì bỏ dấu, lần sau báo hết bài, audit `ai.grade_batch`, đường AI nhận diện ý định qua `fetch` giả, hết lượt AI; hình minh họa: slide có SVG xem trước, câu hỏi lưu `figure`, HS mở bài thấy hình mà không thấy đáp án, sửa câu giữ hình / tick "Bỏ hình" thì xóa |

Chạy integration: cần DB riêng `TEST_DATABASE_URL` đã `migrate deploy` và **múi giờ UTC** (`ALTER DATABASE … SET timezone='UTC'`; Supabase mặc định UTC — bộ giới hạn tốc độ so sánh `timestamp` không múi giờ nên lệch nếu server DB để múi giờ khác).
