// Điểm danh (UC-007) và chuyên cần (FR-025, FR-026).
import type { AttendanceStatus, Prisma } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCanViewStudent, canTeacherAccessClass, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { attendanceRate, checkAttendanceEdit, consecutiveAbsentees, isInAttendanceWindow } from "./rules";

export type AttendanceEntry = { studentId: string; status: AttendanceStatus; note: string | null };

async function loadSession(actor: Actor, sessionId: string) {
  const session = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: { select: { id: true, code: true, teacherId: true, course: { select: { title: true } } } },
      room: { select: { name: true } },
      teacher: { select: { fullName: true } },
      attendances: { include: { markedBy: { select: { fullName: true } } } },
    },
  });
  if (!session) throw new ForbiddenError();
  const allowed =
    isManager(actor) ||
    (actor.role === "TEACHER" && canTeacherAccessClass(actor.id, { teacherId: session.class.teacherId, sessionTeacherIds: [session.teacherId] }));
  if (!allowed) throw new ForbiddenError();
  return session;
}

/** Dữ liệu màn hình điểm danh: danh sách HS ghi danh ACTIVE + bản ghi đã có. */
export async function getSessionForAttendance(actor: Actor, sessionId: string) {
  const session = await loadSession(actor, sessionId);
  const enrollments = await db.enrollment.findMany({
    where: { classId: session.classId, OR: [{ status: "ACTIVE" }, { studentId: { in: session.attendances.map((a) => a.studentId) } }] },
    orderBy: { student: { fullName: "asc" } },
    select: { status: true, student: { select: { id: true, fullName: true, studentCode: true } } },
  });
  const now = new Date();
  const inWindow = isInAttendanceWindow(session, now);
  const check = checkAttendanceEdit({ role: actor.role, sessionStatus: session.status, inWindow, reason: "x" });
  const byStudent = new Map(session.attendances.map((a) => [a.studentId, a]));
  return {
    session,
    inWindow,
    canEdit: check.error === null,
    needsReason: check.error === null && check.override,
    roster: enrollments.map((e) => ({ ...e.student, enrollmentStatus: e.status, record: byStudent.get(e.student.id) ?? null })),
  };
}

/** API-015 — FR-023, FR-024: upsert theo (sessionId, studentId); ngoài khung ghi audit trước/sau. */
export async function saveAttendance(actor: Actor, sessionId: string, entries: AttendanceEntry[], reason: string | null) {
  const session = await loadSession(actor, sessionId);
  const now = new Date();
  const check = checkAttendanceEdit({ role: actor.role, sessionStatus: session.status, inWindow: isInAttendanceWindow(session, now), reason });
  if (check.error) {
    const messages = {
      SESSION_CANCELLED: "Buổi học đã bị hủy, không điểm danh được.",
      OUTSIDE_WINDOW: "Đã hết thời gian điểm danh của giáo viên. Liên hệ giáo vụ để sửa.",
      REASON_REQUIRED: "Sửa điểm danh ngoài khung thời gian cần nhập lý do.",
      FORBIDDEN: "Bạn không có quyền điểm danh.",
    } as const;
    throw new DomainError(check.error, messages[check.error], check.error === "REASON_REQUIRED" ? { reason: messages.REASON_REQUIRED } : undefined);
  }

  // Chỉ nhận học sinh thuộc lớp (không tin danh sách gửi lên).
  const allowedIds = new Set(
    (await db.enrollment.findMany({ where: { classId: session.classId }, select: { studentId: true } })).map((e) => e.studentId),
  );
  const valid = entries.filter((e) => allowedIds.has(e.studentId));
  if (valid.length === 0) throw new DomainError("EMPTY", "Không có học sinh nào để điểm danh.");

  const before = session.attendances.map((a) => ({ studentId: a.studentId, status: a.status, note: a.note }));
  await db.$transaction(async (tx) => {
    for (const e of valid) {
      await tx.attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId: e.studentId } },
        update: { status: e.status, note: e.note, markedById: actor.id, markedAt: now },
        create: { sessionId, studentId: e.studentId, status: e.status, note: e.note, markedById: actor.id, markedAt: now },
      });
    }
    if (session.status === "SCHEDULED" && now > session.endsAt) {
      await tx.classSession.update({ where: { id: sessionId }, data: { status: "COMPLETED" } });
    }
    if (check.override) {
      await writeAudit(
        {
          actorId: actor.id,
          action: "attendance.override",
          entity: "ClassSession",
          entityId: sessionId,
          detail: { reason: reason!.trim(), before, after: valid } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );
    }
  });
  return { classId: session.classId, count: valid.length };
}

/** FR-026: cảnh báo vắng 2 buổi liên tiếp, theo phạm vi (quản lý: mọi lớp đang chạy; GV: lớp mình). */
export async function listAbsenceAlerts(actor: Actor) {
  if (!isManager(actor) && actor.role !== "TEACHER") throw new ForbiddenError();
  const classes = await db.class.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] }, ...(actor.role === "TEACHER" ? { teacherId: actor.id } : {}) },
    select: {
      id: true,
      code: true,
      sessions: {
        where: { status: { not: "CANCELLED" }, attendances: { some: {} } },
        orderBy: { startsAt: "desc" },
        take: 2,
        select: { status: true, attendances: { select: { studentId: true, status: true } } },
      },
    },
  });
  const alerts: { classId: string; classCode: string; studentIds: string[] }[] = [];
  for (const c of classes) {
    const ids = consecutiveAbsentees(c.sessions.map((s) => ({ cancelled: s.status === "CANCELLED", records: s.attendances })));
    if (ids.length > 0) alerts.push({ classId: c.id, classCode: c.code, studentIds: ids });
  }
  const names = new Map(
    (await db.user.findMany({ where: { id: { in: alerts.flatMap((a) => a.studentIds) } }, select: { id: true, fullName: true } })).map((u) => [u.id, u.fullName]),
  );
  return alerts.flatMap((a) => a.studentIds.map((id) => ({ classId: a.classId, classCode: a.classCode, studentId: id, studentName: names.get(id) ?? "—" })));
}

/** FR-025: lịch sử và tỷ lệ chuyên cần của một học sinh (chính mình / con / quản lý / GV của lớp). */
export async function getStudentAttendance(actor: Actor, studentId: string) {
  await assertCanViewStudent(actor, studentId);
  const records = await db.attendance.findMany({
    where: { studentId, ...(actor.role === "TEACHER" ? { session: { class: { teacherId: actor.id } } } : {}) },
    orderBy: { session: { startsAt: "desc" } },
    select: {
      id: true,
      status: true,
      note: true,
      session: { select: { startsAt: true, status: true, index: true, class: { select: { id: true, code: true, course: { select: { title: true } } } } } },
    },
  });
  const rows = records.map((r) => ({ ...r, sessionCancelled: r.session.status === "CANCELLED" }));
  const byClass = new Map<string, { code: string; title: string; rows: typeof rows }>();
  for (const r of rows) {
    const c = r.session.class;
    if (!byClass.has(c.id)) byClass.set(c.id, { code: c.code, title: c.course.title, rows: [] });
    byClass.get(c.id)!.rows.push(r);
  }
  return {
    rate: attendanceRate(rows),
    records: rows,
    classes: [...byClass.entries()].map(([id, v]) => ({ id, code: v.code, title: v.title, rate: attendanceRate(v.rows), total: v.rows.length })),
  };
}
