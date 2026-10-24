// Nhãn tiếng Việt + tông màu cho các trạng thái (docs/08 §6). Luôn hiển thị kèm chữ.
import type {
  AnnouncementAudience,
  AssignmentStatus,
  AttendanceStatus,
  ClassStatus,
  DocumentKind,
  EnrollmentStatus,
  EvaluationStatus,
  LeadStatus,
  PracticeDifficulty,
  MemberStatus,
  QuestionType,
  RequestStatus,
  Role,
  ScheduleRequestType,
  SessionStatus,
  SubmissionStatus,
  UserStatus,
} from "@prisma/client";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
type Labeled = { label: string; tone: Tone };

export const LEAD_STATUS: Record<LeadStatus, Labeled> = {
  NEW: { label: "Mới", tone: "primary" },
  CONTACTED: { label: "Đã liên hệ", tone: "neutral" },
  TRIAL_SCHEDULED: { label: "Đã hẹn học thử", tone: "neutral" },
  TRIAL_DONE: { label: "Đã học thử", tone: "neutral" },
  ENROLLED: { label: "Đã nhập học", tone: "success" },
  LOST: { label: "Không theo học", tone: "danger" },
};

export const CLASS_STATUS: Record<ClassStatus, Labeled> = {
  OPEN: { label: "Đang tuyển", tone: "primary" },
  IN_PROGRESS: { label: "Đang học", tone: "success" },
  COMPLETED: { label: "Đã kết thúc", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export const SESSION_STATUS: Record<SessionStatus, Labeled> = {
  SCHEDULED: { label: "Theo lịch", tone: "primary" },
  COMPLETED: { label: "Đã học", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, Labeled> = {
  ACTIVE: { label: "Đang học", tone: "success" },
  PAUSED: { label: "Bảo lưu", tone: "warning" },
  DROPPED: { label: "Đã nghỉ", tone: "danger" },
  COMPLETED: { label: "Hoàn thành", tone: "neutral" },
};

export const ATTENDANCE_STATUS: Record<AttendanceStatus, Labeled> = {
  PRESENT: { label: "Có mặt", tone: "success" },
  LATE: { label: "Muộn", tone: "warning" },
  ABSENT: { label: "Vắng", tone: "danger" },
  EXCUSED: { label: "Có phép", tone: "neutral" },
};

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, Labeled> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  PUBLISHED: { label: "Đang giao", tone: "primary" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
};

export const SUBMISSION_STATUS: Record<SubmissionStatus, Labeled> = {
  IN_PROGRESS: { label: "Đang làm", tone: "warning" },
  SUBMITTED: { label: "Chờ chấm", tone: "primary" },
  GRADED: { label: "Đã chấm", tone: "success" },
};

export const QUESTION_TYPE: Record<QuestionType, string> = {
  MCQ: "Trắc nghiệm",
  SHORT: "Trả lời ngắn",
  ESSAY: "Tự luận",
};

export const USER_STATUS: Record<UserStatus, Labeled> = {
  ACTIVE: { label: "Hoạt động", tone: "success" },
  DISABLED: { label: "Đã khóa", tone: "danger" },
};

/** BR-012: nguồn lead do Staff nhập tay (`web_form` chỉ dành cho form công khai). */
export const MANUAL_LEAD_SOURCES = ["phone", "walk_in", "referral", "other"] as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  web_form: "Form website",
  phone: "Gọi điện",
  walk_in: "Đến trực tiếp",
  referral: "Được giới thiệu",
  other: "Khác",
};

export const GRADE_OPTIONS =Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Lớp ${i + 1}` }));

/* ───────────── Nhãn cho tính năng bổ sung (FR-036..FR-052) ───────────── */


/** Trạng thái hồ sơ: chữ khác nhau theo vai trò. */
export function memberStatusLabel(role: Role, status: MemberStatus): Labeled {
  const learner = role === "STUDENT";
  const map: Record<MemberStatus, Labeled> = {
    ACTIVE: { label: learner ? "Đang học" : role === "TEACHER" ? "Đang dạy" : "Hoạt động", tone: "success" },
    ON_LEAVE: { label: learner ? "Bảo lưu" : "Tạm nghỉ", tone: "warning" },
    INACTIVE: { label: learner ? "Đã nghỉ học" : "Đã nghỉ", tone: "neutral" },
  };
  return map[status];
}

export const REQUEST_STATUS: Record<RequestStatus, Labeled> = {
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "danger" },
  CANCELLED: { label: "Đã rút", tone: "neutral" },
};

export const SCHEDULE_REQUEST_TYPE: Record<ScheduleRequestType, string> = {
  LEAVE: "Xin nghỉ buổi dạy",
  RESCHEDULE: "Đề xuất dời buổi",
};

export const DOCUMENT_KIND: Record<DocumentKind, string> = {
  CURRICULUM: "Giáo trình",
  MATERIAL: "Tài liệu học tập",
  LESSON_PLAN: "Giáo án",
};

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  ALL: "Tất cả người dùng",
  STAFF: "Quản trị viên",
  TEACHERS: "Toàn bộ giáo viên",
  STUDENTS: "Toàn bộ học sinh",
  PARENTS: "Toàn bộ phụ huynh",
  CLASS: "Một lớp (GV, HS, PH của lớp)",
  USERS: "Chọn từng người nhận",
};

export const EVALUATION_STATUS: Record<EvaluationStatus, Labeled> = {
  DRAFT: { label: "Nháp", tone: "neutral" },
  SENT: { label: "Đã gửi", tone: "success" },
};

export const PRACTICE_DIFFICULTY: Record<PracticeDifficulty, Labeled> = {
  EASY: { label: "Dễ", tone: "success" },
  MEDIUM: { label: "Trung bình", tone: "primary" },
  HARD: { label: "Khó", tone: "danger" },
};

/** Thái độ học tập ghi khi điểm danh (GV §6, giả định). */
export const ATTITUDE: Record<string, Labeled> = {
  GOOD: { label: "Tích cực", tone: "success" },
  NORMAL: { label: "Bình thường", tone: "neutral" },
  NEEDS_WORK: { label: "Cần cố gắng", tone: "warning" },
};
export const ATTITUDE_VALUES = ["GOOD", "NORMAL", "NEEDS_WORK"] as const;

/** Nhóm loại thông báo để lọc hộp thư (Admin §12, HS §7). */
export const NOTIFICATION_GROUPS: { key: string; label: string; kinds: string[] }[] = [
  { key: "bai-tap", label: "Bài tập", kinds: ["assignment", "test", "due_soon", "overdue", "resubmit", "results", "grade_update", "solution", "reminder", "submission"] },
  { key: "lich", label: "Lịch học", kinds: ["schedule_change", "schedule_reminder", "session_soon", "attendance", "schedule_request", "request_result", "lesson"] },
  { key: "don", label: "Đơn từ", kinds: ["leave_request", "leave_result", "review", "lead_new"] },
  { key: "hoc-tap", label: "Kết quả & tài liệu", kinds: ["evaluation", "document"] },
  { key: "trung-tam", label: "Từ trung tâm", kinds: ["announcement"] },
];
