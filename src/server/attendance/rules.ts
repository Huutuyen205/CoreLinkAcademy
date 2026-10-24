// Quy tắc điểm danh thuần (BR-030..BR-033).
import type { AttendanceStatus, Role } from "@prisma/client";

const BEFORE_MS = 30 * 60_000;
const AFTER_MS = 24 * 3_600_000;

/** BR-030: khung điểm danh của giáo viên [startsAt − 30 phút, endsAt + 24 giờ]. */
export function isInAttendanceWindow(session: { startsAt: Date; endsAt: Date }, now: Date): boolean {
  const t = now.getTime();
  return t >= session.startsAt.getTime() - BEFORE_MS && t <= session.endsAt.getTime() + AFTER_MS;
}

export type AttendanceEditError = "SESSION_CANCELLED" | "OUTSIDE_WINDOW" | "REASON_REQUIRED" | "FORBIDDEN";

/** BR-030, BR-031: ai được ghi điểm danh, khi nào cần lý do. Trả mã lỗi hoặc `{ override }`. */
export function checkAttendanceEdit(input: {
  role: Role;
  sessionStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  inWindow: boolean;
  reason?: string | null;
}): { error: AttendanceEditError } | { error: null; override: boolean } {
  if (input.sessionStatus === "CANCELLED") return { error: "SESSION_CANCELLED" };
  if (input.role === "TEACHER") return input.inWindow ? { error: null, override: false } : { error: "OUTSIDE_WINDOW" };
  if (input.role === "ADMIN") {
    if (input.inWindow) return { error: null, override: false };
    return input.reason?.trim() ? { error: null, override: true } : { error: "REASON_REQUIRED" };
  }
  return { error: "FORBIDDEN" };
}

export type SessionEvaluationError = "SESSION_CANCELLED" | "NOT_STARTED" | "OUTSIDE_WINDOW" | "FORBIDDEN";

/**
 * Đánh giá học sinh (thái độ + nhận xét) ghi riêng sau điểm danh: từ lúc buổi bắt đầu — thường là cuối buổi —
 * đến hết khung điểm danh của giáo viên; quản lý sửa được về sau. Không cần lý do vì không đổi chuyên cần.
 */
export function checkSessionEvaluation(input: {
  role: Role;
  sessionStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  session: { startsAt: Date; endsAt: Date };
  now: Date;
}): SessionEvaluationError | null {
  if (input.sessionStatus === "CANCELLED") return "SESSION_CANCELLED";
  if (input.now.getTime() < input.session.startsAt.getTime()) return "NOT_STARTED";
  if (input.role === "ADMIN" || input.role === "STAFF") return null;
  if (input.role !== "TEACHER") return "FORBIDDEN";
  return isInAttendanceWindow(input.session, input.now) ? null : "OUTSIDE_WINDOW";
}

/** BR-032: (PRESENT + LATE) / số bản ghi của các buổi không bị hủy. null khi chưa có bản ghi. */
export function attendanceRate(records: { status: AttendanceStatus; sessionCancelled?: boolean }[]): number | null {
  const counted = records.filter((r) => !r.sessionCancelled);
  if (counted.length === 0) return null;
  const ok = counted.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return ok / counted.length;
}

export function formatRate(rate: number | null): string {
  return rate === null ? "Chưa có dữ liệu" : `${Math.round(rate * 100)}%`;
}

/** Điểm danh đầu giờ chỉ ghi trạng thái + ghi chú; thái độ/nhận xét ghi riêng cuối buổi (`saveEvaluations`). */
export type AttendanceWrite = { studentId: string; status: AttendanceStatus; note: string | null };

/**
 * Kế hoạch ghi điểm danh theo lô: bản ghi mới → `toCreate`; bản ghi đã có → `updateGroups` gộp theo (trạng thái, ghi chú)
 * để mỗi nhóm là một `updateMany`. Trùng studentId trong cùng lần gửi: lấy lần cuối (như vòng upsert tuần tự).
 */
export function planAttendanceWrites(entries: AttendanceWrite[], existingStudentIds: Iterable<string>) {
  const existing = new Set(existingStudentIds);
  const latest = new Map(entries.map((e) => [e.studentId, e]));
  const toCreate: AttendanceWrite[] = [];
  const groups = new Map<string, { status: AttendanceStatus; note: string | null; studentIds: string[] }>();
  for (const e of latest.values()) {
    if (!existing.has(e.studentId)) {
      toCreate.push(e);
      continue;
    }
    const key = JSON.stringify([e.status, e.note]);
    const group = groups.get(key) ?? { status: e.status, note: e.note, studentIds: [] };
    group.studentIds.push(e.studentId);
    groups.set(key, group);
  }
  return { toCreate, updateGroups: [...groups.values()] };
}

/**
 * BR-033: học sinh có 2 buổi đã điểm danh gần nhất (không hủy) của cùng lớp đều ABSENT.
 * `sessions` là các buổi đã điểm danh của MỘT lớp, mới nhất trước.
 */
export function consecutiveAbsentees(sessions: { cancelled: boolean; records: { studentId: string; status: AttendanceStatus }[] }[]): string[] {
  const last2 = sessions.filter((s) => !s.cancelled && s.records.length > 0).slice(0, 2);
  if (last2.length < 2) return [];
  const absentIn = (i: number) => new Set(last2[i]!.records.filter((r) => r.status === "ABSENT").map((r) => r.studentId));
  const a = absentIn(0);
  const b = absentIn(1);
  return [...a].filter((id) => b.has(id));
}
