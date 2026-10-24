// Điểm danh (UC-007) và chuyên cần (FR-025, FR-026).
import { Prisma, type AttendanceStatus } from "@prisma/client";
import { writeAudit } from "@/server/audit/log";
import { assertCanViewStudent, canTeacherAccessClass, isManager } from "@/server/auth/scope";
import type { Actor } from "@/server/auth/session";
import { db } from "@/server/db";
import { DomainError, ForbiddenError } from "@/server/errors";
import { attendanceRate, checkAttendanceEdit, consecutiveAbsentees, isInAttendanceWindow, planAttendanceWrites } from "./rules";

export type AttendanceEntry = { studentId: string; status: AttendanceStatus; note: string | null; attitude?: string | null };

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
      OUTSIDE_WINDOW: "Đã hết thời gian điểm danh của giáo viên. Liên hệ trung tâm (quản trị viên) để sửa.",
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

  // Ghi theo lô thay cho một upsert/học sinh (16 HS = 16 round-trip trong transaction trước đây):
  // thường chỉ còn 1 createMany (lần đầu) hoặc 1–2 updateMany (sửa lại).
  const { toCreate, updateGroups } = planAttendanceWrites(valid, session.attendances.map((a) => a.studentId));

  const before = session.attendances.map((a) => ({ studentId: a.studentId, status: a.status, note: a.note }));
  await db.$transaction(async (tx) => {
    for (const g of updateGroups) {
      await tx.attendance.updateMany({
        where: { sessionId, studentId: { in: g.studentIds } },
        data: { status: g.status, note: g.note, attitude: g.attitude, markedById: actor.id, markedAt: now },
      });
    }
    if (toCreate.length > 0) {
      const created = await tx.attendance.createMany({
        data: toCreate.map((e) => ({ sessionId, studentId: e.studentId, status: e.status, note: e.note, attitude: e.attitude ?? null, markedById: actor.id, markedAt: now })),
        skipDuplicates: true,
      });
      // Hiếm: người khác vừa điểm danh cùng buổi → một số dòng đã tồn tại và bị bỏ qua; ghi đè như upsert cũ.
      if (created.count < toCreate.length) {
        for (const e of toCreate) {
          await tx.attendance.upsert({
            where: { sessionId_studentId: { sessionId, studentId: e.studentId } },
            update: { status: e.status, note: e.note, attitude: e.attitude ?? null, markedById: actor.id, markedAt: now },
            create: { sessionId, studentId: e.studentId, status: e.status, note: e.note, attitude: e.attitude ?? null, markedById: actor.id, markedAt: now },
          });
        }
      }
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

type AlertRow = { classId: string; classCode: string; rn: bigint; studentId: string; status: AttendanceStatus; studentName: string };

/**
 * FR-026: cảnh báo vắng 2 buổi liên tiếp, theo phạm vi (quản lý: mọi lớp đang chạy; GV: lớp mình).
 * MỘT query: 2 buổi đã điểm danh gần nhất của mỗi lớp (ROW_NUMBER) + bản ghi điểm danh + tên học sinh.
 * Trước đây: lớp → buổi → điểm danh → tên = 4 query và Prisma tải hết buổi của lớp rồi mới cắt 2 trong bộ nhớ.
 * Quy tắc BR-033 vẫn do `consecutiveAbsentees` quyết định.
 */
export async function listAbsenceAlerts(actor: Actor) {
  if (!isManager(actor) && actor.role !== "TEACHER") throw new ForbiddenError();
  const teacherFilter = actor.role === "TEACHER" ? Prisma.sql`AND c."teacherId" = ${actor.id}` : Prisma.empty;
  const rows = await db.$queryRaw<AlertRow[]>(Prisma.sql`
    WITH recent AS (
      SELECT s."id", s."classId", ROW_NUMBER() OVER (PARTITION BY s."classId" ORDER BY s."startsAt" DESC) AS rn
      FROM "class_sessions" s
      JOIN "classes" c ON c."id" = s."classId"
      WHERE c."status" IN ('OPEN', 'IN_PROGRESS') ${teacherFilter}
        AND s."status" <> 'CANCELLED'
        AND EXISTS (SELECT 1 FROM "attendances" x WHERE x."sessionId" = s."id")
    )
    SELECT r."classId", c."code" AS "classCode", r.rn, a."studentId", a."status", u."fullName" AS "studentName"
    FROM recent r
    JOIN "classes" c ON c."id" = r."classId"
    JOIN "attendances" a ON a."sessionId" = r."id"
    JOIN "users" u ON u."id" = a."studentId"
    WHERE r.rn <= 2
    ORDER BY c."code", r.rn, u."fullName"`);

  const byClass = new Map<string, { code: string; sessions: Map<number, { studentId: string; status: AttendanceStatus }[]> }>();
  const names = new Map<string, string>();
  for (const r of rows) {
    names.set(r.studentId, r.studentName);
    const c = byClass.get(r.classId) ?? { code: r.classCode, sessions: new Map() };
    byClass.set(r.classId, c);
    const rn = Number(r.rn);
    c.sessions.set(rn, [...(c.sessions.get(rn) ?? []), { studentId: r.studentId, status: r.status }]);
  }
  return [...byClass.entries()].flatMap(([classId, c]) => {
    const sessions = [1, 2].flatMap((rn) => (c.sessions.has(rn) ? [{ cancelled: false, records: c.sessions.get(rn)! }] : []));
    return consecutiveAbsentees(sessions).map((studentId) => ({ classId, classCode: c.code, studentId, studentName: names.get(studentId) ?? "—" }));
  });
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
      attitude: true,
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
