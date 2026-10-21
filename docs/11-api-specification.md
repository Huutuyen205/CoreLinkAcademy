# 11 — Đặc tả API (Server Actions + truy vấn đọc)

| Mục | Giá trị |
|---|---|
| Phiên bản | 3.1 (2026-10-21) — error catalogue đầy đủ, chi tiết từng action, danh mục truy vấn đọc Q-001..Q-034, API-021/022 mới |
| Trạng thái | Khớp code (API-021, API-022, BR-009, `STUDENT_DISABLED`, `HAS_COURSES` thêm trong phiên 3) |
| Owner | Trợ lý (API Contract Owner) — BE/FE cùng một người |
| Quyết định | [ADR-003](09-architecture/adr/ADR-003-server-actions-as-api.md): không có REST công khai ở Pha 1 |

## 1. Quy ước

| Chủ đề | Quy ước |
|---|---|
| Transport | Server Action = HTTP POST do Next.js sinh (multipart/form-data hoặc urlencoded), gọi từ `<form action={…}>` với `useActionState` |
| Base URL | Cùng origin với app (dev `http://localhost:3000`) |
| CSRF | Next.js kiểm tra `Origin` khớp host; cookie `SameSite=Lax` |
| Auth | Cookie `cl_session` (ADR-002). Action nội bộ gọi `requireRole(...)` trước mọi việc |
| Input | `FormData` → `formFields(names)` (thiếu = chuỗi rỗng) → Zod (`parseForm`). Id: chuỗi 1–40 ký tự. Danh sách id: `formIds(name, max)` |
| Output | `ActionState` (mục 2) hoặc `redirect()` (thành công có đổi trang) hoặc `notFound()` (sai phạm vi) |
| Ngày giờ | Input form theo giờ VN: `date` `YYYY-MM-DD`, `time` `HH:mm`, `datetime-local` `YYYY-MM-DDTHH:mm` → đổi UTC bằng `vnToUtc` |
| Ngôn ngữ thông điệp | Tiếng Việt, hướng dẫn hành động (docs/08 §7) |
| Idempotency | Không có khóa idempotency; chống trùng bằng: nút disabled khi pending, unique DB, `updateMany` có điều kiện (docs/06 §3) |
| Rate limit | API-001 (BR-002), API-005 (BR-009) |
| Cache | Sau ghi: `revalidatePath` các trang liên quan (cột "Revalidate") |
| Versioning | Không áp dụng (một client, deploy cùng nhau) |

## 2. Contract kết quả

```ts
// src/server/errors.ts
type ActionState = {
  ok: boolean;
  message?: string;                 // thông điệp chung (Alert)
  fieldErrors?: Record<string, string>; // lỗi từng ô, khóa = name của input
  details?: string[];               // danh sách chi tiết, vd. từng buổi trùng lịch
  values?: Record<string, string>;  // giá trị đã gửi để điền lại form (KHÔNG chứa mật khẩu)
};
// Mở rộng theo action:
type ConvertState    = ActionState & { credentials?: IssuedCredential[]; studentCode?: string; studentId?: string }; // API-004
type CreateUserState = ActionState & { credential?: { fullName; login; password; studentCode | null } };            // API-008
type ResetState      = ActionState & { password?: string; login?: string };                                          // API-008
type CreateLeadState = ActionState & { existingLeadId?: string };                                                    // API-021
```

Ánh xạ lỗi: Zod → `{ ok:false, message:"Vui lòng kiểm tra lại các ô được đánh dấu.", fieldErrors, values }` · `DomainError(code, message, fieldErrors?, details?)` → `{ ok:false, message, fieldErrors, details, values }` · `ForbiddenError` → `notFound()` (HTTP 404 trang) · lỗi khác → ném lên `error.tsx` (HTTP 500, không lộ chi tiết).

## 3. Error catalogue

| Mã | Thông điệp (rút gọn) | Gắn ô | Có thể thử lại | Hành động người dùng | Nguồn |
|---|---|---|---|---|---|
| (validate) | Vui lòng kiểm tra lại các ô được đánh dấu. | nhiều | Có | Sửa ô | mọi action |
| RATE_LIMITED | Bạn đã gửi quá nhiều lần… thử lại sau 10 phút. | — | Sau 10' | Chờ | API-001 |
| LOGIN_RATE_LIMITED | Quá nhiều lần đăng nhập từ thiết bị này… sau 10 phút. | — | Sau 10' | Chờ | API-005 |
| INVALID_CREDENTIALS | Thông tin đăng nhập không đúng. | — | Có | Nhập lại | API-005 |
| LOCKED | Tài khoản tạm khóa… thử lại sau 15 phút. | — | Sau 15' | Chờ / liên hệ | API-005 |
| ACCOUNT_DISABLED | Tài khoản đã bị khóa. Vui lòng liên hệ học viện. | — | Không | Liên hệ | API-005 |
| WRONG_PASSWORD | Mật khẩu hiện tại không đúng. | currentPassword | Có | Nhập lại | API-007 |
| WEAK_PASSWORD | Mật khẩu cần ít nhất 8 ký tự / có cả chữ và số. | newPassword | Có | Đổi mật khẩu | API-007 |
| INVALID_SUBJECT | Môn học không hợp lệ. | subjectId | Có | Chọn lại | API-001, 021 |
| DUPLICATE_OPEN_LEAD | SĐT này đang có lead chưa xử lý xong. | phone | Không | Mở lead cũ (`existingLeadId`) | API-021 |
| INVALID_TRANSITION | Không thể chuyển … sang trạng thái này. / Lead đã nhập học hoặc đã đóng… / Chỉ hủy (dời) được buổi chưa diễn ra. | — | Không | Tải lại | API-002, 004, 012, 013, 014, 017 |
| LOST_REASON_REQUIRED | Cần nhập lý do khi đánh dấu không theo học. | lostReason | Có | Nhập lý do | API-002 |
| STALE | … vừa được người khác cập nhật. Vui lòng tải lại trang. | — | Có (sau tải lại) | Tải lại | API-002, 013 |
| PHONE_TAKEN_BY_OTHER_ROLE | SĐT phụ huynh đã thuộc một tài khoản không phải phụ huynh. | parentPhone | Có | Dùng SĐT khác | API-004 |
| DUPLICATE_EMAIL | Email đã được dùng. | email/parentEmail/studentEmail | Có | Đổi email | API-004, 008 |
| DUPLICATE_PHONE | Số điện thoại đã được dùng. | phone/studentPhone | Có | Đổi SĐT | API-004, 008 |
| NO_LOGIN | Cần email hoặc số điện thoại để đăng nhập. | email, phone | Có | Nhập một trong hai | API-008 |
| CANNOT_MODIFY_SELF | Bạn không thể tự đổi vai trò / tự khóa tài khoản của chính mình. | role | Không | Nhờ Admin khác | API-008 |
| INVALID | Khóa học / Giáo viên / Phòng / Học sinh / Phụ huynh không hợp lệ. | ô tương ứng | Có | Chọn lại | API-009, 010, 011, 013 |
| ALREADY_LINKED | Phụ huynh này đã được liên kết. | — | Không | — | API-009 |
| MAX_GUARDIANS | Mỗi học sinh có tối đa 4 phụ huynh. | — | Không | Bỏ bớt liên kết | API-009 |
| DUPLICATE_SLUG | Đường dẫn (slug) đã được dùng. | slug | Có | Đổi slug | API-010 |
| HAS_CLASSES | Khóa đã có lớp nên không xóa được. Hãy tắt xuất bản để ẩn khóa. | — | Không | Ẩn khóa | API-010 |
| HAS_COURSES | Môn đang có khóa học nên không xóa được. | — | Không | Xóa/chuyển khóa trước | API-022 |
| DUPLICATE_NAME | Tên phòng đã tồn tại. | name | Có | Đổi tên | API-010 |
| IN_USE | Phòng đang được dùng cho lớp/buổi học nên không xóa được. | — | Không | — | API-010 |
| CAPACITY_OVER_ROOM | Sĩ số vượt sức chứa phòng. | capacity | Có | Giảm sĩ số / đổi phòng | API-011 |
| DUPLICATE_CODE | Mã lớp đã tồn tại. | code | Có | Đổi mã | API-011 |
| SCHEDULE_CONFLICT | Trùng lịch N buổi… (+ `details`) / Lịch lớp trùng với lớp khác học sinh đang học… | — | Có | Đổi giờ/GV/phòng | API-004, 011, 013, 014 |
| HAS_ENROLLMENTS | Lớp đã có ghi danh, chỉ có thể hủy lớp. | — | Không | Hủy lớp | API-011 |
| CLASS_CLOSED | Lớp đã kết thúc hoặc đã hủy, không ghi danh thêm được. | — | Không | Chọn lớp khác | API-004, 013 |
| ALREADY_ENROLLED | Học sinh đã ghi danh lớp này. | — | Không | — | API-004, 013 |
| CLASS_FULL | Lớp đã đủ sĩ số. | — | Không | Tăng sĩ số / lớp khác | API-004, 013 |
| STUDENT_DISABLED | Tài khoản học sinh đang bị khóa, không ghi danh được. | — | Không | Mở khóa trước | API-013 |
| NOT_FOUND | Không tìm thấy lớp. | — | Không | Tải lại | API-004, 013 |
| SESSION_CANCELLED | Buổi học đã bị hủy, không điểm danh được. | — | Không | — | API-015 |
| OUTSIDE_WINDOW | Đã hết thời gian điểm danh của giáo viên. Liên hệ giáo vụ để sửa. | — | Không | Liên hệ giáo vụ | API-015 |
| REASON_REQUIRED | Sửa điểm danh ngoài khung thời gian cần nhập lý do. | reason | Có | Nhập lý do | API-015 |
| EMPTY | Không có học sinh nào để điểm danh. | — | Không | — | API-015 |
| NOT_DRAFT | Chỉ sửa/xóa câu hỏi khi bài còn ở trạng thái nháp. | — | Không | — | API-016 |
| INVALID_QUESTION | Câu hỏi chưa hợp lệ. | prompt, points, options, correctOption, acceptedAnswers | Có | Sửa ô | API-016 |
| DUE_IN_PAST | Hạn nộp mới phải ở tương lai. / Hạn nộp đã qua. Hãy sửa hạn nộp trước khi giao bài. | dueAt | Có | Sửa hạn | API-016, 017 |
| NO_QUESTIONS | Bài cần ít nhất một câu hỏi trước khi giao. | — | Có | Thêm câu | API-017 |
| ALREADY_SUBMITTED | Bạn đã nộp bài này. | — | Không | — | API-018 |
| PAST_DUE | Đã quá hạn nộp (và bài không nhận nộp muộn). | — | Không | — | API-018 |
| NOT_ACTIVE | Bạn không còn đang học lớp này nên không làm bài được. | — | Không | — | API-018 |
| CLOSED | Bài đã đóng. | — | Không | — | API-018 |
| NOT_SUBMITTED | Học sinh chưa nộp bài. | — | Không | — | API-019 |
| POINTS_OUT_OF_RANGE | Vui lòng kiểm tra lại điểm. | `points:<answerId>` | Có | Sửa điểm | API-019 |
| NOT_PUBLISHED | Bài chưa được giao nên chưa thể công bố kết quả. | — | Không | Giao bài trước | API-020 |
| (404) | Trang "Không tìm thấy trang" | — | — | — | mọi action/page khi sai phạm vi |

Ghi chú: `RATE_LIMITED`, `LOGIN_RATE_LIMITED`, `INVALID_CREDENTIALS`, `LOCKED`, `ACCOUNT_DISABLED`, `WRONG_PASSWORD`, `WEAK_PASSWORD` là **tên khái niệm** dùng trong tài liệu/test — các action này trả thẳng `message`/`fieldErrors`, không ném `DomainError` có `code`. Các mã còn lại là `DomainError.code` thật trong code.

## 4. Endpoint inventory

| API | Action (file) | Quyền | Input chính | Kết quả thành công | Lỗi | Revalidate | FR |
|---|---|---|---|---|---|---|---|
| API-001 | `submitTrialRequestAction` (`server/leads/actions.ts`) | Khách | parentName, phone, email, studentName, gradeLevel, subjectId, courseSlug, note, consent, website (honeypot) | redirect `/dang-ky-hoc-thu/cam-on` | validate, RATE_LIMITED, INVALID_SUBJECT | — | FR-004, 005 |
| API-002 | `changeLeadStatusAction` | ADMIN, STAFF | leadId, status, lostReason | `{ok, "Đã cập nhật trạng thái."}` | INVALID_TRANSITION, LOST_REASON_REQUIRED, STALE, 404 | `/quan-ly/lead/[id]` | FR-007 |
| API-003 | `addLeadNoteAction` | ADMIN, STAFF | leadId, content (1–2000) | `{ok, "Đã thêm ghi chú."}` | validate, 404 | `/quan-ly/lead/[id]` | FR-008 |
| API-004 | `convertLeadAction` | ADMIN, STAFF | leadId, studentName, gradeLevel, studentEmail, studentPhone, parentName, parentPhone, parentEmail, classId | `ConvertState{ok, studentCode, credentials[]}` | xem §3 (UC-003 E1–E6) | `/quan-ly/lead/[id]`, `/quan-ly/lead` | FR-009 |
| API-005 | `login` (`server/auth/actions.ts`) | Khách | identifier, password | redirect theo vai trò / `/doi-mat-khau` | LOGIN_RATE_LIMITED, INVALID_CREDENTIALS, LOCKED, ACCOUNT_DISABLED (`values.identifier` được trả lại) | — | FR-010, 011 |
| API-006 | `logout` | Đã đăng nhập | — | redirect `/dang-nhap` | — | — | FR-010 |
| API-007 | `changePassword` | Đã đăng nhập (kể cả mustChange) | currentPassword, newPassword, confirm | redirect `<home>?thongbao=doi-mat-khau` | validate, WRONG_PASSWORD | — | FR-012 |
| API-008 | `createUserAction` / `updateUserAction` / `setUserStatusAction` / `resetPasswordAction` (`server/users/actions.ts`) | create: ADMIN, STAFF (HS/PH); còn lại ADMIN | fullName, email, phone, role, gradeLevel · userId, status | `CreateUserState` / `{ok}` / `ResetState` | NO_LOGIN, DUPLICATE_*, CANNOT_MODIFY_SELF, 404 | `/quan-ly/nguoi-dung[...]`, `/quan-ly/hoc-vien` | FR-013 |
| API-009 | `linkGuardianAction` / `unlinkGuardianAction` | ADMIN, STAFF | parentId, studentId | `{ok}` | INVALID, ALREADY_LINKED, MAX_GUARDIANS, 404 | `/quan-ly/hoc-vien`, `/quan-ly/nguoi-dung/[studentId]` | FR-014 |
| API-010 | `saveSubjectAction` / `saveCourseAction` / `deleteCourseAction` / `saveRoomAction` / `deleteRoomAction` (`server/catalog/actions.ts`) | ADMIN | trường của bảng (docs/10) | `{ok}` / redirect (tạo khóa, xóa khóa) | DUPLICATE_SLUG, HAS_CLASSES, DUPLICATE_NAME, IN_USE, INVALID | `/` (layout), `/quan-ly/phong` | FR-015, 016 |
| API-011 | `createClassAction` / `deleteClassAction` (`server/academic/actions.ts`) | ADMIN, STAFF | courseId, code, teacherId, roomId, startDate, weekdays[], startTime, endTime, totalSessions, capacity · classId | redirect `/quan-ly/lop/[id]?thongbao=tao-lop` / `/quan-ly/lop?thongbao=xoa-lop` | INVALID, CAPACITY_OVER_ROOM, SCHEDULE_CONFLICT (+details), DUPLICATE_CODE, HAS_ENROLLMENTS | `/quan-ly/lop` | FR-017, 018 |
| API-012 | `setClassStatusAction` | ADMIN, STAFF | classId, status | `{ok}` | INVALID_TRANSITION, 404 | `/quan-ly/lop/[id]` | FR-017 |
| API-013 | `enrollStudentsAction` / `setEnrollmentStatusAction` | ADMIN, STAFF | classId, studentIds[] (≤ 50) · enrollmentId, status | `{ok, "Đã ghi danh n học sinh."}` | CLASS_CLOSED, ALREADY_ENROLLED, CLASS_FULL, STUDENT_DISABLED, SCHEDULE_CONFLICT, INVALID_TRANSITION, STALE | `/quan-ly/lop/[id]` | FR-019, 020 |
| API-014 | `cancelSessionAction` / `rescheduleSessionAction` | ADMIN, STAFF | sessionId, reason · sessionId, date, startTime, endTime, reason | `{ok}` | INVALID_TRANSITION, SCHEDULE_CONFLICT, validate (tương lai) | `/quan-ly/lop/[id]` | FR-021 |
| API-015 | `saveAttendanceAction` (`server/attendance/actions.ts`) | TEACHER (own, trong khung), STAFF, ADMIN | sessionId, studentIds[] (≤ 200), `status:<id>`, `note:<id>`, reason | `{ok, "Đã lưu điểm danh n học sinh."}` | SESSION_CANCELLED, OUTSIDE_WINDOW, REASON_REQUIRED, EMPTY, 404 | `/giao-vien/buoi/[id]`, `/quan-ly/buoi/[id]`, `/quan-ly/lop/[classId]` | FR-023, 024 |
| API-016 | `createAssignmentAction` / `updateAssignmentAction` / `saveQuestionAction` / `deleteQuestionAction` (`server/assessment/actions.ts`) | TEACHER (GV chính) | classId/assignmentId, title, instructions, dueAt, allowLate · questionId, type, prompt, points, options (mỗi dòng), correctOption (1..6), acceptedAnswers (mỗi dòng) | redirect `/giao-vien/bai-tap/[id]?thongbao=tao-bai` / `{ok}` | NOT_DRAFT, INVALID_QUESTION, DUE_IN_PAST, 404 | `/giao-vien/bai-tap/[id]` | FR-027 |
| API-017 | `setAssignmentStatusAction` | TEACHER (GV chính) | assignmentId, status | `{ok}` | INVALID_TRANSITION, NO_QUESTIONS, DUE_IN_PAST | `/giao-vien/bai-tap/[id]` | FR-028 |
| API-018 | `studentAnswerAction` (intent = `draft` / `submit`) | STUDENT (ghi danh ACTIVE) | assignmentId, `answer:<questionId>` | `{ok, "Đã lưu nháp." / "Đã nộp bài…"}` | ALREADY_SUBMITTED, PAST_DUE, NOT_ACTIVE, CLOSED, 404 | `/hoc-sinh/bai-tap[/id]` | FR-029, 030 |
| API-019 | `gradeSubmissionAction` | TEACHER (GV chính) | submissionId, answerIds[], `points:<answerId>`, `feedback:<answerId>`, comment | `{ok, "Đã lưu điểm."}` | NOT_SUBMITTED, POINTS_OUT_OF_RANGE, 404 | `/giao-vien/bai-nop/[id]`, `/giao-vien/bai-tap/[id]/bai-nop` | FR-031, 033 |
| API-020 | `publishResultsAction` | TEACHER (GV chính) | assignmentId | `{ok, "Đã công bố kết quả…"}` | NOT_PUBLISHED, 404 | `/giao-vien/bai-tap/[id][/bai-nop]` | FR-032 |
| API-021 | `createLeadAction` (`server/leads/actions.ts`) | ADMIN, STAFF | source, parentName, phone, email, studentName, gradeLevel, subjectId, courseSlug, note | redirect `/quan-ly/lead/[id]?thongbao=tao-lead` | validate, INVALID_SUBJECT, DUPLICATE_OPEN_LEAD (+`existingLeadId`) | `/quan-ly/lead` | FR-006 |
| API-022 | `deleteSubjectAction` (`server/catalog/actions.ts`) | ADMIN | id | `{ok, "Đã xóa môn học."}` | HAS_COURSES, 404 | `/` (layout) | FR-015 |

## 5. Endpoint detail (các action có side effect quan trọng)

### API-001 — `submitTrialRequestAction`
- **Purpose:** FR-004/005. **Actor:** khách. **Preconditions:** không.
- **Validation:** docs/02 FR-004 (schema `trialRequestSchema`, `src/server/leads/schemas.ts`).
- **Thứ tự xử lý:** honeypot (redirect giả) → rate limit `trial:<ip>` → Zod → service (transaction tìm lead mở → RESUBMITTED hoặc tạo NEW + CREATED).
- **Side effects:** leads, lead_activities, rate_limit_buckets. **Idempotency:** gửi lại cùng SĐT trong khi lead còn mở chỉ thêm hoạt động (tự nhiên idempotent về số lead).
- **Logging:** không log nội dung form.
- **Tests:** TC-001..TC-004.

### API-004 — `convertLeadAction`
- **Purpose:** FR-009. **Actor:** ADMIN/STAFF.
- **Validation:** `convertLeadSchema` (SĐT HS ≠ SĐT PH; email HS ≠ email PH); `classId` tùy chọn ≤ 40.
- **Side effects:** một transaction (docs/07 §7): users ×1–2, guardianships, enrollments (tùy chọn), leads, lead_activities, audit_logs `lead.convert`.
- **Retry:** tự thử lại ≤ 3 lần khi va chạm `studentCode`.
- **Security:** mật khẩu tạm chỉ trong response; không lưu dạng rõ.
- **Tests:** TC-007, TC-008.

### API-005 — `login`
- **Thứ tự:** rate limit `login:<ip>` (BR-009) → Zod → tìm user → (không có: băm giả) → khóa tạm → mật khẩu → ACTIVE → reset bộ đếm → tạo phiên → redirect.
- **Response lỗi:** `{ok:false, message, values:{identifier}}` — không trả mật khẩu.
- **Tests:** TC-009, TC-010, TC-043, TC-046.

### API-013 — `enrollStudentsAction`
- **Semantics:** tuần tự, mỗi HS một transaction có `SELECT … FOR UPDATE` dòng lớp; dừng ở lỗi đầu tiên; các HS đã ghi danh trước đó giữ nguyên. Thông điệp nêu số đã ghi danh.
- **Tests:** TC-016, TC-017, TC-044.

### API-015 — `saveAttendanceAction`
- **Input mã hóa:** `studentIds` (lặp), `status:<studentId>` ∈ {PRESENT, LATE, ABSENT, EXCUSED} (thiếu → PRESENT), `note:<studentId>` ≤ 255, `reason` ≤ 255.
- **Server lọc:** chỉ HS có ghi danh ở lớp của buổi.
- **Audit:** ngoài khung (quản lý) → `attendance.override` {reason, before[], after[]}.
- **Tests:** TC-019, TC-020.

### API-018 — `studentAnswerAction`
- **Input:** `answer:<questionId>` (khóa ≤ 50 ký tự), `intent`. MCQ: chỉ số 0-based; ngoài phạm vi → bỏ trống. Độ dài: ESSAY ≤ 20.000, khác ≤ 500.
- **Submit:** `updateMany where id & status=IN_PROGRESS` → tự chấm từng câu → GRADED (+score) nếu không có tự luận.
- **Tests:** TC-026..TC-029, TC-032.

### API-019 — `gradeSubmissionAction`
- **Input:** `answerIds` (≤ 200) phải thuộc bài nộp (khác → 404); `points:<id>` chấp nhận dấu phẩy; trống = null (giữ autoPoints, trừ tự luận bắt buộc).
- **Audit:** nếu bài đã công bố → `grade.update_after_publish` {before{score, answers[{id, teacherPoints}]}, after{score, grades[]}}.
- **Tests:** TC-030, TC-031.

### API-021 — `createLeadAction` *(mới, phiên 3)*
- **Purpose:** FR-006 nhập tay. **Actor:** ADMIN/STAFF.
- **Validation:** `manualLeadSchema` — `source` ∈ {phone, walk_in, referral, other}; parentName 2–120; phone (BR-001); email tùy chọn; studentName 2–120; gradeLevel tùy chọn 1..12; subjectId tùy chọn (phải tồn tại); courseSlug tùy chọn (khóa đã xuất bản hoặc chưa đều được — Staff biết khóa nội bộ); note ≤ 1000.
- **Behavior:** transaction: tìm lead đang mở cùng SĐT → có: `DUPLICATE_OPEN_LEAD` + `existingLeadId`; không: tạo lead + hoạt động CREATED (actorId).
- **Không:** rate limit, honeypot, consent.
- **Tests:** TC-039, TC-040, TC-045.

### API-022 — `deleteSubjectAction` *(mới, phiên 3)*
- **Behavior:** `assertCan(catalog.manage)` → môn tồn tại (không: 404) → có khóa: `HAS_COURSES` → xóa (FK `leads.subjectId` SET NULL tự bỏ tham chiếu).
- **Tests:** TC-041.

## 6. Truy vấn đọc (Server Components → service)

Mọi truy vấn nội bộ nhận `actor` và áp cùng policy với action. Sai phạm vi → `ForbiddenError` → 404 qua `orNotFound`.

| Q | Hàm (file) | Quyền / phạm vi | Dùng ở | Phân trang |
|---|---|---|---|---|
| Q-001 | `listSubjectsWithCourses` (`catalog/public.ts`) | Công khai, chỉ môn có khóa xuất bản | SCREEN-001 | — |
| Q-002 | `listFeaturedCourses(3)` | Công khai | SCREEN-001 | 3 |
| Q-003 | `listPublishedCourses(filter)`, `listSubjects` | Công khai | SCREEN-002, 004, 009, 011 | — |
| Q-004 | `getPublishedCourse(slug)` | Công khai; null → 404 | SCREEN-003 | — |
| Q-005 | `listLeads(actor, filter)` | lead.manage | SCREEN-009 | 20 |
| Q-006 | `getLead(actor, id)` | lead.manage | SCREEN-010 | — |
| Q-007 | `leadCounts(actor)` | lead.manage | SCREEN-008 | — |
| Q-008 | `listClasses(actor, filter)` | quản lý: tất cả; GV: lớp mình; khác: 404 | SCREEN-012, 026 | — |
| Q-009 | `getClassForManager(actor, id)` | class.manage | SCREEN-014 | — |
| Q-010 | `listStudentsForEnrollment(actor, classId, q)` | enrollment.manage; HS ACTIVE chưa ghi danh | SCREEN-014 | 100 |
| Q-011 | `listEnrollableClasses(actor)` | enrollment.manage; OPEN/IN_PROGRESS còn chỗ | SCREEN-010 | — |
| Q-012 | `classFormOptions(actor)` | class.manage | SCREEN-013 | — |
| Q-013 | `listSessionsInRange(actor, from, to, studentId?)` | GV: buổi mình + lớp mình; HS: lớp ACTIVE/PAUSED; PH: con (bắt buộc `studentId` liên kết) | SCREEN-024, 025, 033, 034, 038 | khoảng tuần |
| Q-014 | `classCounts(actor)` | class.manage | SCREEN-008 | — |
| Q-015 | `getClassForTeacher(actor, id)` | GV chính hoặc dạy thay (`isOwner`) | SCREEN-027, 029 | — |
| Q-016 | `getSessionForAttendance(actor, id)` | quản lý hoặc GV chính/GV buổi | SCREEN-015, 028 | — |
| Q-017 | `listAbsenceAlerts(actor)` | quản lý: mọi lớp chạy; GV: lớp mình | SCREEN-008, 024, 027 | — |
| Q-018 | `getStudentAttendance(actor, studentId)` | `assertCanViewStudent`; GV chỉ lớp mình | SCREEN-037, 038 | — |
| Q-019 | `getAssignmentForTeacher(actor, id)` | GV chính; trả kèm `ungradedCount` | SCREEN-030 | — |
| Q-020 | `listClassAssignments(actor, classId)` | GV chính | SCREEN-027 | — |
| Q-021 | `listSubmissions(actor, assignmentId)` | GV chính | SCREEN-031 | — |
| Q-022 | `getSubmissionForGrading(actor, id)` | GV chính | SCREEN-032 | — |
| Q-023 | `getGradebook(actor, classId)` | GV chính | SCREEN-027 | — |
| Q-024 | `countPendingGrading(actor)` | GV; trả `{ total, items(≤ 20) }` | SCREEN-024 | 20 |
| Q-025 | `listMyAssignments(actor)` | HS; điểm chỉ khi BR-047 | SCREEN-033, 035 | — |
| Q-026 | `openAssignmentForStudent(actor, id)` | HS ghi danh; không đáp án trước BR-046; kết quả theo BR-047 | SCREEN-036 | — |
| Q-027 | `listPublishedResults(actor, studentId)` | `assertCanViewStudent`; chỉ GRADED + đã công bố | SCREEN-033, 037, 038 | — |
| Q-028 | `listUsers(actor, filter)` | user.manage | SCREEN-017 | 25 |
| Q-029 | `getUser(actor, id)` | user.manage | SCREEN-018 | — |
| Q-030 | `listLearners(actor, q, page)` | guardian.manage | SCREEN-016 | 25 |
| Q-031 | `listParents(actor)` | guardian.manage; PH ACTIVE | SCREEN-016 | 500 |
| Q-032 | `listMyChildren(actor)` | PARENT; con ACTIVE | SCREEN-038 | — |
| Q-033 | `listSubjectsAdmin`, `listCoursesAdmin`, `getCourseAdmin`, `listRoomsAdmin` (`catalog/admin.ts`) | catalog.manage / room.manage | SCREEN-019..022 | — |
| Q-034 | `listAuditLogs(actor, filter)` (`audit/queries.ts`) | audit.read | SCREEN-023 | 50 |

## 7. Cross-cutting

| Chủ đề | Quy tắc |
|---|---|
| Pagination | `?page=` 1..10.000 (`parsePage`), skip/take; giữ tham số lọc |
| Filtering | Query GET đã kiểm (enum hợp lệ, id tồn tại trong danh sách, độ dài ≤ 100) |
| Upload | Không có (Pha 1) |
| Webhook | Không có |
| CORS | Không áp dụng (cùng origin) |
| Deprecation | Không áp dụng |
| Pha 2 (proposed) | REST `/api/v1/*` bằng Route Handlers dùng lại `src/server/**` (ADR-003) |
