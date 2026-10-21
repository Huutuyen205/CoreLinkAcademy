// Quy tắc thuần của lớp/ghi danh/buổi (BR-020, BR-022, máy trạng thái docs/06 §2).
import type { ClassStatus, EnrollmentStatus } from "@prisma/client";

/** BR-020: sĩ số = ACTIVE + PAUSED. */
export const SEAT_STATUSES: EnrollmentStatus[] = ["ACTIVE", "PAUSED"];

export type EnrollError = "CLASS_CLOSED" | "ALREADY_ENROLLED" | "CLASS_FULL";

export function checkEnrollment(input: {
  classStatus: ClassStatus;
  seatCount: number;
  capacity: number;
  existingStatus: EnrollmentStatus | null;
}): EnrollError | null {
  if (input.classStatus === "COMPLETED" || input.classStatus === "CANCELLED") return "CLASS_CLOSED";
  if (input.existingStatus && input.existingStatus !== "DROPPED") return "ALREADY_ENROLLED";
  if (input.seatCount >= input.capacity) return "CLASS_FULL";
  return null;
}

export const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  ACTIVE: ["PAUSED", "DROPPED", "COMPLETED"],
  PAUSED: ["ACTIVE", "DROPPED"],
  DROPPED: [],
  COMPLETED: [],
};

export function canChangeEnrollment(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
  return ENROLLMENT_TRANSITIONS[from].includes(to);
}

export const CLASS_TRANSITIONS: Record<ClassStatus, ClassStatus[]> = {
  OPEN: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canChangeClass(from: ClassStatus, to: ClassStatus): boolean {
  return CLASS_TRANSITIONS[from].includes(to);
}

export const ENROLL_ERROR_MESSAGES: Record<EnrollError | "SCHEDULE_CONFLICT", string> = {
  CLASS_CLOSED: "Lớp đã kết thúc hoặc đã hủy, không ghi danh thêm được.",
  ALREADY_ENROLLED: "Học sinh đã ghi danh lớp này.",
  CLASS_FULL: "Lớp đã đủ sĩ số.",
  SCHEDULE_CONFLICT: "Lịch lớp trùng với lớp khác học sinh đang học.",
};
