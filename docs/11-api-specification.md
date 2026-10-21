# 11 — Đặc tả API (Server Actions)

Pha 1 không có REST API công khai. Các "endpoint" là **Server Actions** (POST do Next.js sinh ra), được gọi từ form. Next.js kiểm tra header `Origin` để chặn CSRF. Mỗi action: (1) lấy phiên (`requireRole`), (2) parse Zod (`parseForm`), (3) gọi service có kiểm quyền trong `runAction` (DomainError → thông báo, ForbiddenError → 404), (4) trả `ActionState` hoặc `redirect`. Khung chung: `src/server/action.ts`.

```ts
type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  details?: string[];              // vd. danh sách buổi trùng lịch (FR-018)
  values?: Record<string, string>; // giá trị đã gửi để điền lại form khi lỗi (React 19 reset form sau action)
};
```

| ID | Action (file) | Quyền | Input chính | Kết quả / lỗi | FR |
|---|---|---|---|---|---|
| API-001 | `submitTrialRequestAction` (server/leads/actions) | Khách | parentName, phone, email?, studentName, gradeLevel, subjectId, courseSlug?, note?, consent, website (honeypot) | redirect `/dang-ky-hoc-thu/cam-on`; lỗi: fieldErrors, RATE_LIMITED | FR-004, FR-005 |
| API-002 | `changeLeadStatusAction` | STAFF, ADMIN | leadId, status, lostReason? | INVALID_TRANSITION, LOST_REASON_REQUIRED | FR-007 |
| API-003 | `addLeadNoteAction` | STAFF, ADMIN | leadId, content | — | FR-008 |
| API-004 | `convertLeadAction` | STAFF, ADMIN | leadId, studentName, gradeLevel, parentName, studentEmail?, studentPhone?, parentPhone, parentEmail?, classId? | hiển thị mật khẩu tạm; PHONE_TAKEN_BY_OTHER_ROLE, CLASS_FULL, SCHEDULE_CONFLICT | FR-009 |
| API-005 | `login` (server/auth/actions) | Khách | identifier, password | redirect theo vai trò; INVALID_CREDENTIALS, LOCKED | FR-010, FR-011 |
| API-006 | `logout` | Đã đăng nhập | — | redirect `/dang-nhap` | FR-010 |
| API-007 | `changePassword` | Đã đăng nhập | currentPassword, newPassword, confirm | WRONG_PASSWORD, WEAK_PASSWORD | FR-012 |
| API-008 | `createUserAction` / `updateUserAction` / `resetPasswordAction` / `setUserStatusAction` (server/users/actions) | ADMIN (STAFF: tạo STUDENT/PARENT) | fullName, email?, phone?, role, gradeLevel? | DUPLICATE_EMAIL, DUPLICATE_PHONE, CANNOT_MODIFY_SELF | FR-013 |
| API-009 | `linkGuardianAction` / `unlinkGuardianAction` | ADMIN, STAFF | parentId, studentId | MAX_GUARDIANS | FR-014 |
| API-010 | `saveSubjectAction` / `saveCourseAction` / `deleteCourseAction` / `saveRoomAction` / `deleteRoomAction` (server/catalog/actions) | ADMIN | các trường của bảng | DUPLICATE_SLUG | FR-015, FR-016 |
| API-011 | `createClassAction` / `deleteClassAction` (server/academic/actions) | STAFF, ADMIN | courseId, code, teacherId, roomId?, startDate, weekdays[], startTime, endTime, totalSessions, capacity | SCHEDULE_CONFLICT (kèm danh sách) | FR-017, FR-018 |
| API-012 | `setClassStatusAction` | STAFF, ADMIN | classId, status | INVALID_TRANSITION | FR-017 |
| API-013 | `enrollStudentsAction` (nhiều HS) / `setEnrollmentStatusAction` | STAFF, ADMIN | classId, studentId / enrollmentId, status | CLASS_FULL, ALREADY_ENROLLED, SCHEDULE_CONFLICT, CLASS_CLOSED | FR-019, FR-020 |
| API-014 | `cancelSessionAction` / `rescheduleSessionAction` | STAFF, ADMIN | sessionId, reason / date, startTime, endTime, reason | SCHEDULE_CONFLICT | FR-021 |
| API-015 | `saveAttendanceAction` (server/attendance/actions) | TEACHER (own, trong khung); STAFF, ADMIN | sessionId, studentIds[], status:<id>, note:<id>, reason? | OUTSIDE_WINDOW, REASON_REQUIRED, SESSION_CANCELLED | FR-023, FR-024 |
| API-016 | `createAssignmentAction` / `updateAssignmentAction` / `saveQuestionAction` / `deleteQuestionAction` (server/assessment/actions) | TEACHER own | title, instructions, dueAt, allowLate; question fields | NOT_DRAFT | FR-027 |
| API-017 | `setAssignmentStatusAction` | TEACHER own | assignmentId, status | NO_QUESTIONS, DUE_IN_PAST | FR-028 |
| API-018 | `studentAnswerAction` (intent = draft / submit) | STUDENT (ghi danh ACTIVE) | assignmentId, answer:<questionId>, intent | ALREADY_SUBMITTED, PAST_DUE | FR-029, FR-030 |
| API-019 | `gradeSubmissionAction` | TEACHER own | submissionId, answerIds[], points:<answerId>, feedback:<answerId>, comment | POINTS_OUT_OF_RANGE | FR-031 |
| API-020 | `publishResultsAction` | TEACHER own | assignmentId | NOT_PUBLISHED | FR-032 |

Các trang đọc dữ liệu (Server Components) gọi service `get*/list*` với actor hiện tại, áp cùng policy. Không có đọc dữ liệu nào bỏ qua policy.

Pha 2 (proposed): REST `/api/v1/*` bằng Route Handlers dùng lại `src/server/**` cho app di động/tích hợp.
