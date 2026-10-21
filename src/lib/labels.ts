// Nhãn tiếng Việt + tông màu cho các trạng thái (docs/08 §6). Luôn hiển thị kèm chữ.
import type {
  AssignmentStatus,
  AttendanceStatus,
  ClassStatus,
  EnrollmentStatus,
  LeadStatus,
  QuestionType,
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

export const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Lớp ${i + 1}` }));
