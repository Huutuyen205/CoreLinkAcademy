// Theo dõi chuyên cần theo lớp (Admin §11 "Theo dõi tình hình điểm danh", "Xem lịch sử chuyên cần theo học sinh/lớp").
// Bảng: hàng = học sinh của lớp, cột = buổi đã điểm danh trong khoảng thời gian; kèm số buổi có mặt/muộn/vắng/có phép và tỷ lệ (BR-032).
import type { AttendanceStatus } from "@prisma/client";
import { assertCan } from "@/server/auth/policy";
import { canTeacherAccessClass, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import { attendanceRate } from "./rules";

export type AttendanceCounts = Record<AttendanceStatus, number>;

export function emptyCounts(): AttendanceCounts {
  return { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 };
}

/** Đếm theo trạng thái (hàm thuần) — dùng chung cho HS/PH (số buổi có mặt, vắng, đi muộn). */
export function countStatuses(records: { status: AttendanceStatus; sessionCancelled?: boolean }[]): AttendanceCounts {
  const c = emptyCounts();
  for (const r of records) if (!r.sessionCancelled) c[r.status] += 1;
  return c;
}

export async function classAttendanceSheet(actor: Actor, classId: string, range: { from?: Date; to?: Date } = {}) {
  const klass = await db.class.findUnique({ where: { id: classId }, select: { id: true, code: true, teacherId: true, course: { select: { title: true } } } });
  if (!klass) throw new ForbiddenError();
  if (!isManager(actor) && !(actor.role === "TEACHER" && canTeacherAccessClass(actor.id, { teacherId: klass.teacherId, sessionTeacherIds: [] }))) throw new ForbiddenError();
  const [sessions, enrollments] = await Promise.all([
    db.classSession.findMany({
      where: {
        classId,
        status: { not: "CANCELLED" },
        attendances: { some: {} },
        ...(range.from || range.to ? { startsAt: { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lt: range.to } : {}) } } : {}),
      },
      orderBy: { startsAt: "asc" },
      select: { id: true, index: true, startsAt: true, attendances: { select: { studentId: true, status: true, note: true } } },
    }),
    db.enrollment.findMany({ where: { classId }, orderBy: { student: { fullName: "asc" } }, select: { status: true, student: { select: { id: true, fullName: true, studentCode: true } } } }),
  ]);
  const rows = enrollments.map((e) => {
    const cells = sessions.map((s) => s.attendances.find((a) => a.studentId === e.student.id) ?? null);
    const records = cells.filter((c): c is NonNullable<typeof c> => c !== null);
    return { student: e.student, enrollmentStatus: e.status, cells, counts: countStatuses(records), rate: attendanceRate(records) };
  });
  return { klass, sessions: sessions.map((s) => ({ id: s.id, index: s.index, startsAt: s.startsAt })), rows };
}

/** Lớp chọn được ở trang theo dõi chuyên cần. */
export async function trackingClassOptions(actor: Actor) {
  assertCan(actor, "report.view");
  return db.class.findMany({ orderBy: [{ status: "asc" }, { code: "asc" }], select: { id: true, code: true, status: true, course: { select: { title: true } } } });
}
